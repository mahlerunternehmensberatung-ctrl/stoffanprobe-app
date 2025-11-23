import * as fal from '@fal-ai/serverless-client';

// Configure fal client with API key (if available)
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY,
  });
}

// Type definitions for Fal.ai API responses
interface FalApiResponse {
  images?: Array<{ url: string }>;
  image?: { url: string };
}

/**
 * Maps preset to category name in English
 */
const getCategoryName = (preset: string | undefined): string => {
  switch (preset) {
    case 'Tapete':
      return 'walls';
    case 'Gardine':
      return 'curtains';
    case 'Teppich':
      return 'floor carpet';
    case 'Möbel':
      return 'furniture upholstery';
    case 'Accessoire':
      return 'decorative accessories';
    default:
      return 'walls';
  }
};

/**
 * Builds a photorealistic prompt for texture transfer
 * Format: "A photorealistic photo of the provided room. The [category] has been replaced..."
 */
const buildPhotorealisticPrompt = (
  preset: string | undefined,
  textHint: string | undefined,
  hasPatternImage: boolean
): string => {
  const category = getCategoryName(preset);
  
  // Describe the pattern
  let patternDescription = '';
  if (hasPatternImage) {
    patternDescription = 'the pattern texture from the provided sample image';
  } else {
    patternDescription = 'the specified pattern texture';
  }
  
  // Business-logic prompt format
  let prompt = `A photorealistic photo of the provided room. The ${category} has been replaced with ${patternDescription}. The rest of the room (furniture, walls, lighting) remains UNCHANGED.`;
  
  // Add user hint if provided
  if (textHint && textHint.trim()) {
    prompt += ` Additional instruction: "${textHint.trim()}"`;
  }
  
  return prompt;
};

/**
 * Builds a photorealistic wall color prompt
 */
const buildPhotorealisticWallColorPrompt = (
  wallColor: { name: string; code: string } | undefined,
  textHint: string | undefined
): string => {
  let colorDescription = 'the specified color';
  if (wallColor) {
    colorDescription = `${wallColor.name} (RAL ${wallColor.code})`;
  }
  
  let prompt = `A photorealistic photo of the provided room. The walls have been painted ${colorDescription}. The rest of the room (furniture, lighting) remains UNCHANGED.`;
  
  if (textHint && textHint.trim()) {
    prompt += ` Additional instruction: "${textHint.trim()}"`;
  }
  
  return prompt;
};

/**
 * Attempts to use Google Imagen 3 (Nano Banana equivalent) via Fal.ai
 * Returns null if model is not available or fails
 */
const tryImagen3 = async (
  prompt: string,
  roomImage: string,
  patternImage: string | undefined
): Promise<string | null> => {
  try {
    // Try Google Imagen 3 models on Fal.ai
    // Common model IDs: 'fal-ai/imagen3', 'google/imagen-3', etc.
    const imagenModels = [
      'fal-ai/imagen3',
      'google/imagen-3',
      'fal-ai/google-imagen3',
    ];

    for (const modelId of imagenModels) {
      try {
        const input: any = {
          prompt: prompt,
          image_url: roomImage, // Source image (room)
        };

        // Add pattern image if available
        if (patternImage) {
          // Try different parameter names for reference images
          input.reference_image_url = patternImage;
          input.control_image_url = patternImage;
          input.source_image = patternImage;
        }

        const result = await fal.subscribe(modelId, {
          input: input,
        });

        const apiResult = result as FalApiResponse;
        const imageUrl = apiResult.images?.[0]?.url || apiResult.image?.url || '';

        if (imageUrl) {
          console.log(`Successfully used ${modelId}`);
          return imageUrl;
        }
      } catch (error: any) {
        // Model not available or failed, try next one
        console.log(`Model ${modelId} not available or failed:`, error.message);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.warn('Imagen 3 attempt failed:', error);
    return null;
  }
};

/**
 * Uses Flux Image-to-Image with STRICT parameters to prevent hallucination
 */
const useFluxImageToImage = async (
  prompt: string,
  roomImage: string,
  patternImage: string | undefined
): Promise<string> => {
  // Build input with STRICT parameters against hallucination
  const input: any = {
    prompt: prompt,
    image_url: roomImage, // MANDATORY: Original room photo (HEILIG)
    strength: 0.7, // CRITICAL: 0.65-0.75 range to prevent hallucination
                  // Higher values (>0.75) cause the AI to paint a new room
                  // Lower values (<0.65) may not apply texture changes
    num_inference_steps: 30,
    guidance_scale: 7.5,
    seed: null,
  };

  // Add pattern image as reference (KEY - must not be ignored!)
  if (patternImage) {
    // Try multiple parameter names to ensure pattern is used
    input.control_image_url = patternImage;
    input.reference_image_url = patternImage;
    input.image_to_image_url = patternImage;
    input.mask_image_url = patternImage;
  }

  // Use flux/dev/image-to-image (NOT text-to-image!)
  const modelId = 'fal-ai/flux/dev/image-to-image';
  
  const result = await fal.subscribe(modelId, {
    input: input,
  });

  const apiResult = result as FalApiResponse;
  const imageUrl = apiResult.images?.[0]?.url || apiResult.image?.url || '';

  if (!imageUrl) {
    throw new Error('No image URL returned from Flux API');
  }

  return imageUrl;
};

export async function POST(request: Request) {
  try {
    const { prompt, roomImage, patternImage, preset, mode, wallColor, textHint } = await request.json();

    // Validate required inputs
    if (!roomImage) {
      return new Response(
        JSON.stringify({ error: 'Room image is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.FAL_KEY) {
      return new Response(
        JSON.stringify({ error: 'FAL_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build the photorealistic prompt based on mode
    let finalPrompt = prompt;
    
    if (!finalPrompt) {
      // Generate photorealistic prompt if not provided
      if (mode === 'pattern') {
        finalPrompt = buildPhotorealisticPrompt(preset, textHint, !!patternImage);
      } else if (mode === 'creativeWallColor') {
        finalPrompt = buildPhotorealisticWallColorPrompt(wallColor, textHint);
      } else {
        // Fallback
        finalPrompt = buildPhotorealisticPrompt(preset, textHint, !!patternImage);
      }
    }

    let imageUrl: string;

    // PRIORITY 1: Try Google Imagen 3 (Nano Banana equivalent) first
    // This is the customer-confirmed best quality model
    if (mode === 'pattern' && patternImage) {
      const imagenResult = await tryImagen3(finalPrompt, roomImage, patternImage);
      if (imagenResult) {
        imageUrl = imagenResult;
      } else {
        // FALLBACK: Use Flux with STRICT parameters
        console.log('Imagen 3 not available, falling back to Flux with strict parameters');
        imageUrl = await useFluxImageToImage(finalPrompt, roomImage, patternImage);
      }
    } else {
      // For wall color or other modes, use Flux directly
      // (Imagen 3 may not support all modes)
      imageUrl = await useFluxImageToImage(finalPrompt, roomImage, patternImage);
    }

    if (!imageUrl) {
      throw new Error('No image URL returned from API');
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in image API:', error);
    
    // Provide more detailed error messages
    let errorMessage = 'Internal server error';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
