import jwt from 'jsonwebtoken';
import { JwtPayload } from '../config/types';
import config from '../config/env';

const JWT_SECRET = config.jwt_secret;
const JWT_EXPIRES_IN = config.jwt_expires_in;

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
