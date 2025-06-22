import {
  IsDateString,
  IsInt,
  IsOptional,
  ValidateNested,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDetalleVentaDto {
  @ApiProperty()
  @IsInt()
  articuloId: number;

  @ApiProperty()
  @IsInt()
  cantidadArticulo: number;
}

export class CreateVentaDto {
  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsDateString()
  fechaVenta?: string;

  @ApiProperty({ type: [CreateDetalleVentaDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos un artículo para vender' })
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleVentaDto)
  detalle: CreateDetalleVentaDto[];
}
