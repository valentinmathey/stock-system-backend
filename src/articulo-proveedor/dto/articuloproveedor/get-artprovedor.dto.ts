// src/articulos-proveedor/dto/get-articulo-proveedor.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModeloInventario } from '../../entities/articulo-proveedor.entity';
import { GetArticuloDto } from '../articulo/get-articulo.dto';
import { GetProveedorDto } from '../proveedor/get-proveedor.dto';

export class GetArticuloProveedorDto {
  /* ───────────── Identificación ───────────── */
  @ApiProperty({ example: 15 })
  id: number;

  /* ───────────── Configuración de inventario ───────────── */
  @ApiProperty({
    enum: ModeloInventario,
    enumName: 'ModeloInventario',
    example: ModeloInventario.LOTE_FIJO,
  })
  modeloInventario: ModeloInventario;

  @ApiProperty({
    example: 500,
    description: 'Costo de realizar un pedido (moneda local)',
  })
  costoPedido: number;

  @ApiProperty({ example: 110.25, description: 'Costo de compra unitario' })
  costoCompraUnitarioArticulo: number;

  @ApiProperty({
    example: 7,
    description: 'Demora en días entre pedido y entrega',
  })
  demoraEntregaProveedor: number;

  /* ───────────── Revisión y próximas fechas ───────────── */
  @ApiPropertyOptional({
    example: 30,
    description: 'Intervalo de revisión (días) cuando se usa TIEMPO_FIJO',
    nullable: true,
  })
  tiempoRevision?: number | null;

  @ApiPropertyOptional({
    example: '2025-08-01',
    type: String,
    description: 'Próxima fecha de revisión programada',
    nullable: true,
  })
  proximaFechaRevision?: Date | null;

  /* ───────────── Relaciones ───────────── */

  @ApiProperty({ type: () => GetArticuloDto })
  articulo: GetArticuloDto;

  @ApiProperty({ type: () => GetProveedorDto })
  proveedor: GetProveedorDto;
}
