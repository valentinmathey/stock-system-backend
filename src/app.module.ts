import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppDataSource } from './data-source';
import { ArticuloProveedorModule } from './articulo-proveedor/articulo-proveedor.module';
import { OrdenCompraModule } from './orden-compra/orden-compra.module';
import { VentaModule } from './venta/venta.module';
import { LoggerMiddleware } from './logging.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(AppDataSource.options),
    ArticuloProveedorModule,
    OrdenCompraModule,
    VentaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('(.*)');
  }
}
