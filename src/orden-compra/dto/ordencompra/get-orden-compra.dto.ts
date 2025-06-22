import { ApiProperty } from '@nestjs/swagger';
import { GetProveedorDto } from 'src/articulo-proveedor/dto/proveedor/get-proveedor.dto';
import { DetalleOrdenCompra } from 'src/orden-compra/entities/detalle-orden-compra.entity';
import { GetEstadoOrdenCompraDto } from './getEstadoOrdenCompra.dto';
import { GetArticuloDto } from 'src/articulo-proveedor/dto/articulo/get-articulo.dto';

export class DetalleOrdenCompraDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  cantidadArticulo: number;

  @ApiProperty()
  costoCompraUnitarioArticulo: number;

  @ApiProperty()
  costoPedidoSubtotal: number;

  @ApiProperty()
  costoCompraSubtotal: number;

  @ApiProperty({ type: [GetArticuloDto] })
  articulo: GetArticuloDto;
}
export class GetOrdenCompraDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  codigoOrdenCompra: number;

  @ApiProperty()
  fechaOrdenCompra: Date;

  @ApiProperty()
  costoPedidoTotal: number;

  @ApiProperty()
  costoCompraTotal: number;

  @ApiProperty()
  costoTotal: number;

  @ApiProperty()
  fechaBajaOrdenCompra: Date;

  @ApiProperty({ type: [DetalleOrdenCompraDto] })
  detallesOrden: DetalleOrdenCompraDto[];

  @ApiProperty({ type: [GetEstadoOrdenCompraDto] })
  estado: GetEstadoOrdenCompraDto;

  proveedor: GetProveedorDto;
}
