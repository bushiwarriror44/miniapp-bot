import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { DealEntity } from './entities/deal.entity';
import {
  ModerationRequestEntity,
  type ModerationSection,
  type ModerationStatus,
} from './entities/moderation-request.entity';
import { ProfileViewEntity } from './entities/profile-view.entity';
import { SupportRequestEntity } from './entities/support-request.entity';
import { UserEntity } from './entities/user.entity';
import { UserActivityEntity } from './entities/user-activity.entity';
import { UserAdLinkEntity } from './entities/user-ad-link.entity';

type TrackUserPayload = {
  telegramId: string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  isPremium?: boolean;
};

type UserStatistics = {
  ads: {
    active: number;
    completed: number;
    hidden: number;
    onModeration: number;
  };
  deals: {
    total: number;
    successful: number;
    disputed: number;
  };
  profileViews: {
    week: number;
    month: number;
  };
};

type FavoriteAdItem = {
  id: string;
  adType: 'post_in_channel' | 'post_in_chat';
  channelOrChatLink: string;
  imageUrl: string | null;
  verified: boolean;
  username: string;
  price: number;
  pinned: boolean;
  underGuarantee: boolean;
  publishTime: string;
  postDuration: string;
  paymentMethod: 'card' | 'crypto';
  theme: string;
  description: string;
  publishedAt: string;
};

type SubmitModerationRequestPayload = {
  telegramId: string | number;
  section: ModerationSection;
  formData: Record<string, unknown>;
};

type UpdateModerationRequestPayload = {
  formData?: Record<string, unknown>;
  adminNote?: string | null;
};

