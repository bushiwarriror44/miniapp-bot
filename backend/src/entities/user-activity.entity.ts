import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_activity' })
export class UserActivityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => UserEntity, (user) => user.activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'int', default: 0 })
  adsActive: number;

  @Column({ type: 'int', default: 0 })
  adsCompleted: number;

  @Column({ type: 'int', default: 0 })
  adsHidden: number;

  @Column({ type: 'int', default: 0 })
  dealsTotal: number;

  @Column({ type: 'int', default: 0 })
  dealsSuccessful: number;

  @Column({ type: 'int', default: 0 })
  dealsDisputed: number;

  @Column({ type: 'int', default: 0 })
  activeDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
