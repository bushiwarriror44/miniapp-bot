import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateScamDto {
  @IsBoolean()
  @IsNotEmpty()
  isScam: boolean;
}
