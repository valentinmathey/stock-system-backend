// ======================= MÓDULOS NEST =============================
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ========================= ENTIDADES ==============================
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';

// ========================= SERVICIOS ==============================
import { VentaService } from './services/venta.service';

// ======================== CONTROLADORES ===========================
import { VentaController } from './controllers/venta.controller';

// ======================= MÓDULOS EXTERNOS =========================
import { ArticuloProveedorModule } from 'src/articulo-proveedor/articulo-proveedor.module';
import { InventarioModule } from 'src/inventario/inventario.module';
import { OrdenCompraModule } from 'src/orden-compra/orden-compra.module';

// ========================== MÓDULO ================================
@Module({
  /* ------------ Entidades y módulos importados ------------------ */
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta]),
    ArticuloProveedorModule,
    InventarioModule,
    forwardRef(() => OrdenCompraModule), // evita dependencia circular
  ],

  /* ------------------- Controladores declarados ------------------ */
  controllers: [VentaController],

  /* -------------------- Servicios disponibles -------------------- */
  providers: [VentaService],
})
export class VentaModule {}
