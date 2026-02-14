import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'profile_views' })
@Index(['profileUserId', 'viewedAt'])
export class ProfileViewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  viewerUserId: string;

  @Column({ type: 'uuid' })
  profileUserId: string;

  @ManyToOne(() => UserEntity, (user) => user.viewedProfiles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'viewerUserId' })
  viewerUser: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.profileViews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileUserId' })
  profileUser: UserEntity;

  @CreateDateColumn()
  viewedAt: Date;
}
