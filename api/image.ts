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
 * Builds a STRICT texture transfer prompt
 * Format: "Based on the original image, change ONLY the texture of [category]..."
 */
const buildStrictTextureTransferPrompt = (
  preset: string | undefined,
  textHint: string | undefined,
  hasPatternImage: boolean
): string => {
  const category = getCategoryName(preset);
  
  // Describe the pattern - if we have an image, mention it; otherwise use generic description
  let patternDescription = '';
  if (hasPatternImage) {
    patternDescription = 'the pattern from the provided sample image';
  } else {
    patternDescription = 'the specified pattern';
  }
  
  // STRICT prompt format as required
  let prompt = `Based on the original image, change ONLY the texture of the ${category} to be ${patternDescription}. Keep all furniture, lighting, perspective, and details of the original image exactly the same. High fidelity texture transfer.`;
  
  // Add user hint if provided
  if (textHint && textHint.trim()) {
    prompt += ` Additional instruction: "${textHint.trim()}"`;
  }
  
  return prompt;
};

/**
 * Builds a STRICT wall color prompt
 */
const buildStrictWallColorPrompt = (
  wallColor: { name: string; code: string } | undefined,
  textHint: string | undefined
): string => {
  let colorDescription = 'the specified color';
  if (wallColor) {
    colorDescription = `${wallColor.name} (RAL ${wallColor.code})`;
  }
  
  // STRICT prompt format
  let prompt = `Based on the original image, change ONLY the wall color to ${colorDescription}. Keep all furniture, lighting, perspective, and details of the original image exactly the same. High fidelity color transfer.`;
  
  if (textHint && textHint.trim()) {
    prompt += ` Additional instruction: "${textHint.trim()}"`;
  }
  
  return prompt;
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

    // Build the STRICT prompt based on mode
    let finalPrompt = prompt;
    
    if (!finalPrompt) {
      // Generate STRICT prompt if not provided
      if (mode === 'pattern') {
        finalPrompt = buildStrictTextureTransferPrompt(preset, textHint, !!patternImage);
      } else if (mode === 'creativeWallColor') {
        finalPrompt = buildStrictWallColorPrompt(wallColor, textHint);
      } else {
        // Fallback
        finalPrompt = buildStrictTextureTransferPrompt(preset, textHint, !!patternImage);
      }
    }

    // Build input for Fal.ai Image-to-Image model
    // CRITICAL: Use LOW strength (0.65-0.7) to force model to stay close to original
    // Higher values (>0.8) lead to fantasy images that ignore the original
    const input: any = {
      prompt: finalPrompt,
      image_url: roomImage, // MANDATORY: Original room photo
      strength: 0.65, // CRITICAL: Low strength = high fidelity to original
                      // Range: 0.0 (no change) to 1.0 (complete regeneration)
                      // 0.65 = tight control, minimal changes
      num_inference_steps: 30,
      guidance_scale: 7.5,
      seed: null,
    };

    // Try to pass pattern image as reference
    // Different models may support different parameter names
    if (patternImage) {
      // Try common parameter names for reference images
      input.control_image_url = patternImage;
      input.reference_image_url = patternImage;
      input.image_to_image_url = patternImage;
      
      // Some models support mask_image for texture reference
      // Note: This might not work for all models, but we try it
      input.mask_image_url = patternImage;
    }

    // Use flux/dev/image-to-image for texture transfer
    // This model is designed for image-to-image transformations
    // Alternative: 'fal-ai/flux-pro/v1.1/image-to-image' if available
    const modelId = 'fal-ai/flux/dev/image-to-image';
    
    const result = await fal.subscribe(modelId, {
      input: input,
    });

    // Extract image URL from result
    const apiResult = result as FalApiResponse;
    const imageUrl = apiResult.images?.[0]?.url || apiResult.image?.url || '';

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
