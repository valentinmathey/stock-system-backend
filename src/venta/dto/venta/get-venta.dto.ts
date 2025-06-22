import { ApiProperty } from '@nestjs/swagger';
import { GetArticuloDto } from 'src/articulo-proveedor/dto/articulo/get-articulo.dto';
import { DetalleVenta } from 'src/venta/entities/detalle-venta.entity';

export class DetalleVentaDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  cantidadArticulo: number;

  @ApiProperty()
  precioVentaUnitarioArticulo: number;

  @ApiProperty()
  ventaSubtotal: number;

  @ApiProperty({ type: [GetArticuloDto] })
  articulo: GetArticuloDto;
}

export class GetVentaDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  codigoVenta: number;

  @ApiProperty()
  fechaVenta: Date;

  @ApiProperty()
  ventaTotal: number;

  @ApiProperty()
  fechaBajaVenta: Date;

  @ApiProperty({ type: [DetalleVentaDto] })
  detallesVenta: DetalleVentaDto[];
}
