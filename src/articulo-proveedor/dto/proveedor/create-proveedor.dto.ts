import {
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsInt,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ModeloInventario } from '../../entities/articulo-proveedor.entity';

export class ArticuloParaProveedorDto {
  @IsNotEmpty()
  articuloId: number;

  @IsEnum(ModeloInventario)
  modeloInventario: ModeloInventario;

  @IsNumber()
  costoPedido: number;

  @IsNumber()
  costoCompraUnitarioArticulo: number;

  @IsInt()
  demoraEntregaProveedor: number;

  @IsOptional()
  @IsInt()
  tiempoRevision?: number;

  @IsOptional()
  proximaFechaRevision?: Date;
}

export class CreateProveedorDto {
  @IsNotEmpty()
  codigoProveedor: string;

  @IsNotEmpty()
  nombreProveedor: string;

  @ValidateNested()
  @Type(() => ArticuloParaProveedorDto)
  articulo: ArticuloParaProveedorDto;
}
