import {
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
  IsInt,
} from 'class-validator';

export class UpdateOrdenCompraDto {
  @IsOptional()
  @IsString()
  codigoOrdenCompra?: string;

  @IsOptional()
  @IsDateString()
  fechaOrdenCompra?: string;

  @IsOptional()
  @IsNumber()
  costoPedidoTotal?: number;

  @IsOptional()
  @IsNumber()
  costoCompraTotal?: number;

  @IsOptional()
  @IsNumber()
  costoTotal?: number;

  @IsOptional()
  @IsInt()
  proveedorId?: number;

  @IsOptional()
  @IsInt()
  estadoId?: number;
}
