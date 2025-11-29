import React, { useState } from 'react';
import { Session, ConsentData, CustomerData } from '../types';
import JSZip from 'jszip';

interface CustomerDataExitModalProps {
  session: Session;
  onDownloadComplete: () => void;
  onContinueWithoutSaving: () => void;
  onCancel: () => void;
}

const CustomerDataExitModal: React.FC<CustomerDataExitModalProps> = ({
  session,
  onDownloadComplete,
  onContinueWithoutSaving,
  onCancel,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Zähle ungesicherte Kundenbilder
  const unsavedCount = session.variants.filter(v => !v.isDownloaded).length;

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

      // 3. Einwilligungserklärung als Textdokument
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

      onDownloadComplete();

    } catch (error) {
      console.error("Fehler beim Erstellen der ZIP-Datei:", error);
      alert("Fehler beim Erstellen der ZIP-Datei. Bitte versuchen Sie es erneut.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#532418] mb-2">
            Kundenbilder nicht gesichert
          </h2>
          <p className="text-[#67534F]">
            Sie haben <span className="font-bold text-amber-600">{unsavedCount} {unsavedCount === 1 ? 'Kundenbild' : 'Kundenbilder'}</span> mit Einwilligung,
            {unsavedCount === 1 ? ' das' : ' die'} noch nicht heruntergeladen {unsavedCount === 1 ? 'wurde' : 'wurden'}.
          </p>
          <p className="text-sm text-[#67534F]/80 mt-2">
            Nach dem Verlassen werden alle Daten unwiderruflich gelöscht!
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleDownloadAll}
            disabled={isDownloading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#C8956C] to-[#A67B5B] hover:opacity-90 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                ZIP wird erstellt...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Alles herunterladen (ZIP)
              </>
            )}
          </button>

          <button
            onClick={onContinueWithoutSaving}
            disabled={isDownloading}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all disabled:opacity-50"
          >
            Ohne Speichern fortfahren
          </button>

          <button
            onClick={onCancel}
            disabled={isDownloading}
            className="w-full py-2 text-sm text-[#67534F] hover:text-[#532418] transition-colors"
          >
            Abbrechen
          </button>
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

export default CustomerDataExitModal;
