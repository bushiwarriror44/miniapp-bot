import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
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
import { UserLabelEntity } from './entities/user-label.entity';
import { UserUserLabelEntity } from './entities/user-user-label.entity';

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
    @InjectRepository(UserLabelEntity)
    private readonly userLabelsRepository: Repository<UserLabelEntity>,
    @InjectRepository(UserUserLabelEntity)
    private readonly userUserLabelsRepository: Repository<UserUserLabelEntity>,
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

  private async ensureUserActivity(
    userId: string,
  ): Promise<UserActivityEntity> {
    let activity = await this.userActivityRepository.findOne({
      where: { userId },
    });
    if (!activity) {
      activity = this.userActivityRepository.create({ userId });
      activity = await this.userActivityRepository.save(activity);
    }
    return activity;
  }

  private calculateDaysInProject(user: UserEntity): number {
    const createdAtTime = user.createdAt
      ? new Date(user.createdAt).getTime()
      : Date.now();
    const days = Math.floor(
      (Date.now() - createdAtTime) / (1000 * 60 * 60 * 24),
    );
    return Math.max(0, days);
  }

  private async getDealStatsForUser(userId: string): Promise<{
    total: number;
    successful: number;
    disputed: number;
  }> {
    const rows = await this.dealsRepository
      .createQueryBuilder('d')
      .select('d.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .where('(d.buyerUserId = :userId OR d.sellerUserId = :userId)', {
        userId,
      })
      .groupBy('d.status')
      .getRawMany<{ status: string; cnt: string }>();
    let total = 0;
    let successful = 0;
    let disputed = 0;
    for (const row of rows) {
      const n = Number(row.cnt) || 0;
      total += n;
      if (row.status === 'successful') successful = n;
      else if (row.status === 'disputed') disputed = n;
    }
    return { total, successful, disputed };
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

  private async ensureUserActivitiesBatch(
    userIds: string[],
  ): Promise<Map<string, UserActivityEntity>> {
    if (userIds.length === 0) return new Map();
    const existing = await this.userActivityRepository.find({
      where: userIds.map((userId) => ({ userId })),
    });
    const map = new Map<string, UserActivityEntity>();
    existing.forEach((a) => map.set(a.userId, a));
    const missing = userIds.filter((id) => !map.has(id));
    if (missing.length > 0) {
      const toInsert = missing.map((userId) =>
        this.userActivityRepository.create({ userId }),
      );
      await this.userActivityRepository.insert(
        toInsert.map((e) => ({ userId: e.userId })),
      );
      const inserted = await this.userActivityRepository.find({
        where: missing.map((userId) => ({ userId })),
      });
      inserted.forEach((a) => map.set(a.userId, a));
    }
    return map;
  }

  private async getDealStatsForUserIds(
    userIds: string[],
  ): Promise<
    Map<string, { total: number; successful: number; disputed: number }>
  > {
    if (userIds.length === 0) return new Map();
    const [buyerRows, sellerRows] = await Promise.all([
      this.dealsRepository
        .createQueryBuilder('d')
        .select('d.buyerUserId', 'userId')
        .addSelect('d.status', 'status')
        .addSelect('COUNT(*)', 'cnt')
        .where('d.buyerUserId IN (:...ids)', { ids: userIds })
        .groupBy('d.buyerUserId')
        .addGroupBy('d.status')
        .getRawMany<{ userId: string; status: string; cnt: string }>(),
      this.dealsRepository
        .createQueryBuilder('d')
        .select('d.sellerUserId', 'userId')
        .addSelect('d.status', 'status')
        .addSelect('COUNT(*)', 'cnt')
        .where('d.sellerUserId IN (:...ids)', { ids: userIds })
        .groupBy('d.sellerUserId')
        .addGroupBy('d.status')
        .getRawMany<{ userId: string; status: string; cnt: string }>(),
    ]);
    const map = new Map<
      string,
      { total: number; successful: number; disputed: number }
    >();
    for (const userId of userIds) {
      map.set(userId, { total: 0, successful: 0, disputed: 0 });
    }
    for (const row of [...buyerRows, ...sellerRows]) {
      const cur = map.get(row.userId);
      if (!cur) continue;
      const n = Number(row.cnt) || 0;
      cur.total += n;
      if (row.status === 'successful') cur.successful += n;
      else if (row.status === 'disputed') cur.disputed += n;
    }
    return map;
  }

  private async getProfileViewsStatsBatch(
    userIds: string[],
  ): Promise<Map<string, { week: number; month: number }>> {
    if (userIds.length === 0) return new Map();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [weekRows, monthRows] = await Promise.all([
      this.profileViewsRepository
        .createQueryBuilder('pv')
        .select('pv.profileUserId', 'profileUserId')
        .addSelect('COUNT(*)', 'cnt')
        .where('pv.profileUserId IN (:...ids)', { ids: userIds })
        .andWhere('pv.viewedAt >= :weekAgo', { weekAgo })
        .groupBy('pv.profileUserId')
        .getRawMany(),
      this.profileViewsRepository
        .createQueryBuilder('pv')
        .select('pv.profileUserId', 'profileUserId')
        .addSelect('COUNT(*)', 'cnt')
        .where('pv.profileUserId IN (:...ids)', { ids: userIds })
        .andWhere('pv.viewedAt >= :monthAgo', { monthAgo })
        .groupBy('pv.profileUserId')
        .getRawMany(),
    ]);
    type ProfileCountRow = { profileUserId: string; cnt: string };
    const map = new Map<string, { week: number; month: number }>();
    const weekTyped = weekRows as ProfileCountRow[];
    const monthTyped = monthRows as ProfileCountRow[];
    for (const userId of userIds) {
      const week = Number(
        weekTyped.find((r) => r.profileUserId === userId)?.cnt ?? 0,
      );
      const month = Number(
        monthTyped.find((r) => r.profileUserId === userId)?.cnt ?? 0,
      );
      map.set(userId, { week, month });
    }
    return map;
  }

  private async getModerationCountsBatch(users: UserEntity[]): Promise<
    Map<
      string,
      {
        adsActive: number;
        adsCompleted: number;
        adsHidden: number;
        adsOnModeration: number;
      }
    >
  > {
    if (users.length === 0) return new Map();
    const ids = users.map((u) => u.id);
    const telegramIds = users.map((u) => u.telegramId);
    const rows = await this.moderationRequestsRepository.find({
      where: [{ userId: In(ids) }, { telegramId: In(telegramIds) }],
      select: ['userId', 'telegramId', 'status'],
    });
    const idToUser = new Map(users.map((u) => [u.id, u]));
    const telegramToUser = new Map(users.map((u) => [u.telegramId, u]));
    const map = new Map<
      string,
      {
        adsActive: number;
        adsCompleted: number;
        adsHidden: number;
        adsOnModeration: number;
      }
    >();
    for (const u of users) {
      map.set(u.id, {
        adsActive: 0,
        adsCompleted: 0,
        adsHidden: 0,
        adsOnModeration: 0,
      });
    }
    for (const row of rows) {
      const user = row.userId
        ? idToUser.get(row.userId)
        : telegramToUser.get(row.telegramId);
      if (!user) continue;
      const cur = map.get(user.id)!;
      if (row.status === 'approved') cur.adsActive += 1;
      else if (row.status === 'completed') cur.adsCompleted += 1;
      else if (row.status === 'rejected') cur.adsHidden += 1;
      else if (row.status === 'pending') cur.adsOnModeration += 1;
    }
    return map;
  }

  private async getUserLabelsBatch(
    userIds: string[],
  ): Promise<
    Map<string, Array<{ labelId: string; labelName: string; color: string }>>
  > {
    if (userIds.length === 0) return new Map();
    const rows = await this.userUserLabelsRepository.find({
      where: userIds.map((id) => ({ userId: id })),
      relations: ['label'],
    });
    const map = new Map<
      string,
      Array<{ labelId: string; labelName: string; color: string }>
    >();
    for (const userId of userIds) map.set(userId, []);
    for (const ul of rows) {
      const list = map.get(ul.userId)!;
      list.push({
        labelId: ul.labelId,
        labelName: ul.label.name,
        color: ul.customColor || ul.label.defaultColor,
      });
    }
    return map;
  }

  private buildUserStatisticsFromBatch(
    user: UserEntity,
    activityMap: Map<string, UserActivityEntity>,
    dealStatsMap: Map<
      string,
      { total: number; successful: number; disputed: number }
    >,
    viewStatsMap: Map<string, { week: number; month: number }>,
    moderationMap: Map<
      string,
      {
        adsActive: number;
        adsCompleted: number;
        adsHidden: number;
        adsOnModeration: number;
      }
    >,
  ): UserStatistics {
    const activity = activityMap.get(user.id);
    const dealStats = dealStatsMap.get(user.id) ?? {
      total: 0,
      successful: 0,
      disputed: 0,
    };
    const viewStats = viewStatsMap.get(user.id) ?? { week: 0, month: 0 };
    const mod = moderationMap.get(user.id) ?? {
      adsActive: 0,
      adsCompleted: 0,
      adsHidden: 0,
      adsOnModeration: 0,
    };
    const dealsTotal = dealStats.total || (activity?.dealsTotal ?? 0);
    const dealsSuccessful =
      dealStats.successful || (activity?.dealsSuccessful ?? 0);
    const dealsDisputed = dealStats.disputed || (activity?.dealsDisputed ?? 0);
    return {
      ads: {
        active: mod.adsActive,
        completed: mod.adsCompleted,
        hidden: mod.adsHidden,
        onModeration: mod.adsOnModeration,
      },
      deals: {
        total: dealsTotal,
        successful: dealsSuccessful,
        disputed: dealsDisputed,
      },
      profileViews: viewStats,
    };
  }

  private buildUserProfileFromBatch(
    user: UserEntity,
    stats: UserStatistics,
    labels: Array<{ labelId: string; labelName: string; color: string }>,
  ) {
    const daysInProject = this.calculateDaysInProject(user);
    const ratingAuto = this.calculateAutoRating(user, stats, daysInProject);
    const ratingTotal =
      Math.round((ratingAuto + (user.ratingManualDelta || 0)) * 10) / 10;
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
      labels: labels.map((l) => ({
        id: l.labelId,
        name: l.labelName,
        color: l.color,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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

    const rows = await this.moderationRequestsRepository
      .createQueryBuilder('m')
      .select('m.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .where('(m.userId = :userId OR m.telegramId = :telegramId)', {
        userId: user.id,
        telegramId: user.telegramId,
      })
      .groupBy('m.status')
      .getRawMany<{ status: string; cnt: string }>();

    const countByStatus: Record<string, number> = {};
    for (const row of rows) {
      countByStatus[row.status] = Number(row.cnt) || 0;
    }
    const adsActive = countByStatus['approved'] ?? 0;
    const adsCompleted = countByStatus['completed'] ?? 0;
    const adsHidden = countByStatus['rejected'] ?? 0;
    const adsOnModeration = countByStatus['pending'] ?? 0;

    const dealsTotal = dealStats.total || activity.dealsTotal;
    const dealsSuccessful = dealStats.successful || activity.dealsSuccessful;
    const dealsDisputed = dealStats.disputed || activity.dealsDisputed;

    return {
      ads: {
        active: adsActive,
        completed: adsCompleted,
        hidden: adsHidden,
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
    const ratingTotal =
      Math.round((ratingAuto + (user.ratingManualDelta || 0)) * 10) / 10;
    const userLabels = await this.getUserLabels(user.id);

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
      labels: userLabels.map((ul) => ({
        id: ul.labelId,
        name: ul.labelName,
        color: ul.color,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserProfileByTelegramId(telegramId: string | number) {
    const normalized = String(telegramId || '').trim();
    if (!normalized) {
      throw new Error('telegramId is required');
    }
    const user = await this.usersRepository.findOne({
      where: { telegramId: normalized },
    });
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
    const user = await this.usersRepository.findOne({
      where: { username: normalized },
    });
    if (!user) {
      return null;
    }
    return this.buildUserProfile(user);
  }

  async getUserStatisticsByTelegramId(
    telegramId: string | number,
  ): Promise<UserStatistics | null> {
    const normalized = String(telegramId || '').trim();
    if (!normalized) {
      throw new Error('telegramId is required');
    }
    const user = await this.usersRepository.findOne({
      where: { telegramId: normalized },
    });
    if (!user) {
      return null;
    }
    return this.buildUserStatistics(user);
  }

  async listUsers(query: string) {
    const qb = this.usersRepository.createQueryBuilder('user');
    if (query.trim()) {
      qb.where("LOWER(COALESCE(user.username, '')) LIKE :q", {
        q: `%${query.trim().toLowerCase()}%`,
      }).orWhere('CAST(user.telegramId AS TEXT) LIKE :qRaw', {
        qRaw: `%${query.trim()}%`,
      });
    }
    const users = await qb
      .orderBy('user.createdAt', 'DESC')
      .limit(200)
      .getMany();
    if (users.length === 0) return [];

    const userIds = users.map((u) => u.id);
    const [activityMap, dealStatsMap, viewStatsMap, moderationMap] =
      await Promise.all([
        this.ensureUserActivitiesBatch(userIds),
        this.getDealStatsForUserIds(userIds),
        this.getProfileViewsStatsBatch(userIds),
        this.getModerationCountsBatch(users),
      ]);

    return users.map((user) => {
      const stats = this.buildUserStatisticsFromBatch(
        user,
        activityMap,
        dealStatsMap,
        viewStatsMap,
        moderationMap,
      );
      const daysInProject = this.calculateDaysInProject(user);
      const ratingAuto = this.calculateAutoRating(user, stats, daysInProject);
      const ratingTotal =
        Math.round((ratingAuto + (user.ratingManualDelta || 0)) * 10) / 10;
      return {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        verified: user.verified,
        isScam: user.isScam,
        isBlocked: user.isBlocked,
        ratingTotal,
        ratingAuto,
        ratingManualDelta: user.ratingManualDelta || 0,
        createdAt: user.createdAt,
      };
    });
  }

  async getUserById(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }
    return this.buildUserProfile(user);
  }

  async getTopUsers(limit: number = 10, cursor?: string) {
    const cap = Math.min(500, Math.max(limit * 3, 100));
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
      take: cap,
    });
    if (users.length === 0) return { users: [], nextCursor: null };

    const userIds = users.map((u) => u.id);
    const [activityMap, dealStatsMap, viewStatsMap, moderationMap] =
      await Promise.all([
        this.ensureUserActivitiesBatch(userIds),
        this.getDealStatsForUserIds(userIds),
        this.getProfileViewsStatsBatch(userIds),
        this.getModerationCountsBatch(users),
      ]);

    const profiles = users.map((user) => {
      const stats = this.buildUserStatisticsFromBatch(
        user,
        activityMap,
        dealStatsMap,
        viewStatsMap,
        moderationMap,
      );
      const daysInProject = this.calculateDaysInProject(user);
      const ratingAuto = this.calculateAutoRating(user, stats, daysInProject);
      const ratingTotal =
        Math.round((ratingAuto + (user.ratingManualDelta || 0)) * 10) / 10;
      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        ratingTotal,
        dealsTotal: stats.deals.total,
      };
    });

    profiles.sort((a, b) => {
      const byRating = b.ratingTotal - a.ratingTotal;
      if (byRating !== 0) return byRating;
      return (a.id || '').localeCompare(b.id || '');
    });

    const offset =
      cursor != null && cursor !== ''
        ? Math.max(0, parseInt(cursor, 10) || 0)
        : 0;
    const slice = profiles.slice(offset, offset + limit);
    const topUsers = slice.map((profile, index) => {
      const name =
        profile.username ||
        profile.firstName ||
        profile.lastName ||
        'Пользователь';
      return {
        id: profile.id,
        rank: offset + index + 1,
        name,
        username: profile.username || null,
        rating: profile.ratingTotal,
        dealsCount: profile.dealsTotal || 0,
      };
    });
    const nextOffset = offset + topUsers.length;
    const nextCursor = nextOffset < profiles.length ? String(nextOffset) : null;
    return { users: topUsers, nextCursor };
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

  async addProfileView(
    profileTelegramId: string | number,
    viewerTelegramId?: string | number,
  ) {
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
    const user = await this.usersRepository.findOne({
      where: { telegramId: normalized },
    });
    if (!user) {
      return null;
    }
    const links = await this.userAdLinksRepository.find({
      where: [
        { userId: user.id, status: 'favorite' },
        { userId: user.id, status: 'bookmarked' },
      ],
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

  private validateModerationSection(
    section: string,
  ): section is ModerationSection {
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
    if (
      !this.ensureObject(payload.formData) ||
      Object.keys(payload.formData).length === 0
    ) {
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

  async getMyModerationRequests(
    telegramId: string | number,
    limit?: number,
    cursor?: string,
  ) {
    const normalized = String(telegramId ?? '').trim();
    if (!normalized) return { publications: [], nextCursor: null };
    const limitNum =
      Number.isFinite(limit) && limit! > 0 ? Math.min(limit!, 100) : 20;
    const offset =
      cursor != null && cursor !== ''
        ? Math.max(0, parseInt(cursor, 10) || 0)
        : 0;
    const rows = await this.moderationRequestsRepository.find({
      where: { telegramId: normalized },
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limitNum + 1,
    });
    const hasMore = rows.length > limitNum;
    const slice = hasMore ? rows.slice(0, limitNum) : rows;
    const now = new Date();
    const publications = slice.map((r) => {
      let status = r.status;
      if (r.status === 'approved' && r.expiresAt != null && now > r.expiresAt) {
        status = 'completed';
      }
      return {
        id: r.id,
        status,
        section: r.section,
        formData: r.formData ?? {},
        createdAt: r.createdAt?.toISOString?.() ?? new Date().toISOString(),
        ...(r.expiresAt != null && { expiresAt: r.expiresAt.toISOString() }),
      };
    });
    const nextCursor = hasMore ? String(offset + limitNum) : null;
    return { publications, nextCursor };
  }

  async getModerationRequestById(id: string) {
    return this.moderationRequestsRepository.findOne({ where: { id } });
  }

  async updateModerationRequest(
    id: string,
    payload: UpdateModerationRequestPayload,
  ) {
    const entity = await this.moderationRequestsRepository.findOne({
      where: { id },
    });
    if (!entity) {
      return null;
    }
    if (entity.status !== 'pending') {
      throw new Error('only pending requests can be edited');
    }
    if (payload.formData != null) {
      if (
        !this.ensureObject(payload.formData) ||
        Object.keys(payload.formData).length === 0
      ) {
        throw new Error('formData must be non-empty object');
      }
      entity.formData = payload.formData;
    }
    if (payload.adminNote !== undefined) {
      entity.adminNote = payload.adminNote;
    }
    return this.moderationRequestsRepository.save(entity);
  }

  async approveModerationRequest(
    id: string,
    publishedItemId?: string,
    adminNote?: string | null,
  ) {
    const entity = await this.moderationRequestsRepository.findOne({
      where: { id },
    });
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
    const rawDuration = entity.formData?.listingDuration;
    const durationHours = Math.max(
      0,
      typeof rawDuration === 'number'
        ? rawDuration
        : typeof rawDuration === 'string'
          ? parseInt(rawDuration, 10) || 168
          : 168,
    );
    entity.expiresAt = new Date(
      entity.processedAt.getTime() + durationHours * 3600 * 1000,
    );
    return this.moderationRequestsRepository.save(entity);
  }

  async rejectModerationRequest(id: string, adminNote?: string | null) {
    const entity = await this.moderationRequestsRepository.findOne({
      where: { id },
    });
    if (!entity) {
      return null;
    }
    entity.status = 'rejected';
    entity.adminNote = adminNote ?? entity.adminNote;
    entity.processedAt = new Date();
    return this.moderationRequestsRepository.save(entity);
  }

  async completeModerationRequest(id: string, telegramId: string) {
    const normalized = String(telegramId ?? '').trim();
    if (!normalized) return null;
    const entity = await this.moderationRequestsRepository.findOne({
      where: { id },
    });
    if (!entity) return null;
    if (entity.telegramId !== normalized) return null;
    if (entity.status !== 'approved') return null;
    entity.status = 'completed';
    return this.moderationRequestsRepository.save(entity);
  }

  async completeModerationRequestByAdmin(id: string) {
    const entity = await this.moderationRequestsRepository.findOne({
      where: { id },
    });
    if (!entity) return null;
    if (entity.status !== 'approved') return null;
    entity.status = 'completed';
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
    const message =
      typeof payload.message === 'string' ? payload.message.trim() : '';
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

  private getDefaultColorForLabelName(name: string): string {
    const presetColors: Record<string, string> = {
      Дизайнер: '#8b5cf6',
      Монтажер: '#06b6d4',
      Рекламщик: '#f59e0b',
      SEO: '#10b981',
      Копирайтер: '#ec4899',
      Разработчик: '#3b82f6',
      Маркетолог: '#f97316',
    };
    return presetColors[name] || '#0070f3';
  }

  async getAllLabels() {
    return this.userLabelsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async createLabel(name: string, defaultColor?: string) {
    const color = defaultColor || this.getDefaultColorForLabelName(name);
    const label = this.userLabelsRepository.create({
      name: name.trim(),
      defaultColor: color,
    });
    return this.userLabelsRepository.save(label);
  }

  async updateLabel(id: string, name?: string, defaultColor?: string) {
    const label = await this.userLabelsRepository.findOne({ where: { id } });
    if (!label) {
      return null;
    }
    if (name !== undefined) {
      label.name = name.trim();
    }
    if (defaultColor !== undefined) {
      label.defaultColor = defaultColor;
    }
    return this.userLabelsRepository.save(label);
  }

  async deleteLabel(id: string) {
    const label = await this.userLabelsRepository.findOne({ where: { id } });
    if (!label) {
      return false;
    }
    await this.userLabelsRepository.remove(label);
    return true;
  }

  async getUserLabels(userId: string) {
    const userLabels = await this.userUserLabelsRepository.find({
      where: { userId },
      relations: ['label'],
    });
    return userLabels.map((ul) => ({
      labelId: ul.labelId,
      labelName: ul.label.name,
      color: ul.customColor || ul.label.defaultColor,
    }));
  }

  async addLabelToUser(userId: string, labelId: string, customColor?: string) {
    const existing = await this.userUserLabelsRepository.findOne({
      where: { userId, labelId },
    });
    if (existing) {
      if (customColor !== undefined) {
        existing.customColor = customColor || null;
        return this.userUserLabelsRepository.save(existing);
      }
      return existing;
    }
    const userLabel = this.userUserLabelsRepository.create({
      userId,
      labelId,
      customColor: customColor || null,
    });
    return this.userUserLabelsRepository.save(userLabel);
  }

  async removeLabelFromUser(userId: string, labelId: string) {
    const userLabel = await this.userUserLabelsRepository.findOne({
      where: { userId, labelId },
    });
    if (!userLabel) {
      return false;
    }
    await this.userUserLabelsRepository.remove(userLabel);
    return true;
  }

  async updateUserLabelColor(
    userId: string,
    labelId: string,
    customColor?: string,
  ) {
    const userLabel = await this.userUserLabelsRepository.findOne({
      where: { userId, labelId },
    });
    if (!userLabel) {
      return null;
    }
    userLabel.customColor = customColor || null;
    return this.userUserLabelsRepository.save(userLabel);
  }
}
