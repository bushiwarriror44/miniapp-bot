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

@Entity({ name: 'user_ad_links' })
@Index(['userId', 'adId'], { unique: true })
export class UserAdLinkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.adLinks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 120 })
  adId: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  category: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  titleCache: string | null;

  @Column({ type: 'float', nullable: true })
  priceCache: number | null;

  @Column({ type: 'varchar', length: 40, default: 'active' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
