import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';

import { VentaService } from '../services/venta.service';
import { CreateVentaDto } from '../dto/venta/create-venta.dto';
import { UpdateVentaDto } from '../dto/venta/update-venta.dto';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { GetVentaDto } from '../dto/venta/get-venta.dto';

@Controller('ventas')
@ApiExtraModels(GetVentaDto)
export class VentaController {
  /* -------------------- Inyección de Servicio -------------------- */
  constructor(private readonly service: VentaService) {}

  /* --------------------------- CREATE ---------------------------- */
  @Post()
  create(@Body() dto: CreateVentaDto) {
    return this.service.create(dto);
  }

  /* --------------------------- UPDATE ---------------------------- */
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVentaDto) {
    return this.service.update(id, dto);
  }

  /* ---------------------------- READ ----------------------------- */

  // Devuelve la lista de todas las ventas
  @Get()
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(GetVentaDto) } },
  })
  findAll() {
    return this.service.findAll();
  }

  // Devuelve una venta específica por ID
  @Get(':id')
  @ApiOkResponse({
    schema: { $ref: getSchemaPath(GetVentaDto) },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /* --------------------------- DELETE ---------------------------- */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
