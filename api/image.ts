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
  mask?: { url: string };
}

/**
 * Generates a mask prompt based on the preset type
 */
const getMaskPrompt = (preset?: string): string => {
  switch (preset) {
    case 'Tapete':
      return 'walls, vertical wall surfaces, wall areas';
    case 'Gardine':
      return 'curtains, window areas, drapery, window treatments';
    case 'Teppich':
      return 'floor, carpet area, rug area, ground surface';
    case 'Möbel':
      return 'furniture, chairs, sofas, tables, furniture pieces';
    case 'Accessoire':
      return 'decorative objects, accessories, small items on surfaces';
    default:
      return 'walls, vertical surfaces';
  }
};

/**
 * Generates an inpainting mask using a segmentation model
 * Falls back to a simple prompt-based approach if segmentation fails
 */
const generateMask = async (
  roomImage: string,
  maskPrompt: string
): Promise<string> => {
  try {
    // Try using a segmentation model to generate the mask
    // fal-ai/metaseg can be used for automatic masking
    const result = await fal.subscribe('fal-ai/metaseg', {
      input: {
        image_url: roomImage,
        prompt: maskPrompt,
      },
    });

    // Extract mask from result
    const apiResult = result as FalApiResponse;
    const maskUrl = apiResult.mask?.url || apiResult.image?.url || '';
    
    if (maskUrl) {
      return maskUrl;
    }
  } catch (error) {
    console.warn('Mask generation failed, will use automatic masking:', error);
  }

  // Fallback: Return empty string to use automatic masking in inpainting model
  return '';
};

export async function POST(request: Request) {
  try {
    const { prompt, roomImage, patternImage, preset, mode } = await request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    // Build input for Fal.ai Inpainting model
    // Using flux/dev/inpainting for high-quality inpainting
    const input: any = {
      prompt: prompt,
      image_url: roomImage,
      num_inference_steps: 30,
      guidance_scale: 7.5,
      seed: null, // Random seed for variety
    };

    // Generate mask based on preset if pattern mode
    if (mode === 'pattern' && preset) {
      const maskPrompt = getMaskPrompt(preset);
      
      try {
        const maskUrl = await generateMask(roomImage, maskPrompt);
        if (maskUrl) {
          input.mask_image_url = maskUrl;
        } else {
          // Use automatic masking with prompt-based description
          input.mask_prompt = maskPrompt;
        }
      } catch (error) {
        console.warn('Mask generation failed, using prompt-based masking:', error);
        input.mask_prompt = maskPrompt;
      }
    } else if (mode === 'creativeWallColor' || mode === 'exactRAL') {
      // For wall color modes, mask the walls
      input.mask_prompt = 'walls, vertical wall surfaces';
    }

    // Add pattern image as reference if provided
    if (patternImage) {
      // Some models support image_to_image_url for reference
      input.image_to_image_url = patternImage;
      // Or use control_image_url depending on the model
      input.control_image_url = patternImage;
    }

    // Use flux/dev/inpainting for high-quality texture replacement
    // Alternative models to try if this doesn't work:
    // - 'fal-ai/fast-sdxl/inpainting' (faster, lower quality)
    // - 'fal-ai/flux-pro/v1.1/inpainting' (if available)
    // - 'fal-ai/stable-diffusion-inpainting' (alternative)
    // Note: Model parameters may vary - check Fal.ai documentation for exact parameter names
    const modelId = 'fal-ai/flux/dev/inpainting';
    
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
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
