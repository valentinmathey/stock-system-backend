import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ArticuloProveedor } from './articulo-proveedor.entity';

@Entity()
export class Proveedor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigoProveedor: string;
  @Column()
  nombreProveedor: string;

  @Column({ type: 'date', nullable: true })
  fechaBajaProveedor: Date;

  @OneToMany(() => ArticuloProveedor, (ap) => ap.proveedor)
  articulosProveedor: ArticuloProveedor[];
}
