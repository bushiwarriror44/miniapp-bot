import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateBlockedDto {
  @IsBoolean()
  @IsNotEmpty()
  isBlocked: boolean;
}
