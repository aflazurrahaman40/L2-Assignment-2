import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const sendSuccess = (
  res: Response,
  message: string,
  data?: unknown,
  statusCode: number = StatusCodes.OK
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  errors?: unknown,
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
