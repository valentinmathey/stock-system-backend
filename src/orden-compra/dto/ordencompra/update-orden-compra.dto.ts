import {
  IsArray,
  ValidateNested,
  IsInt,
  IsDateString,
  IsOptional,
  ArrayMinSize,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateDetalleOrdenCompraDto } from '../detalleordencompra/update-detalle-orden-compra.dto';

export class UpdateOrdenCompraDto {
  @IsOptional()
  @IsString()
  codigoOrdenCompra?: string;

  @IsOptional()
  @IsDateString()
  fechaOrdenCompra?: string;

  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsOptional()
  @IsInt()
  estadoId?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateDetalleOrdenCompraDto)
  detalles: UpdateDetalleOrdenCompraDto[];
}
