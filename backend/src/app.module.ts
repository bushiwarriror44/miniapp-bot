import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { HttpExceptionLoggerFilter } from './filters/http-exception-logger.filter';
import { DealEntity } from './entities/deal.entity';
import { ModerationRequestEntity } from './entities/moderation-request.entity';
import { ProfileViewEntity } from './entities/profile-view.entity';
import { SupportRequestEntity } from './entities/support-request.entity';
import { UserEntity } from './entities/user.entity';
import { UserActivityEntity } from './entities/user-activity.entity';
import { UserAdLinkEntity } from './entities/user-ad-link.entity';
import { UserLabelEntity } from './entities/user-label.entity';
import { UserUserLabelEntity } from './entities/user-user-label.entity';

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
      synchronize: false,
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      migrationsRun: process.env.RUN_MIGRATIONS === '1',
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      UserActivityEntity,
      ProfileViewEntity,
      UserAdLinkEntity,
      DealEntity,
      ModerationRequestEntity,
      SupportRequestEntity,
      UserLabelEntity,
      UserUserLabelEntity,
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpExceptionLoggerFilter },
  ],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
