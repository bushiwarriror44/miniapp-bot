import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionLoggerFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionLoggerFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    this.logger.warn(
      `${request.method} ${request.url} ${status} - ${JSON.stringify(message)}`,
    );
    if (
      status === Number(HttpStatus.INTERNAL_SERVER_ERROR) &&
      exception instanceof Error
    ) {
      this.logger.error(exception.stack);
    }

    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal server error',
          };

    const payload =
      typeof body === 'object' && body !== null
        ? body
        : { statusCode: status, message: body };
    response.status(status).json(payload);
  }
}
