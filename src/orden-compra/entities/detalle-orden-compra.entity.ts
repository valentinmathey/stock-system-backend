import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { OrdenCompra } from './orden-compra.entity';
import { ArticuloProveedor } from '../../articulo-proveedor/entities/articulo-proveedor.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';

@Entity()
export class DetalleOrdenCompra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  cantidadArticulo: number;

  @Column('double precision')
  costoCompraUnitarioArticulo: number;

  @Column('double precision')
  costoPedidoSubtotal: number;

  @Column('double precision')
  costoCompraSubtotal: number;

  // RELACIONES

  @ManyToOne(() => OrdenCompra, (orden) => orden.detallesOrden)
  ordenCompra: OrdenCompra;

  //@ManyToOne(() => ArticuloProveedor)
  //articuloProveedor: ArticuloProveedor;

  @ManyToOne(() => Articulo)
  articulo: Articulo;
}
