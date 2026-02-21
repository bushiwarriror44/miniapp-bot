import {
  IsOptional,
  IsBoolean,
  IsString,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class TrackUserDto {
  @Transform(({ value }) =>
    value !== undefined && value !== null ? String(value) : undefined,
  )
  @IsNotEmpty({ message: 'telegramId is required' })
  telegramId: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  username?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  firstName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  lastName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  languageCode?: string | null;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;
}
