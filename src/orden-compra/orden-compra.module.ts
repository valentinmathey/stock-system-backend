// ======================= MÓDULOS NEST =============================
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ========================= ENTIDADES ==============================
import { OrdenCompra } from './entities/orden-compra.entity';
import { DetalleOrdenCompra } from './entities/detalle-orden-compra.entity';
import { EstadoOrdenCompra } from './entities/estado-orden-compra.entity';
import { Articulo } from '../articulo-proveedor/entities/articulo.entity';

// ========================= SERVICIOS ==============================
import { OrdenCompraService } from './services/orden-compra.service';
import { EstadoOrdenCompraService } from './services/estado-orden-compra.service';

// ======================== CONTROLADORES ===========================
import { OrdenCompraController } from './controllers/orden-compra.controller';
import { EstadoOrdenCompraController } from './controllers/estado-orden-compra.controller';

// ======================= MÓDULOS EXTERNOS =========================
import { ArticuloProveedorModule } from 'src/articulo-proveedor/articulo-proveedor.module';

// ========================== MÓDULO ================================
@Module({
  /* ------------ Entidades y módulos importados ------------------ */
  imports: [
    TypeOrmModule.forFeature([
      OrdenCompra,
      DetalleOrdenCompra,
      EstadoOrdenCompra,
      Articulo,
    ]),
    forwardRef(() => ArticuloProveedorModule), // evita dependencia circular
  ],

  /* ------------------- Controladores declarados ------------------ */
  controllers: [
    OrdenCompraController,
    EstadoOrdenCompraController,
  ],

  /* -------------------- Servicios disponibles -------------------- */
  providers: [
    OrdenCompraService,
    EstadoOrdenCompraService,
  ],

  /* ------------------ Exports para otros módulos ----------------- */
  exports: [
    OrdenCompraService,
  ],
})
export class OrdenCompraModule {}
