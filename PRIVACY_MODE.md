# Privacy Mode - Datenschutzfokussierte Implementierung

## Übersicht

Die Stoffanprobe-App implementiert einen **Privacy Mode**, der sicherstellt, dass Bilder nur temporär verarbeitet werden und automatisch gelöscht werden, sobald die KI-Verarbeitung abgeschlossen ist.

## Funktionsweise

### 1. Temporäre Bildspeicherung

- **Pfad:** `temp/{uid}/{timestamp}.jpg`
- **Zweck:** Nur für KI-Verarbeitung
- **Löschung:** Automatisch nach erfolgreicher Generierung

### 2. Workflow

1. **Bild-Upload:**
   - User lädt Bild hoch (Data URL im Browser)
   - Bild wird temporär in Firebase Storage hochgeladen: `temp/{uid}/room_{timestamp}.jpg`
   - Storage-URL wird für KI-API verwendet

2. **KI-Verarbeitung:**
   - API erhält Storage-URL (nicht Data URL)
   - KI generiert Ergebnis
   - Temporäre Bilder werden **sofort gelöscht** nach Generierung

3. **Ergebnis:**
   - Generiertes Bild wird im Browser angezeigt
   - User kann herunterladen
   - **Keine dauerhafte Speicherung** ohne explizite Zustimmung

### 3. Dauerhafte Speicherung

- **Nur bei explizitem "Speichern":**
  - User klickt "Kundendaten speichern"
  - Session wird in IndexedDB gespeichert
  - Bilder bleiben als Data URLs lokal (nicht in Firebase Storage)

## Technische Details

### Firebase Storage Service

```typescript
// Upload temporäres Bild
const { url, storagePath } = await uploadTempImage(
  imageDataUrl,
  uid,
  'room' // oder 'pattern'
);

// Löschen nach Verarbeitung
await deleteTempImage(storagePath);
```

### Security Rules

Firebase Storage Rules sollten folgendes erlauben:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Temporäre Bilder: Nur eigener User kann lesen/schreiben
    match /temp/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Dauerhafte Speicherung (falls implementiert)
    match /users/{userId}/uploads/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## UI-Hinweise

### Privacy Notice

Die App zeigt automatisch einen Privacy-Hinweis an, sobald ein Bild hochgeladen wurde:

- **Ort:** Über dem Workspace
- **Inhalt:** Erklärt temporäre Speicherung und automatische Löschung
- **Design:** Blauer Info-Box mit Schloss-Icon

### ImageUploader

Jeder ImageUploader zeigt einen Datenschutz-Hinweis an, sobald ein Bild hochgeladen wurde:

```
🔒 Datenschutz: Ihr Bild wird sicher verarbeitet und nach der Generierung automatisch gelöscht.
```

## Credit-System

### Anzeige im Header

- **Free-Plan:** "Noch X Bilder (Gratis)"
- **Pro-Plan:** "Unbegrenzt" + "PRO"-Badge

### Credit-Abzug

- Wird **vor** der Generierung abgezogen
- Bei Fehler: Credit bleibt abgezogen (verhindert Missbrauch)
- Pro-Plan: Keine Credit-Beschränkung

## Datenschutz-Garantien

1. ✅ **Temporäre Speicherung:** Bilder nur in `temp/` Ordner
2. ✅ **Automatische Löschung:** Nach erfolgreicher Generierung
3. ✅ **Fehlerbehandlung:** Löschung auch bei Fehlern
4. ✅ **User-Isolation:** Jeder User nur Zugriff auf eigene `temp/` Dateien
5. ✅ **Transparenz:** Klare UI-Hinweise über Datenschutz
6. ✅ **Opt-in Speicherung:** Nur bei explizitem "Speichern"

## Testing

### Test temporäre Speicherung

1. Bild hochladen
2. In Firebase Console prüfen: `temp/{uid}/` sollte Datei enthalten
3. Bild generieren
4. In Firebase Console prüfen: Datei sollte gelöscht sein

### Test Credit-Anzeige

1. Als Free-User einloggen
2. Header sollte "Noch 10 Bilder (Gratis)" zeigen
3. Bild generieren
4. Header sollte "Noch 9 Bilder (Gratis)" zeigen

## Nächste Schritte

- [ ] Cloud Function für automatische Bereinigung alter `temp/` Dateien (z.B. nach 24h)
- [ ] Monitoring für nicht gelöschte temporäre Dateien
- [ ] Erweiterte Privacy-Einstellungen (User kann automatische Löschung deaktivieren)
- [ ] Audit-Log für Datenschutz-Compliance

