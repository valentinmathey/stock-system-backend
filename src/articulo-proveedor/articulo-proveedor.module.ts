// NEST CORE ---------------------------------------------------------
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ENTITIES ----------------------------------------------------------
import { Articulo } from './entities/articulo.entity';
import { Proveedor } from './entities/proveedor.entity';
import { ArticuloProveedor } from './entities/articulo-proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity'; // sólo repo para validaciones

// SERVICES ----------------------------------------------------------
import { ArticuloService } from './services/articulo.service';
import { ProveedorService } from './services/proveedor.service';
import { ArticuloProveedorService } from './services/articulo-proveedor.service';

// CONTROLLERS -------------------------------------------------------
import { ArticuloController } from './controllers/articulo.controller';
import { ProveedorController } from './controllers/proveedor.controller';
import { ArticuloProveedorController } from './controllers/articulo-proveedor.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Articulo,
      Proveedor,
      ArticuloProveedor,
      OrdenCompra, // necesario para reglas de negocio en ProveedorService
    ]),
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
