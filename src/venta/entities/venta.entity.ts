import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { DetalleVenta } from './detalle-venta.entity';

@Entity()
export class Venta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ generated: 'increment' })
  codigoVenta: number;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fechaVenta: Date;

  @Column('double precision')
  ventaTotal: number;

  @Column({ type: 'date', nullable: true })
  fechaBajaVenta: Date;

  // RELACIONES

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta, { cascade: true })
  detallesVenta: DetalleVenta[];
}
