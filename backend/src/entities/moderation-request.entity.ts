import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export type ModerationSection =
  | 'buy-ads'
  | 'sell-ads'
  | 'jobs'
  | 'designers'
  | 'sell-channel'
  | 'buy-channel'
  | 'other';

export type ModerationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed';

@Entity({ name: 'moderation_requests' })
@Index(['status', 'createdAt'])
export class ModerationRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  telegramId: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: UserEntity | null;

  @Column({ type: 'varchar', length: 40 })
  section: ModerationSection;

  @Column({ type: 'jsonb' })
  formData: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ModerationStatus;

  @Column({ type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  publishedItemId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
