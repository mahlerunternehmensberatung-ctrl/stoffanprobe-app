import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as fal from '@fal-ai/serverless-client';

// Initialize Firebase Admin
admin.initializeApp();

// Configure Fal.ai with API key from environment
const FAL_KEY = functions.config().fal?.key || process.env.FAL_KEY;
if (FAL_KEY) {
  fal.config({
    credentials: FAL_KEY,
  });
}

/**
 * Firebase Cloud Function: generateImage
 * 
 * Generiert ein Bild mit Fal.ai unter Verwendung des Nano Banana Modells.
 * 
 * WICHTIG: Wir nutzen das "Nano Banana" Modell (Standard, nicht Pro!), 
 * da dies für Inpainting/Editing optimiert ist.
 * 
 * Model: fal-ai/nano-banana/edit (optimiert für Inpainting)
 * 
 * @param roomImage - URL zum Raum-Bild (aus Firebase Storage)
 * @param patternImage - URL zum Stoff-Bild (optional, aus Firebase Storage)
 * @param preset - Preset-Typ (Gardine, Tapete, etc.)
 * @param mode - Visualisierungsmodus
 * @param wallColor - Wandfarbe (optional)
 * @param textHint - Zusätzlicher Text-Hint
 * @param prompt - Optional: Vordefinierter Prompt
 */
export const generateImage = functions.https.onCall(async (data, context) => {
  // Authentifizierung prüfen
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Der Benutzer muss angemeldet sein.'
    );
  }

  const { roomImage, patternImage, preset, mode, wallColor, textHint, prompt } = data;

  // Validierung
  if (!roomImage) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Raum-Bild ist erforderlich.'
    );
  }

  if (!FAL_KEY) {
    throw new functions.https.HttpsError(
      'internal',
      'FAL_KEY ist nicht konfiguriert.'
    );
  }

  try {
    // Bild-URLs sammeln
    const imageUrls: string[] = [roomImage];
    if (patternImage) {
      imageUrls.push(patternImage);
    }

    // Prompt generieren
    let finalPrompt = prompt;
    
    if (!finalPrompt) {
      finalPrompt = buildPrompt(preset, mode, wallColor, textHint, !!patternImage);
    }

    // WICHTIG: Wir nutzen das "Nano Banana" Modell (Standard, nicht Pro!), 
    // da dies für Inpainting/Editing optimiert ist.
    const modelId = 'fal-ai/nano-banana/edit';
    
    // Fal.ai API Call mit Nano Banana
    // Nano Banana erwartet image_urls als Array für mehrere Bilder
    const input: any = {
      prompt: finalPrompt,
      image_urls: imageUrls.filter(Boolean), // Array mit allen Bildern
      sync_mode: true, // Synchroner Modus für bessere Kontrolle
    };

    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
    });

    // Ergebnis extrahieren
    const imageUrl = (result as any).images?.[0]?.url || (result as any).image?.url || '';

    if (!imageUrl) {
      throw new Error('Kein Bild von Fal.ai zurückgegeben.');
    }

    return {
      success: true,
      imageUrl,
    };
  } catch (error: any) {
    console.error('Error in generateImage function:', error);
    
    let errorMessage = 'Fehler bei der Bildgenerierung';
    if (error.message) {
      errorMessage = error.message;
    }

    throw new functions.https.HttpsError(
      'internal',
      errorMessage
    );
  }
});

/**
 * Baut den Prompt basierend auf Preset, Mode und anderen Parametern
 */
function buildPrompt(
  preset: string | undefined,
  mode: string | undefined,
  wallColor: any,
  textHint: string | undefined,
  hasPatternImage: boolean
): string {
  if (mode === 'pattern' && hasPatternImage) {
    const category = getCategoryName(preset);
    let prompt = `Apply the pattern from the second image onto the ${category} in the first image. Keep the rest of the first image exactly as it is. Photorealistic, high quality.`;
    if (textHint?.trim()) {
      prompt += ` Additional instruction: "${textHint.trim()}"`;
    }
    return prompt;
  }

  if (mode === 'creativeWallColor' && wallColor) {
    const colorDesc = `${wallColor.name} (RAL ${wallColor.code})`;
    let prompt = `Change the walls in the image to be painted ${colorDesc}. Do NOT paint the ceiling - only the walls. The ceiling must remain in its original color. Keep the rest of the room unchanged.`;
    if (textHint?.trim()) {
      prompt += ` Additional instruction: "${textHint.trim()}"`;
    }
    return prompt;
  }

  // Fallback
  const category = getCategoryName(preset);
  let prompt = `Change the ${category} in the image to match the specified style. Keep the rest of the room unchanged.`;
  if (textHint?.trim()) {
    prompt += ` Additional instruction: "${textHint.trim()}"`;
  }
  return prompt;
}

function getCategoryName(preset: string | undefined): string {
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
}

