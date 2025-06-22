// ======================= MÓDULOS NEST =============================
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ========================= ENTIDADES ==============================
import { ArticuloProveedor } from 'src/articulo-proveedor/entities/articulo-proveedor.entity';

// ========================= SERVICIOS ==============================
import { InventarioService } from './services/inventario.service';

// ======================= MÓDULOS EXTERNOS =========================
import { OrdenCompraModule } from 'src/orden-compra/orden-compra.module';
import { ScheduleModule } from '@nestjs/schedule';

// ========================== MÓDULO ================================
@Module({
  /* ------------ Entidades y módulos importados ------------------ */
  imports: [
    TypeOrmModule.forFeature([ArticuloProveedor]),
    ScheduleModule.forRoot(),
    forwardRef(() => OrdenCompraModule), // evita el bucle de dependencias
  ],

  /* -------------------- Servicios disponibles -------------------- */
  providers: [InventarioService],

  /* ------------------ Exports para otros módulos ----------------- */
  exports: [InventarioService],
})
export class InventarioModule {}
