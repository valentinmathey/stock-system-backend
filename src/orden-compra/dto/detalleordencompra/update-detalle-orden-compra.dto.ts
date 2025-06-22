import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class UpdateDetalleOrdenCompraDto {
  @ApiProperty()
  @IsInt()
  articuloId: number;

  @ApiProperty()
  @IsInt()
  cantidadArticulo: number;
}
