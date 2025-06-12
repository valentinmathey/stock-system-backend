import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { DetalleOrdenCompra } from './detalle-orden-compra.entity';
import { EstadoOrdenCompra } from './estado-orden-compra.entity';
import { Proveedor } from 'src/articulo-proveedor/entities/proveedor.entity';

@Entity()
export class OrdenCompra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ generated: 'increment' })
  codigoOrdenCompra: number;

  @Column({ type: 'date' })
  fechaOrdenCompra: Date;

  @Column('double precision')
  costoPedidoTotal: number;

  @Column('double precision')
  costoCompraTotal: number;

  @Column('double precision')
  costoTotal: number;

  @Column({ type: 'date', nullable: true })
  fechaBajaOrdenCompra: Date;

  // RELACIONES

  @OneToMany(() => DetalleOrdenCompra, (detalle) => detalle.ordenCompra, {
    cascade: true,
  })
  detallesOrden: DetalleOrdenCompra[];

  @ManyToOne(() => EstadoOrdenCompra)
  estado: EstadoOrdenCompra;

  @ManyToOne(() => Proveedor)
  proveedor: Proveedor;
}
