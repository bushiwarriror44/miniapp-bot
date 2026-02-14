import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AppService } from './app.service';

type TrackUserRequest = {
  telegramId?: string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  isPremium?: boolean;
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('stats/users-count')
  async getUsersCount() {
    const usersCount = await this.appService.getUsersCount();
    return { usersCount };
  }

  @Post('users/track')
  @HttpCode(200)
  async trackUser(@Body() body: TrackUserRequest) {
    if (!body?.telegramId) {
      throw new HttpException('telegramId is required', HttpStatus.BAD_REQUEST);
    }

    const user = await this.appService.upsertTelegramUser({
      telegramId: body.telegramId,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
      languageCode: body.languageCode,
      isPremium: body.isPremium,
    });

    return {
      ok: true,
      id: user.id,
      telegramId: user.telegramId,
    };
  }
}
