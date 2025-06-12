import { IsInt } from 'class-validator';

export class UpdateDetalleOrdenCompraDto {
  @IsInt()
  articuloId: number;

  @IsInt()
  cantidadArticulo: number;
}