const ALLOWED_MODERATION_SECTIONS: ModerationSection[] = [
  'buy-ads',
  'sell-ads',
  'jobs',
  'designers',
  'sell-channel',
  'buy-channel',
  'other',
];

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(UserActivityEntity)
    private readonly userActivityRepository: Repository<UserActivityEntity>,
    @InjectRepository(ProfileViewEntity)
    private readonly profileViewsRepository: Repository<ProfileViewEntity>,
    @InjectRepository(UserAdLinkEntity)
    private readonly userAdLinksRepository: Repository<UserAdLinkEntity>,
    @InjectRepository(DealEntity)
    private readonly dealsRepository: Repository<DealEntity>,
    @InjectRepository(ModerationRequestEntity)
    private readonly moderationRequestsRepository: Repository<ModerationRequestEntity>,
    @InjectRepository(SupportRequestEntity)
    private readonly supportRequestsRepository: Repository<SupportRequestEntity>,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getUsersCount(): Promise<number> {
    return this.usersRepository.count();
  }

  async upsertTelegramUser(payload: TrackUserPayload): Promise<UserEntity> {
    const telegramId = String(payload.telegramId || '').trim();
    if (!telegramId) {
      throw new Error('telegramId is required');
    }

    let entity = await this.usersRepository.findOne({ where: { telegramId } });
    if (!entity) {
      entity = this.usersRepository.create({ telegramId });
    }

    entity.username = payload.username ?? null;
    entity.firstName = payload.firstName ?? null;
    entity.lastName = payload.lastName ?? null;
    entity.languageCode = payload.languageCode ?? null;
    entity.isPremium = Boolean(payload.isPremium);

    const saved = await this.usersRepository.save(entity);
    await this.ensureUserActivity(saved.id);
    return saved;
  }

  private async ensureUserActivity(userId: string): Promise<UserActivityEntity> {
    let activity = await this.userActivityRepository.findOne({ where: { userId } });
    if (!activity) {
      activity = this.userActivityRepository.create({ userId });
      activity = await this.userActivityRepository.save(activity);
    }
    return activity;
  }

  private calculateDaysInProject(user: UserEntity): number {
    const createdAtTime = user.createdAt ? new Date(user.createdAt).getTime() : Date.now();
    const days = Math.floor((Date.now() - createdAtTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  private async getDealStatsForUser(userId: string): Promise<{
    total: number;
    successful: number;
    disputed: number;
  }> {
    const allDeals = await this.dealsRepository.find({
      where: [{ buyerUserId: userId }, { sellerUserId: userId }],
    });
    const successful = allDeals.filter((deal) => deal.status === 'successful').length;
    const disputed = allDeals.filter((deal) => deal.status === 'disputed').length;
    return { total: allDeals.length, successful, disputed };
  }

  private async getProfileViewsStats(profileUserId: string): Promise<{
    week: number;
    month: number;
  }> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [week, month] = await Promise.all([
      this.profileViewsRepository.count({
        where: {
          profileUserId,
          viewedAt: MoreThanOrEqual(weekAgo),
        },
      }),
      this.profileViewsRepository.count({
        where: {
          profileUserId,
          viewedAt: MoreThanOrEqual(monthAgo),
        },
      }),
    ]);

    return { week, month };
  }

  private calculateAutoRating(
    user: UserEntity,
    stats: UserStatistics,
    daysInProject: number,
  ): number {
    const successfulDealsScore = stats.deals.successful * 2.2;
    const tenureScore = Math.min(daysInProject / 30, 12);
    const activityLoad =
      stats.ads.active +
      stats.ads.completed * 0.7 +
      stats.deals.total * 1.2 +
      stats.profileViews.month / 30;
    const activityScore = Math.min(activityLoad, 20);
    const verificationBonus = user.verified ? 5 : 0;
    const premiumBonus = user.isPremium ? 1 : 0;

    const value =
      successfulDealsScore +
      tenureScore +
      activityScore +
      verificationBonus +
      premiumBonus;
    return Math.round(value * 10) / 10;
  }

  private async buildUserStatistics(user: UserEntity): Promise<UserStatistics> {
    const activity = await this.ensureUserActivity(user.id);
    const dealStats = await this.getDealStatsForUser(user.id);
    const viewStats = await this.getProfileViewsStats(user.id);

    const adsOnModeration = await this.moderationRequestsRepository
      .createQueryBuilder('m')
      .where('m.status = :status', { status: 'pending' })
      .andWhere('(m.userId = :userId OR m.telegramId = :telegramId)', {
        userId: user.id,
        telegramId: user.telegramId,
      })
      .getCount();

    const dealsTotal = dealStats.total || activity.dealsTotal;
    const dealsSuccessful = dealStats.successful || activity.dealsSuccessful;
    const dealsDisputed = dealStats.disputed || activity.dealsDisputed;

    return {
      ads: {
        active: activity.adsActive,
        completed: activity.adsCompleted,
        hidden: activity.adsHidden,
        onModeration: adsOnModeration,
      },
      deals: {
        total: dealsTotal,
        successful: dealsSuccessful,
        disputed: dealsDisputed,
      },
      profileViews: viewStats,
    };
  }

  private async buildUserProfile(user: UserEntity) {
    const stats = await this.buildUserStatistics(user);
    const daysInProject = this.calculateDaysInProject(user);
    const ratingAuto = this.calculateAutoRating(user, stats, daysInProject);
    const ratingTotal = Math.round((ratingAuto + (user.ratingManualDelta || 0)) * 10) / 10;

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      verified: user.verified,
      isScam: user.isScam,
      isBlocked: user.isBlocked,
      rating: {
        auto: ratingAuto,
        manualDelta: user.ratingManualDelta || 0,
        total: ratingTotal,
      },
      statistics: stats,
      daysInProject,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserProfileByTelegramId(telegramId: string | number) {
    const normalized = String(telegramId || '').trim();
    if (!normalized) {
      throw new Error('telegramId is required');
    }
    const user = await this.usersRepository.findOne({ where: { telegramId: normalized } });
    if (!user) {
      return null;
    }
    return this.buildUserProfile(user);
  }

  async getUserProfileByUsername(username: string) {
    const raw = String(username || '').trim();
    const normalized = raw.startsWith('@') ? raw.slice(1) : raw;
    if (!normalized) {
      throw new Error('username is required');
    }
    const user = await this.usersRepository.findOne({ where: { username: normalized } });
    if (!user) {
      return null;
    }
    return this.buildUserProfile(user);
  }

  async getUserStatisticsByTelegramId(telegramId: string | number): Promise<UserStatistics | null> {
    const normalized = String(telegramId || '').trim();
    if (!normalized) {
      throw new Error('telegramId is required');
    }
    const user = await this.usersRepository.findOne({ where: { telegramId: normalized } });
    if (!user) {
      return null;
    }
    return this.buildUserStatistics(user);
  }

  async listUsers(query: string) {
    const qb = this.usersRepository.createQueryBuilder('user');
    if (query.trim()) {
      qb.where('LOWER(COALESCE(user.username, \'\')) LIKE :q', {
        q: `%${query.trim().toLowerCase()}%`,
      }).orWhere('CAST(user.telegramId AS TEXT) LIKE :qRaw', {
        qRaw: `%${query.trim()}%`,
      });
    }
    const users = await qb.orderBy('user.createdAt', 'DESC').limit(200).getMany();
    return Promise.all(
      users.map(async (user) => {
        const profile = await this.buildUserProfile(user);
        return {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          verified: user.verified,
          isScam: user.isScam,
          isBlocked: user.isBlocked,
          ratingTotal: profile.rating.total,
          ratingAuto: profile.rating.auto,
          ratingManualDelta: profile.rating.manualDelta,
          createdAt: user.createdAt,
        };
      }),
    );
  }

  async getUserById(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }
    return this.buildUserProfile(user);
  }

  async getTopUsers(limit: number = 10) {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
    const profiles = await Promise.all(
      users.map((user) => this.buildUserProfile(user)),
    );
    profiles.sort((a, b) => b.rating.total - a.rating.total);
    const topUsers = profiles.slice(0, limit).map((profile, index) => {
      const name =
        profile.username ||
        profile.firstName ||
        profile.lastName ||
        'Пользователь';
      return {
        id: profile.id,
        rank: index + 1,
        name,
        username: profile.username || null,
        rating: profile.rating.total,
        dealsCount: profile.statistics?.deals?.total || 0,
      };
    });
    return topUsers;
  }

  async setUserRatingManualDelta(userId: string, ratingManualDelta: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }
    user.ratingManualDelta = Number.isFinite(ratingManualDelta)
      ? ratingManualDelta
      : 0;
    await this.usersRepository.save(user);
    return this.buildUserProfile(user);
  }

  async setUserVerified(userId: string, verified: boolean) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }
    user.verified = Boolean(verified);
    await this.usersRepository.save(user);
    return this.buildUserProfile(user);
  }

  async setUserScam(userId: string, isScam: boolean) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }
    user.isScam = Boolean(isScam);
    await this.usersRepository.save(user);
    return this.buildUserProfile(user);
  }

  async setUserBlocked(userId: string, isBlocked: boolean) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }
    user.isBlocked = Boolean(isBlocked);
    await this.usersRepository.save(user);
    return this.buildUserProfile(user);
  }

  async addProfileView(profileTelegramId: string | number, viewerTelegramId?: string | number) {
    const profileUser = await this.usersRepository.findOne({
      where: { telegramId: String(profileTelegramId) },
    });
    if (!profileUser) {
      throw new Error('profile user not found');
    }

    let viewerUser = profileUser;
    if (viewerTelegramId != null) {
      const found = await this.usersRepository.findOne({
        where: { telegramId: String(viewerTelegramId) },
      });
      if (found) {
        viewerUser = found;
      }
    }

    const entry = this.profileViewsRepository.create({
      viewerUserId: viewerUser.id,
      profileUserId: profileUser.id,
    });
    await this.profileViewsRepository.save(entry);
    return { ok: true };
  }

  async getUserFavoritesByTelegramId(
    telegramId: string | number,
  ): Promise<FavoriteAdItem[] | null> {
    const normalized = String(telegramId || '').trim();
    if (!normalized) {
      throw new Error('telegramId is required');
    }
    const user = await this.usersRepository.findOne({ where: { telegramId: normalized } });
    if (!user) {
      return null;
    }
    const links = await this.userAdLinksRepository.find({
      where: [{ userId: user.id, status: 'favorite' }, { userId: user.id, status: 'bookmarked' }],
      order: { createdAt: 'DESC' },
    });

    return links.map((link) => ({
      id: String(link.adId),
      adType: 'post_in_channel',
      channelOrChatLink: '',
      imageUrl: null,
      verified: user.verified,
      username: user.username || 'user',
      price: Number(link.priceCache || 0),
      pinned: false,
      underGuarantee: false,
      publishTime: '-',
      postDuration: '-',
      paymentMethod: 'card',
      theme: link.titleCache || 'Объявление из избранного',
      description: '',
      publishedAt: link.createdAt
        ? new Date(link.createdAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    }));
  }

  private validateModerationSection(section: string): section is ModerationSection {
    return ALLOWED_MODERATION_SECTIONS.includes(section as ModerationSection);
  }

  private ensureObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  async createModerationRequest(payload: SubmitModerationRequestPayload) {
    const telegramId = String(payload.telegramId || '').trim();
    if (!telegramId) {
      throw new Error('telegramId is required');
    }
    if (!this.validateModerationSection(payload.section)) {
      throw new Error('invalid section');
    }
    if (!this.ensureObject(payload.formData) || Object.keys(payload.formData).length === 0) {
      throw new Error('formData must be non-empty object');
    }

    const user = await this.usersRepository.findOne({ where: { telegramId } });
    const entity = this.moderationRequestsRepository.create({
      telegramId,
      userId: user?.id ?? null,
      section: payload.section,
      formData: payload.formData,
      status: 'pending',
      adminNote: null,
      publishedItemId: null,
      processedAt: null,
    });
    return this.moderationRequestsRepository.save(entity);
  }

  async listModerationRequests(status?: ModerationStatus) {
    const where = status ? { status } : {};
    return this.moderationRequestsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 300,
    });
  }

  async getMyModerationRequests(telegramId: string | number) {
    const normalized = String(telegramId ?? '').trim();
    if (!normalized) return [];
    const rows = await this.moderationRequestsRepository.find({
      where: { telegramId: normalized },
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      section: r.section,
      formData: r.formData ?? {},
      createdAt: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
    }));
  }

  async getModerationRequestById(id: string) {
    return this.moderationRequestsRepository.findOne({ where: { id } });
  }

  async updateModerationRequest(id: string, payload: UpdateModerationRequestPayload) {
    const entity = await this.moderationRequestsRepository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    if (entity.status !== 'pending') {
      throw new Error('only pending requests can be edited');
    }
    if (payload.formData != null) {
      if (!this.ensureObject(payload.formData) || Object.keys(payload.formData).length === 0) {
        throw new Error('formData must be non-empty object');
      }
      entity.formData = payload.formData;
    }
    if (payload.adminNote !== undefined) {
      entity.adminNote = payload.adminNote;
    }
    return this.moderationRequestsRepository.save(entity);
  }

  async approveModerationRequest(id: string, publishedItemId?: string, adminNote?: string | null) {
    const entity = await this.moderationRequestsRepository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    if (entity.status === 'approved' && entity.publishedItemId) {
      return entity;
    }
    entity.status = 'approved';
    entity.publishedItemId = publishedItemId || entity.publishedItemId || null;
    entity.adminNote = adminNote ?? entity.adminNote;
    entity.processedAt = new Date();
    return this.moderationRequestsRepository.save(entity);
  }

  async rejectModerationRequest(id: string, adminNote?: string | null) {
    const entity = await this.moderationRequestsRepository.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    entity.status = 'rejected';
    entity.adminNote = adminNote ?? entity.adminNote;
    entity.processedAt = new Date();
    return this.moderationRequestsRepository.save(entity);
  }

  async createSupportRequest(payload: {
    telegramId: string | number;
    username?: string | null;
    message: string;
  }) {
    const telegramId = String(payload.telegramId ?? '').trim();
    if (!telegramId) {
      throw new Error('telegramId is required');
    }
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!message) {
      throw new Error('message is required');
    }
    const username =
      payload.username != null && payload.username !== ''
        ? String(payload.username).replace(/^@/, '').trim() || null
        : null;
    const user = await this.usersRepository.findOne({ where: { telegramId } });
    const entity = this.supportRequestsRepository.create({
      telegramId,
      userId: user?.id ?? null,
      username,
      message,
    });
    return this.supportRequestsRepository.save(entity);
  }

  async listSupportRequests() {
    return this.supportRequestsRepository.find({
      order: { createdAt: 'DESC' },
      take: 500,
    });
  }
}
