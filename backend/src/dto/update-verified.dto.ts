import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateVerifiedDto {
  @IsBoolean()
  @IsNotEmpty()
  verified: boolean;
}
