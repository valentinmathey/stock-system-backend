import { IsInt } from 'class-validator';

export class CreateDetalleOrdenDto {
  @IsInt()
  articuloId: number;

  @IsInt()
  cantidadArticulo: number;
}

