// DEPENDENCIES ------------------------------------------------------
import {
  Controller,
  Post,
  Get,
  Body,
  Put,
  Query,
  ParseIntPipe,
  Delete,
  Param,
} from '@nestjs/common';

import { ArticuloService } from '../services/articulo.service';
import { CreateArticuloDto } from '../dto/articulo/create-articulo.dto';
import { UpdateArticuloDto } from '../dto/articulo/update-articulo.dto';

@Controller('articulos')
export class ArticuloController {
  /* DI ------------------------------------------------------------- */
  constructor(private readonly articuloService: ArticuloService) {}

  /* ---------------------------- READ ------------------------------ */
  @Get()
  findAll() {
    return this.articuloService.findAll();
  }

  /** Devuelve los proveedores asociados a un artículo */
  @Get(':id/proveedores')
  findProviders(@Query('id', ParseIntPipe) id: number) {
    return this.articuloService.getProviders(id);
  }

  /** Lista de artículos cuyo stock está por debajo del stock de seguridad */
  @Get('stockBajo')
  findStockBajo() {
    return this.articuloService.getStockBajo();
  }

  /* --------------------------- CREATE ----------------------------- */
  @Post()
  create(@Body() dto: CreateArticuloDto) {
    return this.articuloService.create(dto);
  }

  /* --------------------------- UPDATE ----------------------------- */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateArticuloDto,
  ) {
    return this.articuloService.update(id, data);
  }

  /* --------------------------- DELETE ----------------------------- */
  @Delete(':id')
  delete(@Query('id', ParseIntPipe) id: number) {
    return this.articuloService.remove(id);
  }
}
