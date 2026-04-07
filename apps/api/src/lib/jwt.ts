import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to a value of at least 32 characters'
    );
  }
  return secret;
}

function getRefreshSecret(): string {
  return process.env.JWT_REFRESH_SECRET ?? getSecret();
}

export function signAccessToken(payload: TokenPayload): string {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function signRefreshToken(payload: TokenPayload): string {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';
  return jwt.sign({ ...payload, tokenType: 'refresh' }, getRefreshSecret(), {
    expiresIn,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, getRefreshSecret()) as TokenPayload;
}
