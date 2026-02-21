import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey || adminKey.length < 16) {
      throw new HttpException(
        'Admin API is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const rawKey = request.headers['x-admin-key'];
    const headerKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;
    const authHeader = request.headers['authorization'];
    const bearerKey =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : undefined;
    const key = (typeof headerKey === 'string' ? headerKey : undefined) ?? bearerKey;
    if (!key || key.trim() === '') {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    if (key !== adminKey) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
