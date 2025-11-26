# Google Analytics 4 Setup mit Consent Mode v2

Diese Anleitung beschreibt die Integration von Google Analytics 4 (GA4) mit Consent Mode v2 für DSGVO-Konformität.

## 1. Google Analytics 4 Account erstellen

1. Gehen Sie zur [Google Analytics](https://analytics.google.com/)
2. Erstellen Sie ein neues GA4-Property (falls noch nicht vorhanden)
3. Kopieren Sie die **Measurement ID** (Format: `G-XXXXXXXXXX`)

## 2. Umgebungsvariable setzen

Fügen Sie folgende Variable zu Ihrer `.env`-Datei hinzu:

```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Wichtig:** Ersetzen Sie `G-XXXXXXXXXX` mit Ihrer tatsächlichen Measurement ID.

## 3. Funktionsweise

### Consent Mode v2

Die Implementierung verwendet Google's Consent Mode v2, der sicherstellt, dass:

- **Vor Consent:** GA4 wird geladen, aber sendet keine Daten (analytics_storage: 'denied')
- **Nach Consent:** GA4 sendet Daten normal (analytics_storage: 'granted')
- **IP-Anonymisierung:** Aktiviert für DSGVO-Konformität

### Cookie-Banner

Das Cookie-Banner (`CookieConsentModal`) erscheint automatisch beim ersten Besuch und:

- Zeigt Informationen über verwendete Cookies
- Bietet Optionen: "Nur notwendige Cookies" oder "Alle Cookies akzeptieren"
- Speichert die Entscheidung in `localStorage`
- Aktualisiert den GA4 Consent-Status entsprechend

### Getrackte Events

Folgende Events werden automatisch getrackt (nur mit Consent):

- **Pageviews:** Automatisch bei Seitenwechsel
- **sign_up:** Bei Registrierung
- **login:** Bei Anmeldung
- **generate_image:** Bei erfolgreicher Bildgenerierung
- **view_paywall:** Wenn Paywall angezeigt wird
- **purchase:** Bei erfolgreicher Stripe-Zahlung

## 4. Manuelles Event-Tracking

Sie können auch manuell Events tracken:

```typescript
import { trackEvent } from './services/analytics';

// Beispiel: Custom Event
trackEvent('button_click', {
  button_name: 'download',
  page: 'workspace',
});
```

## 5. Consent-Status prüfen

```typescript
import { hasGA4Consent } from './services/analytics';

if (hasGA4Consent()) {
  // User hat zugestimmt
}
```

## 6. Consent zurücksetzen (für Testing)

```typescript
import { resetGA4Consent } from './services/analytics';

resetGA4Consent(); // Entfernt Consent und zeigt Banner erneut
```

## 7. DSGVO-Konformität

Die Implementierung ist DSGVO-konform, weil:

1. **Opt-in:** GA4 wird nur mit expliziter Zustimmung geladen
2. **IP-Anonymisierung:** Aktiviert in der GA4-Konfiguration
3. **Transparenz:** Cookie-Banner erklärt klar, welche Daten gesammelt werden
4. **Widerruf:** User kann Consent jederzeit widerrufen (Browser-Einstellungen)
5. **Consent Mode v2:** Verhindert Datenübertragung vor Consent

## 8. Testing

### Test ohne Consent

1. Öffnen Sie die Browser-Konsole
2. Führen Sie aus: `localStorage.removeItem('cookie_consent_decision')`
3. Laden Sie die Seite neu
4. Das Cookie-Banner sollte erscheinen
5. Prüfen Sie in der Browser-Netzwerk-Registerkarte: Keine GA4-Requests

### Test mit Consent

1. Klicken Sie auf "Alle Cookies akzeptieren"
2. Prüfen Sie in der Browser-Netzwerk-Registerkarte: GA4-Requests sollten sichtbar sein
3. Prüfen Sie in GA4 Real-Time Reports: Events sollten erscheinen

## 9. Wichtige Hinweise

### Privacy Policy

Stellen Sie sicher, dass Ihre Datenschutzerklärung folgende Informationen enthält:

- Verwendung von Google Analytics 4
- Zweck der Datenverarbeitung
- Rechtsgrundlage (Einwilligung)
- Hinweis auf Widerrufsmöglichkeit
- Link zu Google's Datenschutzerklärung

### Browser-Einstellungen

User können Consent auch über Browser-Einstellungen widerrufen. Die App respektiert diese Einstellungen automatisch.

### Server-Side Tracking (optional)

Für erweiterte Analytics können Sie auch Server-Side Tracking implementieren:

- Google Analytics Measurement Protocol
- Firebase Analytics (falls Sie Firebase verwenden)

## 10. Troubleshooting

### Problem: GA4 sendet keine Daten

**Lösung:**
- Prüfen Sie, ob `VITE_GA4_MEASUREMENT_ID` korrekt gesetzt ist
- Prüfen Sie Browser-Konsole auf Fehler
- Stellen Sie sicher, dass Consent gegeben wurde

### Problem: Cookie-Banner erscheint nicht

**Lösung:**
- Prüfen Sie, ob `cookie_consent_decision` in localStorage vorhanden ist
- Führen Sie `localStorage.removeItem('cookie_consent_decision')` aus
- Laden Sie die Seite neu

### Problem: Events werden nicht getrackt

**Lösung:**
- Prüfen Sie, ob Consent gegeben wurde: `localStorage.getItem('ga4_consent')`
- Prüfen Sie Browser-Konsole auf Fehler
- Prüfen Sie GA4 Real-Time Reports (kann einige Minuten dauern)

## 11. Nächste Schritte

- [ ] Custom Dimensions für erweiterte Analyse
- [ ] E-Commerce Tracking (falls relevant)
- [ ] Conversion Goals in GA4 definieren
- [ ] Regelmäßige Privacy Policy Updates
- [ ] A/B-Testing für Cookie-Banner-Design

