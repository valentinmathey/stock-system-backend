import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class EstadoOrdenCompra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  codigoEstadoOrdenCompra: string;

  @Column()
  nombreEstadoOrdenCompra: string;

  @Column({ type: 'date', nullable: true })
  fechaBajaEstadoOrdenCompra: Date;
}
