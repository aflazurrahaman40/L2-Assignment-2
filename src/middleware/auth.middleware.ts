import { Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../utils/jwt.util';
import { sendError } from '../utils/response.util';
import { AuthRequest, UserRole } from '../config/types';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['authorization'];

  if (!token) {
    sendError(res, 'Access denied. No token provided.', null, StatusCodes.UNAUTHORIZED);
    return;
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    sendError(res, 'Invalid or expired token.', null, StatusCodes.UNAUTHORIZED);
  }
};


export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(
        res,
        'You do not have permission to perform this action.',
        null,
        StatusCodes.FORBIDDEN
      );
      return;
    }
    next();
  };
};
