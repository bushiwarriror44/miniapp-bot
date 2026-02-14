import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DealEntity } from './entities/deal.entity';
import { ProfileViewEntity } from './entities/profile-view.entity';
import { UserEntity } from './entities/user.entity';
import { UserActivityEntity } from './entities/user-activity.entity';
import { UserAdLinkEntity } from './entities/user-ad-link.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'miniapp_bot',
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      UserActivityEntity,
      ProfileViewEntity,
      UserAdLinkEntity,
      DealEntity,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
