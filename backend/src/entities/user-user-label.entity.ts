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
import { UserLabelEntity } from './user-label.entity';

@Entity({ name: 'user_user_labels' })
@Index(['userId', 'labelId'], { unique: true })
export class UserUserLabelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, (user) => user.userLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'uuid' })
  labelId: string;

  @ManyToOne(() => UserLabelEntity, (label) => label.userLabels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'labelId' })
  label: UserLabelEntity;

  @Column({ type: 'varchar', length: 7, nullable: true })
  customColor: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
