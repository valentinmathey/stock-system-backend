// NEST CORE ---------------------------------------------------------
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ENTITIES ----------------------------------------------------------
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';

// SERVICES ----------------------------------------------------------
import { VentaService } from './services/venta.service';

// CONTROLLER --------------------------------------------------------
import { VentaController } from './controllers/venta.controller';

// MODULE DEPENDENCIES ----------------------------------------------
import { ArticuloProveedorModule } from 'src/articulo-proveedor/articulo-proveedor.module';
import { InventarioModule } from 'src/inventario/inventario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta]),
    ArticuloProveedorModule,
    InventarioModule,
  ],
  controllers: [VentaController],
  providers: [VentaService],
})
export class VentaModule {}
