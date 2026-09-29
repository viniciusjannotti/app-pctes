import { createHmac, timingSafeEqual } from 'crypto';

const TTL_MS = 10 * 60 * 1000; // 10 minutos

function getSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error('OAUTH_STATE_SECRET não configurada');
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function signState(uid: string): string {
  const payload = `${uid}.${Date.now() + TTL_MS}`;
  const encoded = Buffer.from(payload, 'utf8').toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifyState(state: string): { uid: string } | null {
  const lastDot = state.lastIndexOf('.');
  if (lastDot === -1) return null;
  const encoded = state.slice(0, lastDot);
  const signature = state.slice(lastDot + 1);

  const expected = sign(encoded);
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  const [uid, expiryStr] = Buffer.from(encoded, 'base64url').toString('utf8').split('.');
  const expiry = Number(expiryStr);
  if (!uid || !expiry || Date.now() > expiry) return null;

  return { uid };
}
