import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUidFromRequest, UnauthorizedError } from '../_lib/auth.js';
import { getValidAccessToken } from '../_lib/googleCalendarAuth.js';
import { adminDb } from '../_lib/firebaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const uid = await getUidFromRequest(req);
    const { agendamentoId, titulo, startDateTime, endDateTime, timeZone } = req.body || {};
    if (
      typeof agendamentoId !== 'string' ||
      typeof titulo !== 'string' ||
      typeof startDateTime !== 'string' ||
      typeof endDateTime !== 'string' ||
      typeof timeZone !== 'string'
    ) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes' });
      return;
    }

    const accessToken = await getValidAccessToken(uid);
    if (!accessToken) {
      res.status(200).json({ googleEventId: null });
      return;
    }

    const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: titulo,
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
      }),
    });

    if (!resp.ok) {
      console.error('google-calendar/create-event: falha ao criar evento', resp.status);
      res.status(200).json({ googleEventId: null });
      return;
    }

    const event = (await resp.json()) as { id: string };

    // Admin SDK ignora firestore.rules — confirma que o agendamento é do próprio
    // usuário antes de gravar, pra evitar que alguém sobrescreva o de outro.
    const docRef = adminDb.collection('agendamentos').doc(agendamentoId);
    const snap = await docRef.get();
    if (snap.exists && snap.data()?.ownerId === uid) {
      await docRef.set({ googleEventId: event.id }, { merge: true });
    }

    res.status(200).json({ googleEventId: event.id });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error('google-calendar/create-event error:', err);
    res.status(200).json({ googleEventId: null });
  }
}
