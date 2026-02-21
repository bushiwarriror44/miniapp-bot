import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class ProfileViewDto {
  @Transform(({ value }) =>
    value !== undefined && value !== null ? String(value) : undefined,
  )
  @IsOptional()
  viewerTelegramId?: string;
}
