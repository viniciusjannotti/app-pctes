import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest, UnauthorizedError } from '../_lib/auth.js';
import { getValidAccessToken } from '../_lib/googleCalendarAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const uid = await getUidFromRequest(req);
    const { googleEventId } = req.body || {};
    if (typeof googleEventId !== 'string' || !googleEventId) {
      res.status(200).json({ success: true });
      return;
    }

    const accessToken = await getValidAccessToken(uid);
    if (!accessToken) {
      res.status(200).json({ success: true });
      return;
    }

    const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok && resp.status !== 404 && resp.status !== 410) {
      console.error('google-calendar/delete-event: falha ao apagar evento', resp.status);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error('google-calendar/delete-event error:', err);
    res.status(200).json({ success: true });
  }
}
