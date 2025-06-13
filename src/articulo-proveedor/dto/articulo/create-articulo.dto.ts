import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateArticuloDto {
  @IsString()
  codigoArticulo: string;

  @IsString()
  nombreArticulo: string;

  @IsOptional()
  @IsString()
  descripcionArticulo?: string;

  @IsNumber()
  precioVentaUnitarioArticulo: number;

  @IsNumber()
  costoAlmacenamientoPorUnidad: number;

  @IsInt()
  stockActual: number;

  @IsInt()
  stockSeguridad: number;

  @IsOptional()
  @IsNumber()
  cgi?: number;

  @IsOptional()
  @IsInt()
  loteOptimo?: number;

  @IsOptional()
  @IsInt()
  puntoPedido?: number;

  @IsInt()
  inventarioMaximo: number;

  @IsNumber()
  demandaAnual: number;

  @IsOptional()
  @IsDateString()
  fechaBajaArticulo?: string;

  @IsInt()
  @IsOptional()
  proveedorPredeterminadoId?: number;
}
