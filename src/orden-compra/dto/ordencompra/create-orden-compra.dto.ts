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

export class CreateOrdenCompraDto {

  @IsInt()
  proveedorId: number;

  @IsDateString()
  fechaOrdenCompra: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleOrdenDto)
  detalles: CreateDetalleOrdenDto[];
}
