import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Articulo } from './articulo.entity';
import { Proveedor } from './proveedor.entity';

export enum ModeloInventario {
  LOTE_FIJO = 'LOTE_FIJO',
  TIEMPO_FIJO = 'TIEMPO_FIJO',
}
@Entity()
@Unique(['articulo', 'proveedor'])
export class ArticuloProveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ModeloInventario,
    default: ModeloInventario.LOTE_FIJO,
  })
  modeloInventario: ModeloInventario;

  @Column('double precision')
  costoPedido: number;

  @Column('double precision')
  costoCompraUnitarioArticulo: number;

  @Column('int')
  demoraEntregaProveedor: number;

  @Column('int', { nullable: true })
  tiempoRevision: number;

  @Column('date', { nullable: true })
  proximaFechaRevision: Date;

  @ManyToOne(() => Articulo, (articulo) => articulo.articulosProveedor)
  articulo: Articulo;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.articulosProveedor)
  proveedor: Proveedor;
}
