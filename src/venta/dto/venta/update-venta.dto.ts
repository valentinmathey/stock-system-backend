import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class UpdateVentaDto {
  @IsOptional()
  @IsDateString()
  fechaVenta?: string;

  @IsOptional()
  @IsNumber()
  ventaTotal?: number;
}
