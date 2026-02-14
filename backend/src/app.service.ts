import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

type TrackUserPayload = {
  telegramId: string | number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  isPremium?: boolean;
};

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
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

    return this.usersRepository.save(entity);
  }
}
