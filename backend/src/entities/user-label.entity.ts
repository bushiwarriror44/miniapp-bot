import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserUserLabelEntity } from './user-user-label.entity';

@Entity({ name: 'user_labels' })
@Index(['name'], { unique: true })
export class UserLabelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 7 })
  defaultColor: string;

  @OneToMany(() => UserUserLabelEntity, (userLabel) => userLabel.label)
  userLabels?: UserUserLabelEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
