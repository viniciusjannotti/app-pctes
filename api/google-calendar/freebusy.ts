import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest, UnauthorizedError } from '../_lib/auth.js';
import { getValidAccessToken } from '../_lib/googleCalendarAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const uid = await getUidFromRequest(req);
    const { timeMin, timeMax } = req.body || {};
    if (typeof timeMin !== 'string' || typeof timeMax !== 'string') {
      res.status(400).json({ error: 'timeMin e timeMax são obrigatórios' });
      return;
    }

    const accessToken = await getValidAccessToken(uid);
    if (!accessToken) {
      res.status(200).json({ connected: false, busy: [] });
      return;
    }

    const resp = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timeMin, timeMax, items: [{ id: 'primary' }] }),
    });

    if (!resp.ok) {
      console.error('google-calendar/freebusy: falha na chamada ao Google', resp.status);
      res.status(200).json({ connected: true, busy: [] });
      return;
    }

    const data = (await resp.json()) as {
      calendars?: { primary?: { busy?: Array<{ start: string; end: string }> } };
    };
    res.status(200).json({ connected: true, busy: data.calendars?.primary?.busy ?? [] });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error('google-calendar/freebusy error:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}
