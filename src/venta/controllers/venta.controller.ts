// DEPENDENCIES ------------------------------------------------------
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

@Controller('ventas')
export class VentaController {
  /* DI ------------------------------------------------------------- */
  constructor(private readonly service: VentaService) {}

  /* --------------------------- CREATE ----------------------------- */
  @Post()
  create(@Body() dto: CreateVentaDto) {
    return this.service.create(dto);
  }

  /* ---------------------------- READ ------------------------------ */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /* --------------------------- UPDATE ----------------------------- */
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVentaDto) {
    return this.service.update(id, dto);
  }

  /* --------------------------- DELETE ----------------------------- */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
