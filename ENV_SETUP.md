# Umgebungsvariablen Setup

## Firebase-Konfiguration

Die Firebase-Konfiguration ist bereits in `services/firebase.ts` mit den Standard-Werten hinterlegt. 
Für Produktion sollten Sie eine `.env` Datei erstellen.

## .env Datei erstellen

Erstellen Sie eine `.env` Datei im Projekt-Root mit folgenden Werten:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyB09E6YIwZN85fEWzDtFkcOkw3t6tvg278
VITE_FIREBASE_AUTH_DOMAIN=stoffanprobe-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=stoffanprobe-app
VITE_FIREBASE_STORAGE_BUCKET=stoffanprobe-app.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=161327831192
VITE_FIREBASE_APP_ID=1:161327831192:web:ec748acf72fbf06288d8ed
VITE_FIREBASE_MEASUREMENT_ID=G-HL9EV45ZFK

# Google Analytics 4 (optional - verwendet automatisch VITE_FIREBASE_MEASUREMENT_ID falls nicht gesetzt)
VITE_GA4_MEASUREMENT_ID=G-HL9EV45ZFK

# Stripe (für Pro-Plan - optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PRO_PLAN_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_SUCCESS_URL=http://localhost:3000
STRIPE_CANCEL_URL=http://localhost:3000
```

## Wichtig

- Die `.env` Datei sollte **NICHT** in Git committed werden (sollte bereits in `.gitignore` sein)
- Die Standard-Werte in `services/firebase.ts` funktionieren für Entwicklung
- Für Produktion: Verwenden Sie die `.env` Datei mit den korrekten Werten

## Firebase Analytics

Firebase Analytics wird automatisch initialisiert, wenn im Browser-Umfeld ausgeführt.
Die Measurement ID wird automatisch aus der Firebase-Konfiguration übernommen.

