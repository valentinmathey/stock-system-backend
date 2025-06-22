// src/articulos/dto/get-articulo.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Proveedor } from 'src/articulo-proveedor/entities/proveedor.entity';
import { GetProveedorDto } from '../proveedor/get-proveedor.dto';

export class GetArticuloDto {
  /* ───────────── Identificación ───────────── */
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'A-1001' })
  codigoArticulo: string;

  @ApiProperty({ example: 'Tornillo 6 × 20 mm' })
  nombreArticulo: string;

  @ApiPropertyOptional({
    example: 'Tornillo DIN 933, cabeza hexagonal, acero cincado',
    nullable: true,
  })
  descripcionArticulo?: string | null;

  /* ───────────── Precios y costos ───────────── */
  @ApiProperty({ example: 120.5, description: 'Precio de venta unitario' })
  precioVentaUnitarioArticulo: number;

  @ApiProperty({
    example: 2.75,
    description: 'Costo de almacenamiento por unidad',
  })
  costoAlmacenamientoPorUnidad: number;

  /* ───────────── Stock y planificación ───────────── */
  @ApiProperty({ example: 150 })
  stockActual: number;

  @ApiProperty({ example: 30 })
  stockSeguridad: number;

  @ApiPropertyOptional({ example: 1.35, nullable: true })
  cgi?: number | null;

  @ApiPropertyOptional({ example: 500, nullable: true })
  loteOptimo?: number | null;

  @ApiPropertyOptional({ example: 80, nullable: true })
  puntoPedido?: number | null;

  @ApiPropertyOptional({ example: 300, nullable: true })
  inventarioMaximo?: number | null;

  /* ───────────── Demanda y baja ───────────── */
  @ApiProperty({ example: 2000, description: 'Demanda anual (unidades/año)' })
  demandaAnual: number;

  @ApiPropertyOptional({
    example: '2025-12-31',
    type: String,
    nullable: true,
  })
  fechaBajaArticulo?: Date | null;

  /* ───────────── Relación con proveedor ───────────── */
  @ApiPropertyOptional({
    example: 7,
    description: 'Id del proveedor predeterminado',
    nullable: true,
  })
  proveedorPredeterminadoId?: number | null;

  @ApiPropertyOptional({ type: () => GetProveedorDto, nullable: true })
  proveedorPredeterminado?: GetProveedorDto | null;
}
