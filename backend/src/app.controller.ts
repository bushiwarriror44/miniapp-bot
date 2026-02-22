import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AdminApiKeyGuard } from './guards/admin-api-key.guard';
import type { ModerationStatus } from './entities/moderation-request.entity';
import {
  TrackUserDto,
  UpdateRatingDto,
  UpdateVerifiedDto,
  UpdateScamDto,
  UpdateBlockedDto,
  ProfileViewDto,
  CreateModerationDto,
  UpdateModerationDto,
  ApproveModerationDto,
  RejectModerationDto,
  CreateSupportDto,
  CreateLabelDto,
  UpdateLabelDto,
  AddLabelToUserDto,
  UpdateUserLabelColorDto,
  TelegramIdQueryDto,
  UsernameQueryDto,
  LimitCursorQueryDto,
  ModerationStatusQueryDto,
  PublicationsQueryDto,
} from './dto';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('stats/users-count')
  @UseGuards(AdminApiKeyGuard)
  async getUsersCount() {
    const usersCount = await this.appService.getUsersCount();
    return { usersCount };
  }

  @Post('users/track')
  @HttpCode(200)
  async trackUser(@Body() body: TrackUserDto) {
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
  async getMyProfile(@Query() query: TelegramIdQueryDto) {
    const profile = await this.appService.getUserProfileByTelegramId(
      query.telegramId,
    );
    if (!profile) {
      return { profile: null };
    }
    return { profile };
  }

  @Get('users/me/statistics')
  async getMyStatistics(@Query() query: TelegramIdQueryDto) {
    const statistics = await this.appService.getUserStatisticsByTelegramId(
      query.telegramId,
    );
    if (!statistics) {
      return { statistics: null };
    }
    return { statistics };
  }

  @Get('users/me/favorites')
  async getMyFavorites(@Query() query: TelegramIdQueryDto) {
    const favorites = await this.appService.getUserFavoritesByTelegramId(
      query.telegramId,
    );
    if (!favorites) {
      return { favorites: [] };
    }
    return { favorites };
  }

  @Get('users/me/publications')
  async getMyPublications(@Query() query: PublicationsQueryDto) {
    const limit = query.limit ?? 20;
    try {
      const result = await this.appService.getMyModerationRequests(
        query.telegramId,
        limit,
        query.cursor,
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `getMyPublications failed: ${message}${stack ? `\n${stack}` : ''}`,
      );
      // Return empty list so the app stays usable; include _error for frontend to log
      return {
        publications: [],
        nextCursor: null,
        _error: message,
      };
    }
  }

  @Patch('users/me/publications/:id/complete')
  async completeMyPublication(
    @Param('id') id: string,
    @Query() query: TelegramIdQueryDto,
  ) {
    const entity = await this.appService.completeModerationRequest(
      id,
      query.telegramId,
    );
    if (!entity) {
      throw new HttpException(
        'Publication not found, not yours, or not active',
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      ok: true,
      publication: {
        id: entity.id,
        status: entity.status,
        section: entity.section,
        formData: entity.formData ?? {},
        createdAt:
          entity.createdAt?.toISOString?.() ?? new Date().toISOString(),
      },
    };
  }

  @Post('users/:telegramId/profile-view')
  @HttpCode(200)
  async createProfileView(
    @Param('telegramId') telegramId: string,
    @Body() body: ProfileViewDto,
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
  async getUserByUsername(@Query() query: UsernameQueryDto) {
    const profile = await this.appService.getUserProfileByUsername(
      query.username,
    );
    if (!profile) {
      return { profile: null };
    }
    return { profile };
  }

  @Get('users/top')
  async getTopUsers(@Query() query: LimitCursorQueryDto) {
    const limit = query.limit ?? 10;
    const result = await this.appService.getTopUsers(limit, query.cursor);
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
  @UseGuards(AdminApiKeyGuard)
  async updateUserRatingManual(
    @Param('id') id: string,
    @Body() body: UpdateRatingDto,
  ) {
    const user = await this.appService.setUserRatingManualDelta(
      id,
      body.ratingManualDelta,
    );
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, user };
  }

  @Patch('users/:id/verified')
  @UseGuards(AdminApiKeyGuard)
  async updateUserVerified(
    @Param('id') id: string,
    @Body() body: UpdateVerifiedDto,
  ) {
    const user = await this.appService.setUserVerified(id, body.verified);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, user };
  }

  @Patch('users/:id/scam')
  @UseGuards(AdminApiKeyGuard)
  async updateUserScam(@Param('id') id: string, @Body() body: UpdateScamDto) {
    const user = await this.appService.setUserScam(id, body.isScam);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, user };
  }

  @Patch('users/:id/blocked')
  @UseGuards(AdminApiKeyGuard)
  async updateUserBlocked(
    @Param('id') id: string,
    @Body() body: UpdateBlockedDto,
  ) {
    const user = await this.appService.setUserBlocked(id, body.isBlocked);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, user };
  }

  @Post('moderation/requests')
  @HttpCode(201)
  async createModeration(@Body() body: CreateModerationDto) {
    try {
      const requestEntity = await this.appService.createModerationRequest({
        telegramId: body.telegramId,
        section: body.section,
        formData: body.formData,
      });
      return { ok: true, request: requestEntity };
    } catch (error) {
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Failed to create moderation request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('moderation/requests')
  @UseGuards(AdminApiKeyGuard)
  async listModeration(@Query() query: ModerationStatusQueryDto) {
    const requests = await this.appService.listModerationRequests(
      query.status as ModerationStatus | undefined,
    );
    return { requests };
  }

  @Get('moderation/requests/:id')
  @UseGuards(AdminApiKeyGuard)
  async getModerationById(@Param('id') id: string) {
    const requestEntity = await this.appService.getModerationRequestById(id);
    if (!requestEntity) {
      throw new HttpException(
        'Moderation request not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return { request: requestEntity };
  }

  @Patch('moderation/requests/:id')
  @UseGuards(AdminApiKeyGuard)
  async updateModerationById(
    @Param('id') id: string,
    @Body() body: UpdateModerationDto,
  ) {
    try {
      const requestEntity = await this.appService.updateModerationRequest(
        id,
        body,
      );
      if (!requestEntity) {
        throw new HttpException(
          'Moderation request not found',
          HttpStatus.NOT_FOUND,
        );
      }
      return { ok: true, request: requestEntity };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Failed to update moderation request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('moderation/requests/:id/approve')
  @UseGuards(AdminApiKeyGuard)
  async approveModerationById(
    @Param('id') id: string,
    @Body() body: ApproveModerationDto,
  ) {
    const requestEntity = await this.appService.approveModerationRequest(
      id,
      body.publishedItemId,
      body.adminNote,
    );
    if (!requestEntity) {
      throw new HttpException(
        'Moderation request not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return { ok: true, request: requestEntity };
  }

  @Patch('moderation/requests/:id/reject')
  @UseGuards(AdminApiKeyGuard)
  async rejectModerationById(
    @Param('id') id: string,
    @Body() body: RejectModerationDto,
  ) {
    const requestEntity = await this.appService.rejectModerationRequest(
      id,
      body.adminNote,
    );
    if (!requestEntity) {
      throw new HttpException(
        'Moderation request not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return { ok: true, request: requestEntity };
  }

  @Patch('moderation/requests/:id/complete')
  @UseGuards(AdminApiKeyGuard)
  async completeModerationById(@Param('id') id: string) {
    const requestEntity =
      await this.appService.completeModerationRequestByAdmin(id);
    if (!requestEntity) {
      throw new HttpException(
        'Moderation request not found or not active',
        HttpStatus.NOT_FOUND,
      );
    }
    return { ok: true, request: requestEntity };
  }

  @Post('support/requests')
  @HttpCode(201)
  async createSupportRequest(@Body() body: CreateSupportDto) {
    try {
      const entity = await this.appService.createSupportRequest({
        telegramId: body.telegramId,
        username: body.username ?? null,
        message: body.message,
      });
      return { id: entity.id, createdAt: entity.createdAt };
    } catch (error) {
      throw new HttpException(
        error instanceof Error
          ? error.message
          : 'Failed to create support request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('support/requests')
  @UseGuards(AdminApiKeyGuard)
  async listSupportRequests() {
    const requests = await this.appService.listSupportRequests();
    return { requests };
  }

  @Get('labels')
  @UseGuards(AdminApiKeyGuard)
  async getAllLabels() {
    const labels = await this.appService.getAllLabels();
    return { labels };
  }

  @Post('labels')
  @HttpCode(201)
  @UseGuards(AdminApiKeyGuard)
  async createLabel(@Body() body: CreateLabelDto) {
    const label = await this.appService.createLabel(
      body.name,
      body.defaultColor,
    );
    return { ok: true, label };
  }

  @Patch('labels/:id')
  @UseGuards(AdminApiKeyGuard)
  async updateLabel(@Param('id') id: string, @Body() body: UpdateLabelDto) {
    const label = await this.appService.updateLabel(
      id,
      body.name,
      body.defaultColor,
    );
    if (!label) {
      throw new HttpException('Label not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true, label };
  }

  @Delete('labels/:id')
  @UseGuards(AdminApiKeyGuard)
  async deleteLabel(@Param('id') id: string) {
    const deleted = await this.appService.deleteLabel(id);
    if (!deleted) {
      throw new HttpException('Label not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }

  @Get('users/:id/labels')
  @UseGuards(AdminApiKeyGuard)
  async getUserLabels(@Param('id') id: string) {
    const labels = await this.appService.getUserLabels(id);
    return { labels };
  }

  @Post('users/:id/labels')
  @HttpCode(201)
  @UseGuards(AdminApiKeyGuard)
  async addLabelToUser(
    @Param('id') id: string,
    @Body() body: AddLabelToUserDto,
  ) {
    const userLabel = await this.appService.addLabelToUser(
      id,
      body.labelId,
      body.customColor,
    );
    return { ok: true, userLabel };
  }

  @Delete('users/:id/labels/:labelId')
  @UseGuards(AdminApiKeyGuard)
  async removeLabelFromUser(
    @Param('id') id: string,
    @Param('labelId') labelId: string,
  ) {
    const deleted = await this.appService.removeLabelFromUser(id, labelId);
    if (!deleted) {
      throw new HttpException('User label not found', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }

  @Patch('users/:id/labels/:labelId')
  @UseGuards(AdminApiKeyGuard)
  async updateUserLabelColor(
    @Param('id') id: string,
    @Param('labelId') labelId: string,
    @Body() body: UpdateUserLabelColorDto,
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
