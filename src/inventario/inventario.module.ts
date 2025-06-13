import { Module } from '@nestjs/common';
import { InventarioService } from './services/inventario.service';
import { OrdenCompraModule } from 'src/orden-compra/orden-compra.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticuloProveedor } from 'src/articulo-proveedor/entities/articulo-proveedor.entity';

@Module({
  imports: [OrdenCompraModule, TypeOrmModule.forFeature([ArticuloProveedor])],
  providers: [InventarioService],
  exports: [InventarioService],
})
export class InventarioModule {}
