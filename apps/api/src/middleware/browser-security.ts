import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

export function browserSecurity(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.get('Origin');
    if (
      (origin && origin !== env.appOrigin) ||
      request.get('Sec-Fetch-Site') === 'cross-site'
    )
      throw new AppError(
        403,
        'ORIGIN_REJECTED',
        'This request is not from the application origin.',
      );
    // JSON cannot be submitted by a cross-origin HTML form. No CORS permission
    // is granted; cross-origin scripted JSON requests fail their preflight.
    if (request.method !== 'DELETE' && !request.is('application/json'))
      throw new AppError(
        415,
        'JSON_REQUIRED',
        'Send an application/json request body.',
      );
  }
  next();
}
