import type { VercelRequest } from '@vercel/node';
import { adminAuth } from './firebaseAdmin.js';

export class UnauthorizedError extends Error {}

export async function getUidFromRequest(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token ausente');
  }
  const idToken = header.slice('Bearer '.length);
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    throw new UnauthorizedError('Token inválido');
  }
}
