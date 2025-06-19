import {
  Controller,
  Post,
  Get,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';

import { OrdenCompraService } from '../services/orden-compra.service';
import { CreateOrdenCompraDto } from '../dto/ordencompra/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from '../dto/ordencompra/update-orden-compra.dto';

@Controller('ordenes-compra')
export class OrdenCompraController {
  /* -------------------- Inyección de Servicio -------------------- */
  constructor(private readonly ordenCompraService: OrdenCompraService) {}

  /* --------------------------- CREATE ---------------------------- */
  @Post()
  create(@Body() dto: CreateOrdenCompraDto) {
    return this.ordenCompraService.create(dto);
  }

  /* ---------------------------- READ ----------------------------- */
  
  // Devuelve la lista de todas las órdenes de compra
  @Get()
  findAll() {
    return this.ordenCompraService.findAll();
  }
  
  // Devuelve una orden de compra específica por ID
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenCompraService.findOne(id);
  }

  /* --------------------------- UPDATE ---------------------------- */

  // Actualiza una orden de compra por ID
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdenCompraDto,
  ) {
    return this.ordenCompraService.update(id, dto);
  }

  // Marca una orden de compra como finalizada
  @Patch(':id/finalizar')
  finalizar(@Param('id', ParseIntPipe) id: number) {
    return this.ordenCompraService.finalizar(id);
  }

  // Confirma una orden de compra
  @Patch(':id/confirmar')
  confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.ordenCompraService.confirmar(id);
  }
  
  /* --------------------------- DELETE ---------------------------- */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.ordenCompraService.delete(id);
  }
}
