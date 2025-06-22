import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class GetEstadoOrdenCompraDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  codigoEstadoOrdenCompra: string;

  @ApiProperty()
  nombreEstadoOrdenCompra: string;

  @ApiProperty({ nullable: true })
  fechaBajaEstadoOrdenCompra: Date;
}
