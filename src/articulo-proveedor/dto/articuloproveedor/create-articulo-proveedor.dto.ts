import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ModeloInventario } from '../../entities/articulo-proveedor.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateArticuloProveedorDto {
  @ApiProperty()
  @IsNotEmpty()
  articuloId: number;

  @ApiProperty()
  @IsNotEmpty()
  proveedorId: number;

  @ApiProperty()
  @IsEnum(ModeloInventario)
  modeloInventario: ModeloInventario;

  @ApiProperty()
  @IsNumber()
  costoPedido: number;

  @ApiProperty()
  @IsNumber()
  costoCompraUnitarioArticulo: number;

  @ApiProperty()
  @IsInt()
  demoraEntregaProveedor: number;

  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsInt()
  tiempoRevision?: number | null;

  @ApiProperty({ nullable: true })
  @IsOptional()
  proximaFechaRevision?: Date | null;
}
