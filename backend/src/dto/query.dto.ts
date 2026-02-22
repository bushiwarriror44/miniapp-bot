import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TelegramIdQueryDto {
  @IsNotEmpty({ message: 'telegramId is required' })
  telegramId: string;
}

export class UsernameQueryDto {
  @IsNotEmpty({ message: 'username is required' })
  username: string;
}

export class LimitCursorQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export class ModerationStatusQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}

export class PublicationsQueryDto {
  @IsNotEmpty({ message: 'telegramId is required' })
  telegramId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  cursor?: string;
}

export class AddFavoriteBodyDto {
  @IsNotEmpty({ message: 'section is required' })
  @IsString()
  section: string;

  @IsNotEmpty({ message: 'itemId is required' })
  @IsString()
  itemId: string;
}

export class RemoveFavoriteQueryDto {
  @IsNotEmpty({ message: 'telegramId is required' })
  telegramId: string;

  @IsNotEmpty({ message: 'section is required' })
  @IsString()
  section: string;

  @IsNotEmpty({ message: 'itemId is required' })
  @IsString()
  itemId: string;
}

export class VerifyPhoneBodyDto {
  @IsNotEmpty({ message: 'phoneNumber is required' })
  @IsString()
  phoneNumber: string;
}
