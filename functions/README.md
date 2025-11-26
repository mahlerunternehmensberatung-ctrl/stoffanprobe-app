# Firebase Cloud Functions für Stoffanprobe

## Setup

### 1. Dependencies installieren

```bash
cd functions
npm install
```

### 2. FAL_KEY konfigurieren

**Option A: Firebase Functions Config (empfohlen)**
```bash
firebase functions:config:set fal.key="YOUR_FAL_KEY"
```

**Option B: Environment Variable (für lokale Entwicklung)**
```bash
# Erstellen Sie functions/.env
echo "FAL_KEY=your_fal_key_here" > functions/.env
```

### 3. Build

```bash
npm run build
```

### 4. Lokal testen

```bash
npm run serve
```

### 5. Deployen

```bash
npm run deploy
```

Oder nur die generateImage Function:
```bash
firebase deploy --only functions:generateImage
```

## Funktionen

### generateImage

Generiert ein Bild mit Fal.ai unter Verwendung des `nano-banana/edit` Modells (optimiert für Inpainting/Editing).

**Parameter:**
- `roomImage` (string, required): URL zum Raum-Bild
- `patternImage` (string, optional): URL zum Stoff-Bild
- `preset` (string, optional): Preset-Typ (Gardine, Tapete, etc.)
- `mode` (string, optional): Visualisierungsmodus
- `wallColor` (object, optional): Wandfarbe
- `textHint` (string, optional): Zusätzlicher Text-Hint
- `prompt` (string, optional): Vordefinierter Prompt

**Rückgabe:**
```json
{
  "success": true,
  "imageUrl": "https://..."
}
```

**Fehler:**
- `unauthenticated`: User nicht angemeldet
- `invalid-argument`: Fehlende Parameter
- `internal`: Server-Fehler

## Modell

- **Modell:** `fal-ai/nano-banana/edit` (Standard, nicht Pro!)
- **Optimiert für:** Inpainting/Editing
- **Parameter:** `image_urls` (Array), `sync_mode: true`

## Monitoring

```bash
# Logs anzeigen
firebase functions:log

# Spezifische Function
firebase functions:log --only generateImage
```

