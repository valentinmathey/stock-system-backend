// NEST CORE ---------------------------------------------------------
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ENTITIES ----------------------------------------------------------
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';

// SERVICES ----------------------------------------------------------
import { VentaService } from './services/venta.service';
import { DetalleVentaService } from './services/detalle-venta.service';

// CONTROLLER --------------------------------------------------------
import { VentaController } from './controllers/venta.controller';

// MODULE DEPENDENCIES ----------------------------------------------
import { ArticuloProveedorModule } from 'src/articulo-proveedor/articulo-proveedor.module';

@Module({
  imports: [
    /* Repositorios locales */
    TypeOrmModule.forFeature([Venta, DetalleVenta]),

    /* Acceso a servicios / repos de Artículo y Proveedor */
    ArticuloProveedorModule,
  ],
  controllers: [VentaController],
  providers: [VentaService, DetalleVentaService],
})
export class VentaModule {}
