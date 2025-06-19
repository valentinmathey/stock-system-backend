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
  findProviders(@Param('id', ParseIntPipe) id: number) {
    return this.articuloService.getProviders(id);
  }

  /** Lista de artículos cuyo stock está por debajo del stock de seguridad */
  @Get('stockBajo')
  findStockBajo() {
    return this.articuloService.getStockBajo();
  }

  @Get('top-stock')
  getTopStock(@Query('limit') limit?: string) {
    return this.articuloService.getTopStock(Number(limit) || 10);
  }

  /* --------------------------- READ extra --------------------------- */
  @Get('paraReponer')
  findParaReponer() {
    return this.articuloService.getParaReponer();
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
  /* --------------------------- DELETE ----------------------------- */
  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number, 
  ) {
    return this.articuloService.remove(id);
  }
}
