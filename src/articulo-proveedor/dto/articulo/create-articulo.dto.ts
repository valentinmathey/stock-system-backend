import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsDateString,
} from 'class-validator';
import { Column } from 'typeorm';

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

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsNumber()
  cgi?: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsInt()
  loteOptimo?: number;

  @ApiProperty({ nullable: true })
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
  variacionDemanda: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsDateString()
  fechaBajaArticulo?: string;

  @ApiProperty({ nullable: true })
  @IsInt()
  @IsOptional()
  proveedorPredeterminadoId?: number;
}
