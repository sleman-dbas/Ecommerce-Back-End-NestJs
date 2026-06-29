import { registerAs } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';

type JwtExpiresIn = SignOptions['expiresIn'];

const toExpiresIn = (value: string | undefined, fallback: JwtExpiresIn): JwtExpiresIn => {
  return (value ?? fallback) as JwtExpiresIn;
};

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET ?? 'dev-refresh-secret',
  resetPasswordJwtSecret:
    process.env.RESET_PASSWORD_JWT_SECRET ?? process.env.JWT_SECRET ?? 'dev-reset-secret',
  accessTokenExpiresIn: toExpiresIn(process.env.ACCESS_TOKEN_EXPIRES_IN, '15m'),
  refreshTokenExpiresIn: toExpiresIn(process.env.REFRESH_TOKEN_EXPIRES_IN, '7d'),
  authModuleTokenExpiresIn: toExpiresIn(process.env.AUTH_MODULE_TOKEN_EXPIRES_IN, '7d'),
}));
