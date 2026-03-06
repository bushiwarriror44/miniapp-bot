import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from '@nestjs/common';
import { SystemLogService } from '../system-log.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  constructor(private readonly systemLogService: SystemLogService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    res.on('finish', () => {
      const statusCode = res.statusCode;
      this.logger.log(`${method} ${originalUrl} ${statusCode}`);
      void this.systemLogService
        .write({
          level: 'log',
          source: 'request',
          message: `${method} ${originalUrl} ${statusCode}`,
          meta: {
            method,
            url: originalUrl,
            statusCode,
          },
        })
        .catch(() => {
          // ignore logging errors
        });
    });
    next();
  }
}
