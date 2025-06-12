import {
  IsNumber,
  IsInt,
  IsDateString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ModeloInventario } from '../../entities/articulo-proveedor.entity';

export class CreateArticuloProveedorDto {
  @IsInt()
  articuloId: number;

  @IsInt()
  proveedorId: number;

  @IsNumber()
  costoPedido: number;

  @IsNumber()
  costoCompraUnitarioArticulo: number;

  @IsInt()
  demoraEntregaProveedor: number;

  @IsOptional()
  @IsInt()
  tiempoRevision: number;
  @IsOptional()
  @IsEnum(ModeloInventario)
  modeloInvenatario: ModeloInventario;
}
