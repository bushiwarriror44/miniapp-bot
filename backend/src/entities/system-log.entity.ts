import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type SystemLogLevel = 'log' | 'warn' | 'error';

@Entity({ name: 'system_logs' })
export class SystemLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 16 })
  level: SystemLogLevel;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  source: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  meta: unknown | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}

