import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ModeloInventario } from '../../entities/articulo-proveedor.entity';

export class CreateArticuloProveedorDto {
  @IsNotEmpty()
  articuloId: number;

  @IsNotEmpty()
  proveedorId: number;

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
  tiempoRevision?: number | null;

  @IsOptional()
  proximaFechaRevision?: Date | null;
}
