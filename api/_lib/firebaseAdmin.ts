import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 não configurada');
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

if (!getApps().length) {
  initializeApp({ credential: cert(getServiceAccount()) });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
