import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSupportDto {
  @Transform(({ value }) =>
    value !== undefined && value !== null ? String(value) : undefined,
  )
  @IsNotEmpty({ message: 'telegramId is required' })
  telegramId: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  username?: string | null;

  @IsString()
  @IsNotEmpty({ message: 'message is required' })
  @MaxLength(10000)
  message: string;
}
