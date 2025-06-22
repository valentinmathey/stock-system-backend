import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  OneToMany,
  ManyToOne,
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

  @Column('double precision', { nullable: true })
  cgi: number | null;

  @Column('int', { nullable: true })
  loteOptimo: number | null;

  @Column('int', { nullable: true })
  puntoPedido: number | null;

  @Column('int', { nullable: true })
  inventarioMaximo: number | null;

  @Column('double precision')
  demandaAnual: number;

  @Column('int', { nullable: true })
  variacionDemanda: number | null;

  @Column({ type: 'date', nullable: true })
  fechaBajaArticulo: Date;

  // RELACIONES
  @ManyToOne(() => Proveedor, { nullable: true })
  @JoinColumn()
  proveedorPredeterminado: Proveedor | null;

  @OneToMany(() => ArticuloProveedor, (ap) => ap.articulo)
  articulosProveedor: ArticuloProveedor[];
}
