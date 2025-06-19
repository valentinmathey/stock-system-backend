import {
  Controller,
  Get,
} from '@nestjs/common';

import { EstadoOrdenCompraService } from '../services/estado-orden-compra.service';
import { EstadoOrdenCompra } from '../entities/estado-orden-compra.entity';

@Controller('estados-orden-compra')
export class EstadoOrdenCompraController {
  /* -------------------- Inyección de Servicio -------------------- */
  constructor(private readonly service: EstadoOrdenCompraService) {}

  /* ---------------------------- READ ----------------------------- */
  
  // Devuelve todos los estados posibles para una orden de compra
  @Get()
  findAll(): Promise<EstadoOrdenCompra[]> {
    return this.service.findAll();
  }
}
