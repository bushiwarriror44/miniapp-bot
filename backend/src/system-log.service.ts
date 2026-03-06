import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SystemLogEntity,
  type SystemLogLevel,
} from './entities/system-log.entity';

export type SystemLogSource =
  | 'request'
  | 'exception'
  | 'bootstrap'
  | 'custom';

export type CreateSystemLogPayload = {
  level: SystemLogLevel;
  source: SystemLogSource | string;
  message: string;
  meta?: unknown;
};

@Injectable()
export class SystemLogService {
  constructor(
    @InjectRepository(SystemLogEntity)
    private readonly logsRepository: Repository<SystemLogEntity>,
  ) {}

  async write(payload: CreateSystemLogPayload): Promise<void> {
    const entity = this.logsRepository.create({
      level: payload.level,
      source: String(payload.source).slice(0, 64),
      message: payload.message,
      meta: payload.meta ?? null,
    });
    await this.logsRepository.save(entity);
  }

  async list(params: {
    level?: SystemLogLevel;
    source?: string;
    search?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: SystemLogEntity[] }> {
    const qb = this.logsRepository
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');

    if (params.level) {
      qb.andWhere('log.level = :level', { level: params.level });
    }
    if (params.source) {
      qb.andWhere('log.source = :source', { source: params.source });
    }
    if (params.from) {
      qb.andWhere('log.createdAt >= :from', { from: params.from });
    }
    if (params.to) {
      qb.andWhere('log.createdAt <= :to', { to: params.to });
    }
    if (params.search) {
      const search = `%${params.search}%`;
      qb.andWhere(
        '(log.message ILIKE :search OR CAST(log.meta AS TEXT) ILIKE :search)',
        { search },
      );
    }

    const limit =
      params.limit && params.limit > 0 && params.limit <= 500
        ? params.limit
        : 200;
    const offset = params.offset && params.offset > 0 ? params.offset : 0;
    qb.take(limit).skip(offset);

    const entries = await qb.getMany();
    return { entries };
  }
}

