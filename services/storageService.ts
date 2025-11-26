/**
 * Firebase Storage Service für Privacy Mode
 * Speichert Bilder temporär in temp/{uid}/{timestamp}.jpg
 * und löscht sie nach Verarbeitung automatisch
 */

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  UploadResult
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Konvertiert Data URL zu Blob
 */
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Uploadet ein Bild temporär in Firebase Storage
 * Pfad: temp/{uid}/{timestamp}.jpg
 * 
 * @param imageDataUrl - Data URL des Bildes
 * @param uid - User ID
 * @param type - 'room' oder 'pattern'
 * @returns Promise mit Download-URL und Storage-Referenz für spätere Löschung
 */
export const uploadTempImage = async (
  imageDataUrl: string,
  uid: string,
  type: 'room' | 'pattern' = 'room'
): Promise<{ url: string; storagePath: string }> => {
  try {
    const timestamp = Date.now();
    const filename = `${type}_${timestamp}.jpg`;
    const storagePath = `temp/${uid}/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Konvertiere Data URL zu Blob
    const blob = dataURLtoBlob(imageDataUrl);

    // Upload
    const snapshot: UploadResult = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        type: type,
        temporary: 'true',
      },
    });

    // Download-URL holen
    const url = await getDownloadURL(snapshot.ref);

    return {
      url,
      storagePath,
    };
  } catch (error) {
    console.error('Error uploading temp image:', error);
    throw new Error('Fehler beim Hochladen des Bildes. Bitte versuchen Sie es erneut.');
  }
};

/**
 * Löscht ein temporäres Bild aus Firebase Storage
 * 
 * @param storagePath - Pfad zum Bild (z.B. "temp/{uid}/{filename}")
 */
export const deleteTempImage = async (storagePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // Ignoriere Fehler, wenn Datei bereits gelöscht wurde
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting temp image:', error);
    }
  }
};

/**
 * Löscht alle temporären Bilder eines Users
 * 
 * @param uid - User ID
 */
export const deleteAllTempImages = async (uid: string): Promise<void> => {
  try {
    // Firebase Storage unterstützt keine Wildcard-Löschung
    // Diese Funktion sollte idealerweise über eine Cloud Function implementiert werden
    // Für jetzt: Einzelne Löschung über StoragePath
    console.warn('deleteAllTempImages: Implementierung über Cloud Function empfohlen');
  } catch (error) {
    console.error('Error deleting all temp images:', error);
  }
};

/**
 * Prüft, ob ein Pfad temporär ist (beginnt mit "temp/")
 */
export const isTempPath = (path: string): boolean => {
  return path.startsWith('temp/');
};

