import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DealEntity } from './deal.entity';
import { ProfileViewEntity } from './profile-view.entity';
import { UserActivityEntity } from './user-activity.entity';
import { UserAdLinkEntity } from './user-ad-link.entity';
import { UserUserLabelEntity } from './user-user-label.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'bigint' })
  telegramId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  languageCode: string | null;

  @Column({ type: 'boolean', default: false })
  isPremium: boolean;

  @Column({ type: 'boolean', default: false })
  verified: boolean;

  @Column({ type: 'boolean', default: false })
  isScam: boolean;

  @Column({ type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'float', default: 0 })
  ratingManualDelta: number;

  @OneToOne(() => UserActivityEntity, (activity) => activity.user)
  activity?: UserActivityEntity;

  @OneToMany(() => UserAdLinkEntity, (adLink) => adLink.user)
  adLinks?: UserAdLinkEntity[];

  @OneToMany(() => ProfileViewEntity, (view) => view.profileUser)
  profileViews?: ProfileViewEntity[];

  @OneToMany(() => ProfileViewEntity, (view) => view.viewerUser)
  viewedProfiles?: ProfileViewEntity[];

  @OneToMany(() => DealEntity, (deal) => deal.buyerUser)
  buyDeals?: DealEntity[];

  @OneToMany(() => DealEntity, (deal) => deal.sellerUser)
  sellDeals?: DealEntity[];

  @OneToMany(() => UserUserLabelEntity, (userLabel) => userLabel.user)
  userLabels?: UserUserLabelEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
