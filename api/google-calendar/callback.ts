import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../_lib/firebaseAdmin.js';
import { verifyState } from '../_lib/oauthState.js';
import { encryptToken } from '../_lib/tokenCrypto.js';

function redirectTo(res: VercelResponse, status: 'connected' | 'error') {
  res.writeHead(302, { Location: `/configuracoes?google=${status}` });
  res.end();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  if (error || typeof code !== 'string' || typeof state !== 'string') {
    redirectTo(res, 'error');
    return;
  }

  const verified = verifyState(state);
  if (!verified) {
    redirectTo(res, 'error');
    return;
  }
  const { uid } = verified;

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !clientSecret || !redirectUri) {
      redirectTo(res, 'error');
      return;
    }

    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResp.ok) {
      console.error('google-calendar/callback: token exchange failed', tokenResp.status);
      redirectTo(res, 'error');
      return;
    }

    const tokenData = (await tokenResp.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    };

    const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = userInfoResp.ok ? ((await userInfoResp.json()) as { email?: string }) : {};

    const docRef = adminDb.collection('googleCalendarIntegrations').doc(uid);
    const update: Record<string, unknown> = {
      accessToken: encryptToken(tokenData.access_token),
      accessTokenExpiry: Date.now() + tokenData.expires_in * 1000,
      googleEmail: userInfo.email || null,
      connectedAt: new Date().toISOString(),
    };
    // Google só reenvia refresh_token quando prompt=consent é honrado; como start.ts
    // sempre envia prompt=consent isso deve sempre vir preenchido, mas por segurança
    // não sobrescrevemos um refresh_token válido existente com undefined.
    if (tokenData.refresh_token) {
      update.refreshToken = encryptToken(tokenData.refresh_token);
    }

    await docRef.set(update, { merge: true });

    console.log(`google-calendar/callback: conexão salva para uid ${uid}`);
    redirectTo(res, 'connected');
  } catch (err) {
    console.error('google-calendar/callback error:', err);
    redirectTo(res, 'error');
  }
}
