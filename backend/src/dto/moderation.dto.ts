import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsIn,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const SECTIONS = [
  'buy-ads',
  'sell-ads',
  'jobs',
  'designers',
  'sell-channel',
  'buy-channel',
  'other',
] as const;

export class CreateModerationDto {
  @Transform(({ value }) => (value !== undefined && value !== null ? String(value) : undefined))
  @IsNotEmpty({ message: 'telegramId is required' })
  telegramId: string;

  @IsIn(SECTIONS, { message: 'section must be one of: ' + SECTIONS.join(', ') })
  @IsNotEmpty({ message: 'section is required' })
  section: (typeof SECTIONS)[number];

  @IsObject({ message: 'formData must be object' })
  @IsNotEmpty({ message: 'formData is required' })
  formData: Record<string, unknown>;
}

export class UpdateModerationDto {
  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string | null;
}

export class ApproveModerationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  publishedItemId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string | null;
}

export class RejectModerationDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  adminNote?: string | null;
}
