import { Controller, Get } from '@nestjs/common';

import { EstadoOrdenCompraService } from '../services/estado-orden-compra.service';
import { EstadoOrdenCompra } from '../entities/estado-orden-compra.entity';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { GetEstadoOrdenCompraDto } from '../dto/ordencompra/getEstadoOrdenCompra.dto';

@Controller('estados-orden-compra')
@ApiExtraModels(GetEstadoOrdenCompraDto)
export class EstadoOrdenCompraController {
  /* -------------------- Inyección de Servicio -------------------- */
  constructor(private readonly service: EstadoOrdenCompraService) {}

  /* ---------------------------- READ ----------------------------- */

  // Devuelve todos los estados posibles para una orden de compra
  @Get()
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(GetEstadoOrdenCompraDto) },
    },
  })
  findAll(): Promise<EstadoOrdenCompra[]> {
    return this.service.findAll();
  }
}
