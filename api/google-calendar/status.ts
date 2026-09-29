import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest, UnauthorizedError } from '../_lib/auth.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const uid = await getUidFromRequest(req);
    const snap = await adminDb.collection('googleCalendarIntegrations').doc(uid).get();

    if (!snap.exists) {
      res.status(200).json({ connected: false });
      return;
    }

    const data = snap.data()!;
    res.status(200).json({
      connected: true,
      googleEmail: data.googleEmail ?? null,
      connectedAt: data.connectedAt ?? null,
    });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error('google-calendar/status error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}
