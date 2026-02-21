import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

export type DealStatus = 'pending' | 'successful' | 'disputed' | 'cancelled';

@Entity({ name: 'deals' })
export class DealEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  buyerUserId: string;

  @Column({ type: 'uuid' })
  sellerUserId: string;

  @ManyToOne(() => UserEntity, (user) => user.buyDeals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyerUserId' })
  buyerUser: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.sellDeals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sellerUserId' })
  sellerUser: UserEntity;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: DealStatus;

  @Column({ type: 'float', default: 0 })
  amount: number;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
