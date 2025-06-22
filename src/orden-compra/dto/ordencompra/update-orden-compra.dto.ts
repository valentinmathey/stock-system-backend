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
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrdenCompraDto {
  @IsOptional()
  @IsString()
  @ApiProperty()
  codigoOrdenCompra?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty()
  fechaOrdenCompra?: string;

  @IsOptional()
  @IsInt()
  @ApiProperty()
  proveedorId?: number;

  @IsOptional()
  @IsInt()
  @ApiProperty()
  estadoId?: number;

  @ApiProperty({ type: [UpdateDetalleOrdenCompraDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateDetalleOrdenCompraDto)
  detalles?: UpdateDetalleOrdenCompraDto[];
}
