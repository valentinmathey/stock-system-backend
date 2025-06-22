// ======================= MÓDULOS NEST =============================
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// ======================= CORE APP ================================
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppDataSource } from './data-source';

// ======================= MÓDULOS INTERNOS =========================
import { ArticuloProveedorModule } from './articulo-proveedor/articulo-proveedor.module';
import { OrdenCompraModule } from './orden-compra/orden-compra.module';
import { VentaModule } from './venta/venta.module';
import { InventarioModule } from './inventario/inventario.module';

// ========================= MIDDLEWARE =============================
import { LoggerMiddleware } from './logging.middleware';

// ========================== MÓDULO ================================
@Module({
  /* ------------- Módulos importados globalmente ----------------- */
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Variables de entorno
    TypeOrmModule.forRoot(AppDataSource.options), // Configuración DB
    ArticuloProveedorModule,
    OrdenCompraModule,
    VentaModule,
    InventarioModule,
  ],

  /* ------------------- Controladores principales ---------------- */
  controllers: [AppController],

  /* ---------------------- Servicios base ------------------------- */
  providers: [AppService],
})
export class AppModule {
  /* ------------- Middleware aplicado a todas las rutas ---------- */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('(.*)');
  }
}
