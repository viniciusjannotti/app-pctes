import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest, UnauthorizedError } from '../_lib/auth.js';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { decryptToken } from '../_lib/tokenCrypto.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const uid = await getUidFromRequest(req);
    const docRef = adminDb.collection('googleCalendarIntegrations').doc(uid);
    const snap = await docRef.get();

    if (snap.exists) {
      const data = snap.data()!;
      const refreshTokenEncrypted = data.refreshToken as string | undefined;
      if (refreshTokenEncrypted) {
        try {
          const refreshToken = decryptToken(refreshTokenEncrypted);
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
            method: 'POST',
          });
        } catch (revokeErr) {
          // Segue com a remoção local mesmo se o revoke no Google falhar,
          // pra manter o estado do app consistente.
          console.error('google-calendar/disconnect: falha ao revogar no Google', revokeErr);
        }
      }
    }

    await docRef.delete();
    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error('google-calendar/disconnect error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}
