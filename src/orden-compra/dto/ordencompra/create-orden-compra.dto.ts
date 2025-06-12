import {
  IsString,
  IsDateString,
  IsNumber,
  IsInt,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrdenCompraDto {
  @IsString()
  codigoOrdenCompra: string;

  @IsDateString()
  fechaOrdenCompra: string;

  @IsNumber()
  costoPedidoTotal: number;

  @IsNumber()
  costoCompraTotal: number;

  @IsNumber()
  costoTotal: number;

  @IsInt()
  proveedorId: number;

  @IsInt()
  estadoId: number;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateDetalleOrdenCompraDto)
  detalles: CreateDetalleOrdenCompraDto[];
}

export class CreateDetalleOrdenCompraDto {
  @IsInt()
  articuloId: number;

  @IsInt()
  cantidadArticulo: number;

  @IsNumber()
  costoCompraUnitarioArticulo: number;

  @IsNumber()
  costoPedidoSubtotal: number;

  @IsNumber()
  costoCompraSubtotal: number;
}
