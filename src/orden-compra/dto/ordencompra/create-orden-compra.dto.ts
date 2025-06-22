import {
  IsArray,
  ValidateNested,
  IsInt,
  IsDateString,
  ArrayMinSize,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDetalleOrdenDto } from '../detalleordencompra/create-detalle-orden.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateOrdenCompraDto {
  @IsInt()
  @ApiProperty()
  proveedorId: number;

  @IsDateString()
  @ApiProperty()
  fechaOrdenCompra: string;

  @ApiProperty({ type: [CreateDetalleOrdenDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleOrdenDto)
  detalles: CreateDetalleOrdenDto[];
}
