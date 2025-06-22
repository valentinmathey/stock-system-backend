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
import { ApiProperty } from '@nestjs/swagger';

export class ArticuloParaProveedorDto {
  @ApiProperty()
  @IsNotEmpty()
  articuloId: number;

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

  @ApiProperty()
  @IsOptional()
  @IsInt()
  tiempoRevision?: number;

  @ApiProperty()
  @IsOptional()
  proximaFechaRevision?: Date;
}

export class CreateProveedorDto {
  @ApiProperty()
  @IsNotEmpty()
  codigoProveedor: string;

  @ApiProperty()
  @IsNotEmpty()
  nombreProveedor: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => ArticuloParaProveedorDto)
  articulo: ArticuloParaProveedorDto;
}
