import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { DealEntity } from './entities/deal.entity';
import { ProfileViewEntity } from './entities/profile-view.entity';
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

    const dealsTotal = dealStats.total || activity.dealsTotal;
    const dealsSuccessful = dealStats.successful || activity.dealsSuccessful;
    const dealsDisputed = dealStats.disputed || activity.dealsDisputed;

    return {
      ads: {
        active: activity.adsActive,
        completed: activity.adsCompleted,
        hidden: activity.adsHidden,
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
}
