// src/orden-compra/controller/estado-orden-compra.controller.ts
import { Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { EstadoOrdenCompraService } from '../services/estado-orden-compra.service';
import { EstadoOrdenCompra } from '../entities/estado-orden-compra.entity';

@Controller('estados-orden-compra')
export class EstadoOrdenCompraController {
  constructor(private readonly service: EstadoOrdenCompraService) {}

  @Get()
  findAll(): Promise<EstadoOrdenCompra[]> {
    return this.service.findAll();
  }

}
