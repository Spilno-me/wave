import crypto from 'crypto';

export function generatePseudonym(uid: string): string {
  const salt = process.env.PSEUDONYM_SALT || 'default-salt-change-in-production';
  return 'user_' + crypto
    .createHmac('sha256', salt)
    .update(uid)
    .digest('hex')
    .slice(0, 16);
}
