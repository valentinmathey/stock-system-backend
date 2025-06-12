import {
  IsDateString,
  IsInt,
  IsOptional,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDetalleVentaDto {
  @IsInt()
  articuloId: number;

  @IsInt()
  cantidadArticulo: number;
}

export class CreateVentaDto {
  @IsOptional()
  @IsDateString()
  fechaVenta?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un artículo para vender' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalle: CreateDetalleVentaDto[];
}
