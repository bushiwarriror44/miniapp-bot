import { IsNumber, IsNotEmpty } from 'class-validator';

export class UpdateRatingDto {
  @IsNumber()
  @IsNotEmpty()
  ratingManualDelta: number;
}
