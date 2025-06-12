import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ArticuloProveedor } from './articulo-proveedor.entity';
import { Proveedor } from './proveedor.entity';

@Entity()
export class Articulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigoArticulo: string;

  @Column()
  nombreArticulo: string;

  @Column({ type: 'text', nullable: true })
  descripcionArticulo: string;

  @Column('double precision')
  precioVentaUnitarioArticulo: number;

  @Column('double precision')
  costoAlmacenamientoPorUnidad: number;

  @Column('int')
  stockActual: number;

  @Column('int')
  stockSeguridad: number;

  @Column('double precision')
  cgi: number;

  @Column('int')
  loteOptimo: number;

  @Column('int')
  puntoPedido: number;

  @Column('int')
  inventarioMaximo: number;

  @Column('double precision')
  demandaAnual: number;

  @Column({ type: 'date', nullable: true })
  fechaBajaArticulo: Date;

  // RELACIONES
  @OneToOne(() => Proveedor)
  @JoinColumn()
  proveedorPredeterminado: Proveedor;

  @OneToMany(() => ArticuloProveedor, (ap) => ap.articulo)
  articulosProveedor: ArticuloProveedor[];
}
