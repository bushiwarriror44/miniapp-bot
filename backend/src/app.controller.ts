import {
  Body,
  Controller,
  Delete,
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
import type { ModerationSection, ModerationStatus } from './entities/moderation-request.entity';

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

type UpdateScamRequest = {
  isScam?: boolean;
};

type UpdateBlockedRequest = {
  isBlocked?: boolean;
};

type ProfileViewRequest = {
  viewerTelegramId?: string | number;
};

type CreateModerationRequest = {
  telegramId?: string | number;
  section?: ModerationSection;
  formData?: Record<string, unknown>;
};

type UpdateModerationRequest = {
  formData?: Record<string, unknown>;
  adminNote?: string | null;
};

type ApproveModerationRequest = {
  publishedItemId?: string;
  adminNote?: string | null;
};

type RejectModerationRequest = {
  adminNote?: string | null;
};

type CreateSupportRequest = {
  telegramId?: string | number;
  username?: string | null;
  message?: string;
};

type CreateLabelRequest = {
  name?: string;
  defaultColor?: string;
};

type UpdateLabelRequest = {
  name?: string;
  defaultColor?: string;
};

type AddLabelToUserRequest = {
  labelId?: string;
  customColor?: string;
};

type UpdateUserLabelColorRequest = {
  customColor?: string;
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

  @Get('users/me/favorites')
  async getMyFavorites(@Query('telegramId') telegramId?: string) {
    if (!telegramId) {
      throw new HttpException('telegramId is required', HttpStatus.BAD_REQUEST);
    }
    const favorites = await this.appService.getUserFavoritesByTelegramId(telegramId);
    if (!favorites) {
      return { favorites: [] };
    }
    return { favorites };
  }

  @Get('users/me/publications')
  async getMyPublications(
    @Query('telegramId') telegramId?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    if (!telegramId) {
      throw new HttpException('telegramId is required', HttpStatus.BAD_REQUEST);
    }
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.appService.getMyModerationRequests(
      telegramId,
      Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 20,
      cursor,
    );
    return result;
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

  @Get('users/by-username')
  async getUserByUsername(@Query('username') username?: string) {
    if (!username) {
      throw new HttpException('username is required', HttpStatus.BAD_REQUEST);
    }
    const profile = await this.appService.getUserProfileByUsername(username);
    if (!profile) {
      return { profile: null };
    }
    return { profile };
  }

  @Get('users/top')
  async getTopUsers(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const result = await this.appService.getTopUsers(
      Number.isFinite(limitNum) && limitNum > 0 ? limitNum : 10,
      cursor,
    );
    return result;
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

  @Patch('users/:id/scam')
  async updateUserScam(
    @Param('id') id: string,
    @Body() body: UpdateScamRequest,
  ) {
    if (typeof body?.isScam !== 'boolean') {
      throw new HttpException('isScam must be boolean', HttpStatus.BAD_REQUEST);
    }
    const user = await this.appService.setUserScam(id, body.isScam);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, user };
  }

  @Patch('users/:id/blocked')
  async updateUserBlocked(
    @Param('id') id: string,
    @Body() body: UpdateBlockedRequest,
  ) {
    if (typeof body?.isBlocked !== 'boolean') {
      throw new HttpException('isBlocked must be boolean', HttpStatus.BAD_REQUEST);
    }
    const user = await this.appService.setUserBlocked(id, body.isBlocked);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, user };
  }

  @Post('moderation/requests')
  @HttpCode(201)
  async createModeration(@Body() body: CreateModerationRequest) {
    if (!body?.telegramId) {
      throw new HttpException('telegramId is required', HttpStatus.BAD_REQUEST);
    }
    if (!body?.section) {
      throw new HttpException('section is required', HttpStatus.BAD_REQUEST);
    }
    if (!body?.formData || typeof body.formData !== 'object') {
      throw new HttpException('formData must be object', HttpStatus.BAD_REQUEST);
    }
    try {
      const requestEntity = await this.appService.createModerationRequest({
        telegramId: body.telegramId,
        section: body.section,
        formData: body.formData,
      });
      return { ok: true, request: requestEntity };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create moderation request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('moderation/requests')
  async listModeration(@Query('status') status?: ModerationStatus) {
    const requests = await this.appService.listModerationRequests(status);
    return { requests };
  }

  @Get('moderation/requests/:id')
  async getModerationById(@Param('id') id: string) {
    const requestEntity = await this.appService.getModerationRequestById(id);
    if (!requestEntity) {
      throw new HttpException('Moderation request not found', HttpStatus.NOT_FOUND);
    }
    return { request: requestEntity };
  }

  @Patch('moderation/requests/:id')
  async updateModerationById(
    @Param('id') id: string,
    @Body() body: UpdateModerationRequest,
  ) {
    try {
      const requestEntity = await this.appService.updateModerationRequest(id, body);
      if (!requestEntity) {
        throw new HttpException('Moderation request not found', HttpStatus.NOT_FOUND);
      }
      return { ok: true, request: requestEntity };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to update moderation request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('moderation/requests/:id/approve')
  async approveModerationById(
    @Param('id') id: string,
    @Body() body: ApproveModerationRequest,
  ) {
    const requestEntity = await this.appService.approveModerationRequest(
      id,
      body?.publishedItemId,
      body?.adminNote,
    );
    if (!requestEntity) {
      throw new HttpException('Moderation request not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, request: requestEntity };
  }

  @Patch('moderation/requests/:id/reject')
  async rejectModerationById(
    @Param('id') id: string,
    @Body() body: RejectModerationRequest,
  ) {
    const requestEntity = await this.appService.rejectModerationRequest(id, body?.adminNote);
    if (!requestEntity) {
      throw new HttpException('Moderation request not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, request: requestEntity };
  }

  @Post('support/requests')
  @HttpCode(201)
  async createSupportRequest(@Body() body: CreateSupportRequest) {
    if (body?.telegramId === undefined || body?.telegramId === null) {
      throw new HttpException('telegramId is required', HttpStatus.BAD_REQUEST);
    }
    if (body?.message === undefined || body?.message === null) {
      throw new HttpException('message is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const entity = await this.appService.createSupportRequest({
        telegramId: body.telegramId!,
        username: body.username ?? null,
        message: String(body.message),
      });
      return { id: entity.id, createdAt: entity.createdAt };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to create support request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('support/requests')
  async listSupportRequests() {
    const requests = await this.appService.listSupportRequests();
    return { requests };
  }

  @Get('labels')
  async getAllLabels() {
    const labels = await this.appService.getAllLabels();
    return { labels };
  }

  @Post('labels')
  @HttpCode(201)
  async createLabel(@Body() body: CreateLabelRequest) {
    if (!body?.name || typeof body.name !== 'string') {
      throw new HttpException('name is required', HttpStatus.BAD_REQUEST);
    }
    const label = await this.appService.createLabel(body.name, body.defaultColor);
    return { ok: true, label };
  }

  @Patch('labels/:id')
  async updateLabel(@Param('id') id: string, @Body() body: UpdateLabelRequest) {
    const label = await this.appService.updateLabel(id, body.name, body.defaultColor);
    if (!label) {
      throw new HttpException('Label not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, label };
  }

  @Delete('labels/:id')
  async deleteLabel(@Param('id') id: string) {
    const deleted = await this.appService.deleteLabel(id);
    if (!deleted) {
      throw new HttpException('Label not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }

  @Get('users/:id/labels')
  async getUserLabels(@Param('id') id: string) {
    const labels = await this.appService.getUserLabels(id);
    return { labels };
  }

  @Post('users/:id/labels')
  @HttpCode(201)
  async addLabelToUser(
    @Param('id') id: string,
    @Body() body: AddLabelToUserRequest,
  ) {
    if (!body?.labelId || typeof body.labelId !== 'string') {
      throw new HttpException('labelId is required', HttpStatus.BAD_REQUEST);
    }
    const userLabel = await this.appService.addLabelToUser(
      id,
      body.labelId,
      body.customColor,
    );
    return { ok: true, userLabel };
  }

  @Delete('users/:id/labels/:labelId')
  async removeLabelFromUser(@Param('id') id: string, @Param('labelId') labelId: string) {
    const deleted = await this.appService.removeLabelFromUser(id, labelId);
    if (!deleted) {
      throw new HttpException('User label not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }

  @Patch('users/:id/labels/:labelId')
  async updateUserLabelColor(
    @Param('id') id: string,
    @Param('labelId') labelId: string,
    @Body() body: UpdateUserLabelColorRequest,
  ) {
    const userLabel = await this.appService.updateUserLabelColor(
      id,
      labelId,
      body.customColor,
    );
    if (!userLabel) {
      throw new HttpException('User label not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, userLabel };
  }
}
