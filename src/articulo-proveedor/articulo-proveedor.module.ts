// ======================= MÓDULOS NEST ================================
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ========================= ENTIDADES ==============================
import { Articulo } from './entities/articulo.entity';
import { Proveedor } from './entities/proveedor.entity';
import { ArticuloProveedor } from './entities/articulo-proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';
import { DetalleOrdenCompra } from 'src/orden-compra/entities/detalle-orden-compra.entity';

// ========================= SERVICIOS ==============================
import { ArticuloService } from './services/articulo.service';
import { ProveedorService } from './services/proveedor.service';
import { ArticuloProveedorService } from './services/articulo-proveedor.service';

// ======================== CONTROLADORES ===========================
import { ArticuloController } from './controllers/articulo.controller';
import { ProveedorController } from './controllers/proveedor.controller';
import { ArticuloProveedorController } from './controllers/articulo-proveedor.controller';

// ========================== MÓDULO ================================
import { InventarioModule } from 'src/inventario/inventario.module';

@Module({
  /* ----------- Importación de módulos y entidades --------------- */
  imports: [
    TypeOrmModule.forFeature([
      Articulo,
      Proveedor,
      ArticuloProveedor,
      OrdenCompra,
      DetalleOrdenCompra,
    ]),
    forwardRef(() => InventarioModule), // Evita dependencia circular
  ],

  /* ------------------- Controladores declarados ------------------ */
  controllers: [
    ArticuloController,
    ProveedorController,
    ArticuloProveedorController,
  ],

  /* -------------------- Servicios disponibles -------------------- */
  providers: [
    ArticuloService,
    ProveedorService,
    ArticuloProveedorService,
  ],

  /* ------------------ Exports para otros módulos ----------------- */
  exports: [
    TypeOrmModule, // Exporta repositorios TypeORM
    ArticuloService,
    ProveedorService,
    ArticuloProveedorService,
  ],
})
export class ArticuloProveedorModule {}
