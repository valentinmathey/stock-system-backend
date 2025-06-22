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
  @ApiProperty()
  codigoArticulo: string;

  @ApiProperty()
  @IsString()
  nombreArticulo: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  descripcionArticulo?: string;

  @ApiProperty()
  @IsNumber()
  precioVentaUnitarioArticulo: number;

  @ApiProperty()
  @IsNumber()
  costoAlmacenamientoPorUnidad: number;

  @ApiProperty()
  @IsInt()
  stockActual: number;

  @ApiProperty()
  @IsInt()
  stockSeguridad: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  cgi?: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  loteOptimo?: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  puntoPedido?: number;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  inventarioMaximo: number;

  @IsNumber()
  @ApiProperty()
  demandaAnual: number;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  fechaBajaArticulo?: string;

  @ApiProperty()
  @IsInt()
  @IsOptional()
  proveedorPredeterminadoId?: number;
}
