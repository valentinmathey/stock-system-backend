import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Venta } from './venta.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';

@Entity()
export class DetalleVenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  cantidadArticulo: number;

  @Column('double precision')
  precioVentaUnitarioArticulo: number;

  @Column('double precision')
  ventaSubtotal: number;

  // RELACIONES

  @ManyToOne(() => Venta, (venta) => venta.detallesVenta)
  venta: Venta;

  @ManyToOne(() => Articulo)
  articulo: Articulo;
}
