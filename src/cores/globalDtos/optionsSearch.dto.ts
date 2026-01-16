import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
export class OptionSearchDto {
  @IsString()
  @IsOptional()
  searchInput?: string;

  @IsNumber()
  @Min(1)
  @Transform((value) => {
    return parseFloat(value.value);
  })
  @IsOptional()
  limit?: number = 1;

  @IsNumber()
  @Min(0)
  @Transform((value) => {
    return parseFloat(value.value);
  })
  @IsOptional()
  skip?: number = 0;
}
