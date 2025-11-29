import React, { useState } from 'react';
import { Session, ConsentData, CustomerData } from '../types';
import JSZip from 'jszip';

interface CustomerDataBannerProps {
  session: Session;
  onDownloadComplete?: () => void;
}

const CustomerDataBanner: React.FC<CustomerDataBannerProps> = ({ session, onDownloadComplete }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Prüfe ob Kundenbilder mit Einwilligung vorhanden sind
  const hasCustomerData = session.imageType === 'commercial' && session.consentData?.accepted;

  if (!hasCustomerData) return null;

  const handleDownloadAll = async () => {
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const folderName = `kunde-${session.customerData?.customerName?.replace(/\s/g, '_') || session.name.replace(/\s/g, '_') || 'sitzung'}-${new Date().toISOString().split('T')[0]}`;
      const folder = zip.folder(folderName);

      if (!folder) throw new Error("Konnte keinen ZIP-Ordner erstellen.");

      // 1. Originalbild hinzufügen
      if (session.originalImage) {
        const base64Data = session.originalImage.split(',')[1];
        const mimeType = session.originalImage.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
        const extension = mimeType.split('/')[1]?.split('+')[0] ?? 'jpg';
        folder.file(`original-raumbild.${extension}`, base64Data, { base64: true });
      }

      // 2. Alle Varianten hinzufügen
      for (const variant of session.variants) {
        const base64Data = variant.imageUrl.split(',')[1];
        const mimeType = variant.imageUrl.match(/:(.*?);/)?.[1] ?? 'image/png';
        const extension = mimeType.split('/')[1]?.split('+')[0] ?? 'png';
        const filename = `variante-${variant.preset}-${variant.id.substring(0, 4)}.${extension}`;
        folder.file(filename, base64Data, { base64: true });
      }

      // 3. Einwilligungserklärung als PDF-ähnliches Textdokument
      if (session.consentData) {
        const consentText = generateConsentDocument(session.consentData, session.customerData);
        folder.file('einwilligung.txt', consentText);
      }

      // 4. Unterschrift als Bild (falls vorhanden)
      if (session.consentData?.signature) {
        const signatureBase64 = session.consentData.signature.split(',')[1];
        folder.file('unterschrift.png', signatureBase64, { base64: true });
      }

      // 5. Kundendaten als JSON für Archivierung
      if (session.customerData) {
        const customerDataJson = JSON.stringify({
          ...session.customerData,
          consentTimestamp: session.consentData?.timestamp,
          sessionId: session.id,
          sessionName: session.name,
          exportedAt: new Date().toISOString(),
        }, null, 2);
        folder.file('kundendaten.json', customerDataJson);
      }

      // ZIP generieren und herunterladen
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setDownloaded(true);
      onDownloadComplete?.();

    } catch (error) {
      console.error("Fehler beim Erstellen der ZIP-Datei:", error);
      alert("Fehler beim Erstellen der ZIP-Datei. Bitte versuchen Sie es erneut.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={`rounded-xl p-4 mb-4 border ${downloaded ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">
          {downloaded ? '✅' : '⚠️'}
        </div>
        <div className="flex-grow">
          <h4 className={`font-semibold ${downloaded ? 'text-green-800' : 'text-amber-800'}`}>
            {downloaded ? 'Daten heruntergeladen' : 'DSGVO-Hinweis: Kundenbilder sichern'}
          </h4>
          <p className={`text-sm mt-1 ${downloaded ? 'text-green-700' : 'text-amber-700'}`}>
            {downloaded
              ? 'Die Bilder und Einwilligungen wurden heruntergeladen. Bitte archivieren Sie diese in Ihrem eigenen System.'
              : 'Diese Sitzung enthält Kundenbilder mit Einwilligungserklärungen. Bitte laden Sie alle Bilder UND Einwilligungen herunter und speichern Sie diese in Ihrem eigenen System. Stoffanprobe speichert diese Daten nicht dauerhaft.'
            }
          </p>
          {!downloaded && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Wird erstellt...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Alle Bilder + Einwilligungen herunterladen (ZIP)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function generateConsentDocument(consentData: ConsentData, customerData?: CustomerData): string {
  const timestamp = consentData.timestamp
    ? new Date(consentData.timestamp).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unbekannt';

  return `
EINWILLIGUNGSERKLÄRUNG ZUR BILDVERARBEITUNG
============================================

Datum und Uhrzeit: ${timestamp}

${customerData?.customerName ? `Kunde: ${customerData.customerName}` : ''}
${customerData?.email ? `E-Mail: ${customerData.email}` : ''}
${customerData?.phone ? `Telefon: ${customerData.phone}` : ''}
${customerData?.address ? `Adresse: ${customerData.address}` : ''}

---

ERKLÄRUNG:

Ich erkläre mich damit einverstanden, dass die von mir bereitgestellten
Raumbilder für Visualisierungszwecke verwendet werden dürfen.

Die Bilder werden an KI-Dienste (fal.ai) zur Verarbeitung übertragen.
Die Verarbeitung erfolgt gemäß der Datenschutzerklärung von stoffanprobe.de.

Status: ${consentData.accepted ? 'AKZEPTIERT' : 'NICHT AKZEPTIERT'}

${consentData.signature ? 'Eine digitale Unterschrift liegt vor (siehe unterschrift.png)' : 'Keine Unterschrift hinterlegt'}

---

Diese Dokumentation wurde automatisch von stoffanprobe.de erstellt.
Exportiert am: ${new Date().toLocaleString('de-DE')}

HINWEIS: Der Nutzer von stoffanprobe.de ist selbst verantwortlich für
die DSGVO-konforme Archivierung dieser Einwilligungserklärung.
`.trim();
}

export default CustomerDataBanner;
