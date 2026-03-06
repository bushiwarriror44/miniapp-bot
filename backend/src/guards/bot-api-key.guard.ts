import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class BotApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const botKey = process.env.BOT_API_KEY;
    if (!botKey || botKey.length < 16) {
      throw new HttpException(
        'Bot API is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const rawKey = request.headers['x-bot-key'];
    const headerKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const key = typeof headerKey === 'string' ? headerKey : undefined;
    if (!key || key.trim() === '') {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (key !== botKey) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}

