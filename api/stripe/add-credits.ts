import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Firebase Admin initialisieren
function getAdminDb() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
    }
    initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    });
  }
  return getFirestore();
}

/**
 * Admin-Endpoint zum manuellen Hinzufügen von Credits
 *
 * POST /api/stripe/add-credits
 * Body: { email: "user@example.com", credits: 10 }
 * Header: Authorization: Bearer <ADMIN_SECRET>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin-Schutz
  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = req.headers.authorization;

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { email, credits } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email erforderlich' });
    }

    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return res.status(400).json({ error: 'credits muss eine positive Zahl sein' });
    }

    const db = getAdminDb();

    // Finde User per Email
    const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();

    if (usersSnapshot.empty) {
      return res.status(404).json({ error: `User mit Email ${email} nicht gefunden` });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    const currentCredits = userData.monthlyCredits ?? 0;
    const newCredits = currentCredits + credits;

    // Update Credits
    await db.collection('users').doc(userId).update({
      monthlyCredits: newCredits,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: `${credits} Credits zu User ${email} hinzugefügt`,
      data: {
        userId,
        email,
        previousCredits: currentCredits,
        addedCredits: credits,
        newTotal: newCredits,
      }
    });

  } catch (error: any) {
    console.error('Add credits error:', error);
    return res.status(500).json({ error: error.message || 'Fehler beim Hinzufügen der Credits' });
  }
}
