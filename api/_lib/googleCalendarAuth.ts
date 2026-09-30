import { adminDb } from './firebaseAdmin.js';
import { decryptToken, encryptToken } from './tokenCrypto.js';

const SAFETY_MARGIN_MS = 60_000;

// Devolve um access token válido pra chamar a Calendar API do Google, renovando
// via refresh token se necessário. Nunca apaga a integração em caso de falha —
// só devolve null, deixando o chamador degradar pra "não conectado" nessa
// requisição específica.
export async function getValidAccessToken(uid: string): Promise<string | null> {
  try {
    const docRef = adminDb.collection('googleCalendarIntegrations').doc(uid);
    const snap = await docRef.get();
    if (!snap.exists) return null;

    const data = snap.data()!;
    const accessTokenExpiry = data.accessTokenExpiry as number | undefined;
    const accessToken = data.accessToken as string | undefined;
    const refreshToken = data.refreshToken as string | undefined;

    if (accessToken && accessTokenExpiry && Date.now() < accessTokenExpiry - SAFETY_MARGIN_MS) {
      return decryptToken(accessToken);
    }

    if (!refreshToken) return null;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;

    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: decryptToken(refreshToken),
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    });

    if (!resp.ok) {
      console.error('googleCalendarAuth: falha ao renovar access token', resp.status);
      return null;
    }

    const json = (await resp.json()) as { access_token: string; expires_in: number };
    await docRef.set({
      accessToken: encryptToken(json.access_token),
      accessTokenExpiry: Date.now() + json.expires_in * 1000,
    }, { merge: true });

    return json.access_token;
  } catch (err) {
    console.error('googleCalendarAuth: erro ao obter access token', err);
    return null;
  }
}
