import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class UpdateVentaDto {
  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsDateString()
  fechaVenta?: string;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsNumber()
  ventaTotal?: number;
}
