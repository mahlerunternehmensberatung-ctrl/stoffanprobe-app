# Fal.ai Integration Setup

## Übersicht

Die App nutzt Fal.ai für die KI-Bildgenerierung mit zwei Optionen:
1. **Firebase Cloud Function** (empfohlen für Produktion) - schützt API Key
2. **Vercel API Route** (Fallback) - `/api/image`

## Modell-Auswahl

### Aktuell verwendet: `fal-ai/nano-banana/edit`
- **Kosten:** Kosteneffizient
- **Qualität:** Optimiert für Inpainting/Editing
- **Geschwindigkeit:** Schnell
- **WICHTIG:** Standard-Version (nicht Pro!), da diese für Inpainting optimiert ist

## Firebase Cloud Function Setup

### 1. Firebase Functions initialisieren

```bash
cd functions
npm install
```

### 2. FAL_KEY konfigurieren

**Option A: Firebase Functions Config (empfohlen)**
```bash
firebase functions:config:set fal.key="YOUR_FAL_KEY"
```

**Option B: Environment Variable**
```bash
# In functions/.env
FAL_KEY=your_fal_key_here
```

### 3. Functions deployen

```bash
npm run build
firebase deploy --only functions:generateImage
```

### 4. Funktion testen

Die Cloud Function ist automatisch verfügbar unter:
```
https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/generateImage
```

## Vercel API Route (Fallback)

Die bestehende `/api/image.ts` Route funktioniert weiterhin als Fallback.

**Wichtig:** Der FAL_KEY muss in Vercel Environment Variables gesetzt sein:
- Variable: `FAL_KEY`
- Wert: Ihr Fal.ai API Key

## Frontend-Integration

Der `aiService.ts` nutzt automatisch:
- **Cloud Function** wenn User angemeldet ist
- **Vercel API Route** als Fallback

## Credit-Abzug

Der Credit-Abzug erfolgt **NUR** nach erfolgreicher Bildgenerierung:
1. Bild wird generiert
2. Wenn erfolgreich → Credit wird abgezogen
3. Bei Fehler → Kein Credit-Abzug

## Modell-Konfiguration

### Aktuelle Einstellungen:
- **Modell:** `fal-ai/nano-banana/edit` (Standard, nicht Pro!)
- **image_urls:** Array mit allen Bildern (Raum + optional Stoff)
- **sync_mode:** true (synchroner Modus für bessere Kontrolle)
- **prompt:** Automatisch generiert basierend auf Preset und Mode

### WICHTIG:
Das Nano Banana Modell ist speziell für Inpainting/Editing optimiert und erwartet:
- `image_urls` als Array (nicht `image_url` als einzelner Wert)
- `sync_mode: true` für synchronen Betrieb

## Troubleshooting

### Problem: "FAL_KEY ist nicht konfiguriert"

**Lösung:**
- Prüfen Sie Firebase Functions Config: `firebase functions:config:get`
- Oder setzen Sie Environment Variable in Vercel

### Problem: Cloud Function funktioniert nicht

**Lösung:**
- Prüfen Sie, ob Functions deployt sind: `firebase functions:list`
- Prüfen Sie Logs: `firebase functions:log`
- Fallback: App nutzt automatisch Vercel API Route

### Problem: Bilder werden nicht generiert

**Lösung:**
- Prüfen Sie Fal.ai API Status
- Prüfen Sie, ob Bild-URLs erreichbar sind (Firebase Storage)
- Prüfen Sie Browser-Konsole für Fehler

## Nächste Schritte

- [ ] Firebase Functions deployen
- [ ] FAL_KEY in Firebase Functions Config setzen
- [ ] Testen der Cloud Function
- [ ] Monitoring für Kosten einrichten
- [ ] Optional: Modell basierend auf User-Plan wählen (Free vs Pro)

