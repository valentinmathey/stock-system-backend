// NEST CORE ---------------------------------------------------------
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ENTITIES ----------------------------------------------------------
import { Articulo } from './entities/articulo.entity';
import { Proveedor } from './entities/proveedor.entity';
import { ArticuloProveedor } from './entities/articulo-proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';

// SERVICES ----------------------------------------------------------
import { ArticuloService } from './services/articulo.service';
import { ProveedorService } from './services/proveedor.service';
import { ArticuloProveedorService } from './services/articulo-proveedor.service';

// CONTROLLERS -------------------------------------------------------
import { ArticuloController } from './controllers/articulo.controller';
import { ProveedorController } from './controllers/proveedor.controller';
import { ArticuloProveedorController } from './controllers/articulo-proveedor.controller';

import { InventarioModule } from 'src/inventario/inventario.module';
import { DetalleOrdenCompra } from 'src/orden-compra/entities/detalle-orden-compra.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Articulo,
      Proveedor,
      ArticuloProveedor,
      OrdenCompra, 
      DetalleOrdenCompra,
    ]),
    forwardRef(() => InventarioModule), //Para evitar dependencia circular
  ],
  controllers: [
    ArticuloController,
    ProveedorController,
    ArticuloProveedorController,
  ],
  providers: [ArticuloService, ProveedorService, ArticuloProveedorService],
  exports: [
    TypeOrmModule,               // para que otros módulos reutilicen repos
    ArticuloService,
    ProveedorService,
    ArticuloProveedorService,
  ],
})
export class ArticuloProveedorModule {}
