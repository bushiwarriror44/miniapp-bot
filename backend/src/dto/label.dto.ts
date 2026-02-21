import { IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateLabelDto {
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  defaultColor?: string;
}

export class UpdateLabelDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  defaultColor?: string;
}

export class AddLabelToUserDto {
  @IsString()
  @IsNotEmpty({ message: 'labelId is required' })
  labelId: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  customColor?: string;
}

export class UpdateUserLabelColorDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  customColor?: string;
}
