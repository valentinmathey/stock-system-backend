// MODULES -----------------------------------------------------------
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ENTITIES ----------------------------------------------------------
import { OrdenCompra } from './entities/orden-compra.entity';
import { DetalleOrdenCompra } from './entities/detalle-orden-compra.entity';
import { EstadoOrdenCompra } from './entities/estado-orden-compra.entity';
import { Articulo } from '../articulo-proveedor/entities/articulo.entity';

// SERVICES ----------------------------------------------------------
import { OrdenCompraService } from './services/orden-compra.service';
import { EstadoOrdenCompraService } from './services/estado-orden-compra.service';

// CONTROLLERS -------------------------------------------------------
import { OrdenCompraController } from './controllers/orden-compra.controller';

// MODULES DEPENDENCIES ---------------------------------------------
import { ArticuloProveedorModule } from 'src/articulo-proveedor/articulo-proveedor.module';
import { EstadoOrdenCompraController } from './controllers/estado-orden-compra.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrdenCompra,
      DetalleOrdenCompra,
      EstadoOrdenCompra,
      // Articulo solo se usa en servicios internos
      Articulo,
    ]),
    forwardRef(() => ArticuloProveedorModule), //Para evitar dependencia circular
  ],
  controllers: [OrdenCompraController, EstadoOrdenCompraController],
  providers: [OrdenCompraService, EstadoOrdenCompraService],
  exports: [OrdenCompraService],
})
export class OrdenCompraModule {}
