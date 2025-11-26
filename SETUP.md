# Setup-Anleitung: Stoffanprobe Freemium-System

Diese Anleitung beschreibt, wie Sie das Freemium-System mit Firebase Auth, Firestore und Stripe einrichten.

## 1. Firebase Setup

### 1.1 Firebase-Projekt erstellen

1. Gehen Sie zur [Firebase Console](https://console.firebase.google.com/)
2. Erstellen Sie ein neues Projekt oder wählen Sie ein bestehendes aus
3. Aktivieren Sie folgende Services:
   - **Authentication** (E-Mail/Passwort)
   - **Firestore Database**
   - **Storage** (optional, für Bild-Uploads)

### 1.2 Firebase-Konfiguration

1. Gehen Sie zu **Projekteinstellungen** > **Allgemein**
2. Scrollen Sie zu "Ihre Apps" und kopieren Sie die Firebase-Konfiguration
3. Erstellen Sie eine `.env`-Datei im Projekt-Root:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
```

### 1.3 Firestore Security Rules

Setzen Sie folgende Security Rules in der Firestore Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users Collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Verhindere, dass Credits erhöht werden können
      allow update: if request.auth != null 
        && request.auth.uid == userId
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['credits'])
            || request.resource.data.credits <= resource.data.credits);
    }
    
    // Sessions Collection (falls Sie Firestore für Sessions verwenden möchten)
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 1.4 Storage Security Rules (optional)

Falls Sie Firebase Storage verwenden:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 2. Stripe Setup

### 2.1 Stripe-Account erstellen

1. Erstellen Sie einen Account auf [stripe.com](https://stripe.com)
2. Gehen Sie zum **Dashboard** > **Entwickler** > **API-Schlüssel**
3. Kopieren Sie den **Publishable Key** und **Secret Key**

### 2.2 Stripe-Produkt erstellen

1. Gehen Sie zu **Produkte** > **Neues Produkt hinzufügen**
2. Erstellen Sie ein Abo-Produkt:
   - Name: "Pro Plan"
   - Preis: 29,00 € / Monat
   - Kopieren Sie die **Price ID** (z.B. `price_xxxxx`)

### 2.3 Stripe Webhook einrichten

1. Gehen Sie zu **Entwickler** > **Webhooks**
2. Klicken Sie auf **Webhook hinzufügen**
3. Endpoint-URL: `https://ihre-domain.com/api/stripe/webhook`
4. Wählen Sie folgende Events:
   - `checkout.session.completed`
   - `customer.subscription.deleted` (optional)
   - `invoice.payment_failed` (optional)
5. Kopieren Sie den **Webhook Secret**

### 2.4 Umgebungsvariablen

Fügen Sie folgende Variablen zu Ihrer `.env`-Datei hinzu:

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PRO_PLAN_PRICE_ID=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe URLs (für Checkout Success/Cancel)
STRIPE_SUCCESS_URL=https://ihre-domain.com
STRIPE_CANCEL_URL=https://ihre-domain.com
```

**Wichtig:** Für Produktion müssen Sie auch eine `.env`-Datei auf dem Server erstellen (ohne `VITE_`-Präfix für Server-Variablen).

## 3. Backend-Setup (API-Endpunkte)

Die Stripe API-Endpunkte befinden sich in:
- `/api/stripe/create-checkout-session.ts`
- `/api/stripe/webhook.ts`

### 3.1 Firebase Admin SDK (empfohlen für Produktion)

Für die Produktion sollten Sie Firebase Admin SDK verwenden, um Auth-Tokens zu verifizieren:

```bash
npm install firebase-admin
```

Dann in `api/stripe/create-checkout-session.ts`:

```typescript
import admin from 'firebase-admin';

// Initialisieren Sie Firebase Admin einmal
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      // ... weitere Credentials
    }),
  });
}

// Token verifizieren
const decodedToken = await admin.auth().verifyIdToken(idToken);
const userId = decodedToken.uid;
```

## 4. Testing

### 4.1 Test-Modus

Stripe bietet Test-Karten für Entwicklung:
- Erfolgreiche Zahlung: `4242 4242 4242 4242`
- Abgelehnte Zahlung: `4000 0000 0000 0002`
- CVC: Beliebige 3 Ziffern
- Ablaufdatum: Beliebige zukünftige Daten

### 4.2 Test-Flow

1. Registrieren Sie einen neuen User
2. Prüfen Sie, ob 10 Credits vergeben wurden
3. Generieren Sie ein Bild (Credits sollten auf 9 reduziert werden)
4. Nach 10 Generierungen sollte die Paywall erscheinen
5. Testen Sie den Stripe Checkout mit Test-Karte
6. Prüfen Sie, ob User auf Pro-Plan upgegradet wurde

## 5. Deployment

### 5.1 Umgebungsvariablen

Stellen Sie sicher, dass alle Umgebungsvariablen auf Ihrem Hosting-Service gesetzt sind:
- Vercel: **Settings** > **Environment Variables**
- Netlify: **Site settings** > **Environment variables**
- Firebase Hosting: Verwenden Sie Firebase Functions für API-Endpunkte

### 5.2 Firebase Functions (optional)

Für bessere Skalierbarkeit können Sie die API-Endpunkte als Firebase Functions deployen:

```bash
npm install -g firebase-tools
firebase login
firebase init functions
```

## 6. Wichtige Hinweise

### Security

- **Niemals** Stripe Secret Keys im Frontend-Code verwenden
- Auth-Tokens sollten immer serverseitig verifiziert werden
- Firestore Security Rules sind essentiell für Datenschutz

### DSGVO

- Stellen Sie sicher, dass Ihre Datenschutzerklärung aktualisiert ist
- User müssen AGB und Datenschutzerklärung akzeptieren
- Daten werden pro User getrennt gespeichert (`/users/{userId}/`)

### Monitoring

- Überwachen Sie Stripe Webhooks im Dashboard
- Prüfen Sie Firestore-Logs auf Fehler
- Setzen Sie Alerts für fehlgeschlagene Zahlungen

## 7. Troubleshooting

### Problem: "User-ID nicht gefunden" im Webhook

**Lösung:** Stellen Sie sicher, dass `client_reference_id` oder `metadata.userId` in der Checkout-Session gesetzt ist.

### Problem: Credits werden nicht reduziert

**Lösung:** Prüfen Sie Firestore Security Rules. User darf Credits nicht erhöhen, aber reduzieren ist erlaubt.

### Problem: Stripe Checkout öffnet sich nicht

**Lösung:** 
- Prüfen Sie, ob `VITE_STRIPE_PUBLISHABLE_KEY` gesetzt ist
- Prüfen Sie Browser-Konsole auf Fehler
- Stellen Sie sicher, dass die API-Endpunkte erreichbar sind

## 8. Nächste Schritte

- [ ] Firebase Admin SDK für Token-Verifizierung implementieren
- [ ] E-Mail-Benachrichtigungen bei erfolgreicher Zahlung
- [ ] Abo-Verwaltung (Kündigung, Upgrade/Downgrade)
- [ ] Analytics für Conversion-Tracking
- [ ] A/B-Testing für Paywall-Design

