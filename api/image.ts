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
 * Generates a professional prompt for texture transfer
 * Ensures the original room structure is preserved
 */
const buildTextureTransferPrompt = (
  preset: string | undefined,
  textHint: string | undefined,
  hasPatternImage: boolean
): string => {
  // Base instruction to preserve the original room
  const preservationInstruction = "Keep the original room photo structure EXACTLY. Preserve all furniture, lighting, perspective, camera angle, and room layout. Only modify the texture/pattern on the specified area.";
  
  let categoryDescription = '';
  let textureDescription = '';
  
  switch (preset) {
    case 'Tapete':
      categoryDescription = 'walls';
      textureDescription = hasPatternImage 
        ? 'wallpaper pattern from the provided sample' 
        : 'the specified wallpaper pattern';
      break;
    case 'Gardine':
      categoryDescription = 'curtains and window treatments';
      textureDescription = hasPatternImage 
        ? 'fabric pattern from the provided sample' 
        : 'the specified fabric pattern';
      break;
    case 'Teppich':
      categoryDescription = 'floor carpet or rug area';
      textureDescription = hasPatternImage 
        ? 'carpet pattern from the provided sample' 
        : 'the specified carpet pattern';
      break;
    case 'Möbel':
      categoryDescription = 'furniture upholstery';
      textureDescription = hasPatternImage 
        ? 'fabric pattern from the provided sample' 
        : 'the specified fabric pattern';
      break;
    case 'Accessoire':
      categoryDescription = 'decorative accessories';
      textureDescription = hasPatternImage 
        ? 'pattern from the provided sample' 
        : 'the specified pattern';
      break;
    default:
      categoryDescription = 'walls';
      textureDescription = hasPatternImage 
        ? 'pattern from the provided sample' 
        : 'the specified pattern';
  }
  
  // Build the main prompt
  let prompt = `A professional interior design photo. The ${categoryDescription} feature ${textureDescription}. ${preservationInstruction} High quality, photorealistic, maintain original furniture positions, lighting conditions, and room perspective.`;
  
  // Add user hint if provided
  if (textHint && textHint.trim()) {
    prompt += ` Additional instruction: "${textHint.trim()}"`;
  }
  
  return prompt;
};

/**
 * Builds a prompt for wall color changes
 */
const buildWallColorPrompt = (
  wallColor: { name: string; code: string } | undefined,
  textHint: string | undefined
): string => {
  const preservationInstruction = "Keep the original room photo structure EXACTLY. Preserve all furniture, lighting, perspective, camera angle, and room layout. Only change the wall color.";
  
  let colorDescription = 'a harmonious color';
  if (wallColor) {
    colorDescription = `${wallColor.name} (RAL ${wallColor.code})`;
  }
  
  let prompt = `A professional interior design photo. The walls are painted in ${colorDescription}. ${preservationInstruction} High quality, photorealistic, maintain original furniture positions, lighting conditions, and room perspective.`;
  
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

    // Build the appropriate prompt based on mode
    let finalPrompt = prompt;
    
    if (!finalPrompt) {
      // Generate prompt if not provided
      if (mode === 'pattern' || mode === 'creativeWallColor') {
        if (mode === 'pattern') {
          finalPrompt = buildTextureTransferPrompt(preset, textHint, !!patternImage);
        } else {
          finalPrompt = buildWallColorPrompt(wallColor, textHint);
        }
      } else {
        // Fallback for other modes
        finalPrompt = buildTextureTransferPrompt(preset, textHint, !!patternImage);
      }
    }

    // Build input for Fal.ai Image-to-Image model
    // Using flux/dev/image-to-image for high-quality texture transfer
    // This model preserves the original image structure better than text-to-image
    const input: any = {
      prompt: finalPrompt,
      image_url: roomImage, // Original room photo - MUST be provided
      strength: 0.8, // Critical: Controls how much the original is preserved
                     // 0.8 = strong preservation of original structure
                     // Range: 0.0 (no change) to 1.0 (complete regeneration)
      num_inference_steps: 30,
      guidance_scale: 7.5,
      seed: null, // Random seed for variety
    };

    // Add pattern image as reference if provided
    // Some models support control_image_url or image_to_image_url for reference images
    if (patternImage) {
      // Try multiple parameter names depending on model support
      input.control_image_url = patternImage;
      input.image_to_image_url = patternImage;
      // Some models might use reference_image_url
      input.reference_image_url = patternImage;
    }

    // Use flux/dev/image-to-image for texture transfer
    // This model is specifically designed to preserve the original image structure
    // Alternative models to try if this doesn't work:
    // - 'fal-ai/flux-pro/v1.1/image-to-image' (if available)
    // - 'fal-ai/fast-sdxl/image-to-image' (faster, lower quality)
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
