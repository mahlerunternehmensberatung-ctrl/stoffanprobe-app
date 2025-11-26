import type { VercelRequest, VercelResponse } from '@vercel/node';
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
 * Builds a prompt for Nano Banana Pro Edit when pattern image is available
 * Format: "Apply the pattern from the second image onto the [category] in the first image..."
 */
const buildPromptWithPattern = (
  preset: string | undefined,
  textHint: string | undefined
): string => {
  const category = getCategoryName(preset);
  
  let prompt = `Apply the pattern from the second image onto the ${category} in the first image. Keep the rest of the first image exactly as it is. Photorealistic, high quality.`;
  
  // Add user hint if provided
  if (textHint && textHint.trim()) {
    prompt += ` Additional instruction: "${textHint.trim()}"`;
  }
  
  return prompt;
};

/**
 * Builds a prompt for Nano Banana Pro Edit when NO pattern image is available
 * Format: "Change the [category] in the image to be [description]..."
 */
const buildPromptWithoutPattern = (
  preset: string | undefined,
  textHint: string | undefined
): string => {
  const category = getCategoryName(preset);
  
  let prompt = `Change the ${category} in the image to be the specified pattern texture. Keep the rest of the room unchanged.`;
  
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
  let colorDescription = 'the specified color';
  if (wallColor) {
    colorDescription = `${wallColor.name} (RAL ${wallColor.code})`;
  }
  
  let prompt = `Change the walls in the image to be painted ${colorDescription}. Keep the rest of the room unchanged.`;
  
  if (textHint && textHint.trim()) {
    prompt += ` Additional instruction: "${textHint.trim()}"`;
  }
  
  return prompt;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, roomImage, patternImage, preset, mode, wallColor, textHint } = req.body;

    // Validate required inputs
    if (!roomImage) {
      return res.status(400).json({ error: 'Room image is required' });
    }

    if (!process.env.FAL_KEY) {
      return res.status(500).json({ error: 'FAL_KEY is not configured' });
    }

    // Build image_urls array: roomImage first, patternImage second (if available)
    // CRITICAL: This model expects image_urls (plural!) as an array
    const imageUrls: string[] = [roomImage];
    if (patternImage) {
      imageUrls.push(patternImage);
    }

    // Build the appropriate prompt based on mode and available images
    let finalPrompt = prompt;
    
    if (!finalPrompt) {
      if (mode === 'pattern') {
        if (patternImage) {
          // Pattern image available: Use "Apply pattern from second image" format
          finalPrompt = buildPromptWithPattern(preset, textHint);
        } else {
          // No pattern image: Use generic description
          finalPrompt = buildPromptWithoutPattern(preset, textHint);
        }
      } else if (mode === 'creativeWallColor') {
        finalPrompt = buildWallColorPrompt(wallColor, textHint);
      } else {
        // Fallback
        finalPrompt = buildPromptWithoutPattern(preset, textHint);
      }
    }

    // WICHTIG: Wir nutzen das "Nano Banana" Modell (Standard, nicht Pro!), 
    // da dies für Inpainting/Editing optimiert ist.
    const modelId = 'fal-ai/nano-banana/edit';
    
    // Nano Banana erwartet image_urls als Array für mehrere Bilder
    const result = await fal.subscribe(modelId, {
      input: {
        prompt: finalPrompt,
        image_urls: imageUrls.filter(Boolean), // Array mit allen Bildern
        sync_mode: true, // Synchroner Modus für bessere Kontrolle
      },
      logs: true,
    });

    // Extract image URL from result
    const apiResult = result as FalApiResponse;
    const imageUrl = apiResult.images?.[0]?.url || apiResult.image?.url || '';

    if (!imageUrl) {
      throw new Error('No image URL returned from Nano Banana API');
    }

    return res.status(200).json({ imageUrl });
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

    return res.status(500).json({ error: errorMessage });
  }
}
