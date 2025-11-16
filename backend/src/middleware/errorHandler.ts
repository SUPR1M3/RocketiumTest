import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  public code: string;
  public statusCode: number;
  public details?: unknown;

  constructor(code: string, message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiError = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    };
    res.status(400).json(response);
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    const response: ApiError = {
      code: err.code,
      message: err.message,
      details: err.details,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Mongoose errors
  if (err.name === 'CastError') {
    const response: ApiError = {
      code: 'INVALID_ID',
      message: 'Invalid ID format',
    };
    res.status(400).json(response);
    return;
  }

  if (err.name === 'ValidationError') {
    const response: ApiError = {
      code: 'VALIDATION_ERROR',
      message: err.message,
    };
    res.status(400).json(response);
    return;
  }

  // Default error response
  console.error('Unhandled error:', err);
  const response: ApiError = {
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    details: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  };
  
  res.status(500).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const response: ApiError = {
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  };
  res.status(404).json(response);
};

