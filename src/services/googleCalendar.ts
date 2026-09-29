// src/services/googleCalendar.ts
// Cliente fino para os endpoints serverless de integração com o Google Agenda.

import { auth } from './firebase';

export interface GoogleCalendarStatus {
  connected: boolean;
  googleEmail?: string | null;
  connectedAt?: string | null;
}

async function authedFetch(path: string, options?: RequestInit): Promise<Response> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');
  const idToken = await user.getIdToken();

  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${idToken}`,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro na requisição (${res.status})`);
  }

  return res;
}

export async function getConnectionStatus(): Promise<GoogleCalendarStatus> {
  const res = await authedFetch('/api/google-calendar/status');
  return res.json();
}

export async function startGoogleCalendarConnect(): Promise<void> {
  const res = await authedFetch('/api/google-calendar/start', { method: 'POST' });
  const { url } = await res.json();
  window.location.href = url;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await authedFetch('/api/google-calendar/disconnect', { method: 'POST' });
}
