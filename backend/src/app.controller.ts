import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

type TrackUserRequest = {
  telegramId?: string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  isPremium?: boolean;
};

type UpdateRatingRequest = {
  ratingManualDelta?: number;
};

type UpdateVerifiedRequest = {
  verified?: boolean;
};

type ProfileViewRequest = {
  viewerTelegramId?: string | number;
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

  @Get('users/me/profile')
  async getMyProfile(@Query('telegramId') telegramId?: string) {
    if (!telegramId) {
      throw new HttpException('telegramId is required', HttpStatus.BAD_REQUEST);
    }
    const profile = await this.appService.getUserProfileByTelegramId(telegramId);
    if (!profile) {
      return { profile: null };
    }
    return { profile };
  }

  @Get('users/me/statistics')
  async getMyStatistics(@Query('telegramId') telegramId?: string) {
    if (!telegramId) {
      throw new HttpException('telegramId is required', HttpStatus.BAD_REQUEST);
    }
    const statistics = await this.appService.getUserStatisticsByTelegramId(telegramId);
    if (!statistics) {
      return { statistics: null };
    }
    return { statistics };
  }

  @Post('users/:telegramId/profile-view')
  @HttpCode(200)
  async createProfileView(
    @Param('telegramId') telegramId: string,
    @Body() body: ProfileViewRequest,
  ) {
    await this.appService.addProfileView(telegramId, body?.viewerTelegramId);
    return { ok: true };
  }

  @Get('users')
  async listUsers(@Query('q') q?: string) {
    const users = await this.appService.listUsers(q || '');
    return { users };
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    const user = await this.appService.getUserById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { user };
  }

  @Get('users/:id/statistics')
  async getUserStatisticsById(@Param('id') id: string) {
    const user = await this.appService.getUserById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { statistics: user.statistics };
  }

  @Patch('users/:id/rating-manual')
  async updateUserRatingManual(
    @Param('id') id: string,
    @Body() body: UpdateRatingRequest,
  ) {
    if (typeof body?.ratingManualDelta !== 'number' || Number.isNaN(body.ratingManualDelta)) {
      throw new HttpException(
        'ratingManualDelta must be a number',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.appService.setUserRatingManualDelta(id, body.ratingManualDelta);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, user };
  }

  @Patch('users/:id/verified')
  async updateUserVerified(
    @Param('id') id: string,
    @Body() body: UpdateVerifiedRequest,
  ) {
    if (typeof body?.verified !== 'boolean') {
      throw new HttpException('verified must be boolean', HttpStatus.BAD_REQUEST);
    }
    const user = await this.appService.setUserVerified(id, body.verified);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, user };
  }
}
