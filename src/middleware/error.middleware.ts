import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendError } from '../utils/response.util';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error]:', err.message);

  sendError(
    res,
    'An unexpected server error occurred.',
    err.message,
    StatusCodes.INTERNAL_SERVER_ERROR
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(
    res,
    `Route ${req.method} ${req.originalUrl} not found.`,
    null,
    StatusCodes.NOT_FOUND
  );
};
