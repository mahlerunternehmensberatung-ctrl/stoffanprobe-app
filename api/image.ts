import { fal } from '@fal-ai/serverless-client';

// Configure fal client with API key (if available)
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY,
  });
}

export async function POST(request: Request) {
  try {
    const { prompt, roomImage, patternImage } = await request.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!process.env.FAL_KEY) {
      return new Response(
        JSON.stringify({ error: 'FAL_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build input for Fal.ai - use a model that supports image inputs if available
    // For now, we'll use fast-sdxl which may need to be changed to a model that supports image inputs
    const input: any = {
      prompt: prompt,
    };

    // Add images if provided (convert data URLs to base64 if needed)
    if (roomImage) {
      input.image_url = roomImage; // or use the appropriate field name for the model
    }
    if (patternImage) {
      input.image_url_2 = patternImage; // or use the appropriate field name for the model
    }

    const result = await fal.subscribe('fal-ai/fast-sdxl', {
      input: input,
    });

    // Extract image URL from result
    const imageUrl = result.images?.[0]?.url || result.image?.url || '';

    return new Response(
      JSON.stringify({ imageUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in image API:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

