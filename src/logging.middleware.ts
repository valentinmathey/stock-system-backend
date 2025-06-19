// ======================= NEST CORE ================================
import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// ======================= MIDDLEWARE ===============================
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor() {}

  // Middleware que registra cada solicitud entrante
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`IN: ${req.method} ${req.originalUrl}`);
    next();
  }
}
