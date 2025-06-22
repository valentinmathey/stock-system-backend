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
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { GetArticuloDto } from '../dto/articulo/get-articulo.dto';
import { GetProveedorDto } from '../dto/proveedor/get-proveedor.dto';

@Controller('articulos')
@ApiExtraModels(GetArticuloDto)
export class ArticuloController {
  /* -------------------- Inyección de Servicio -------------------- */
  constructor(private readonly articuloService: ArticuloService) {}

  /* --------------------------- CREATE ---------------------------- */
  @Post()
  create(@Body() dto: CreateArticuloDto) {
    return this.articuloService.create(dto);
  }

  /* --------------------------- UPDATE ---------------------------- */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateArticuloDto,
  ) {
    return this.articuloService.update(id, data);
  }

  /* ---------------------------- READ ----------------------------- */

  // Obtiene la lista completa de artículos
  @Get()
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(GetArticuloDto) } },
  })
  findAll() {
    return this.articuloService.findAll();
  }

  // Devuelve los proveedores asociados a un artículo por ID
  @Get(':id/proveedores')
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(GetProveedorDto) } },
  })
  findProviders(@Param('id', ParseIntPipe) id: number) {
    return this.articuloService.getProviders(id);
  }

  // Lista de artículos con stock por debajo del mínimo
  @Get('stockBajo')
  @ApiOkResponse({
    schema: { $ref: getSchemaPath(GetArticuloDto) },
  })
  findStockBajo() {
    return this.articuloService.getStockBajo();
  }

  // Devuelve los artículos con mayor stock, limitado por query param
  @Get('top-stock')
  @ApiOkResponse({
    schema: { $ref: getSchemaPath(GetArticuloDto) },
  })
  getTopStock(@Query('limit') limit?: string) {
    return this.articuloService.getTopStock(Number(limit) || 10);
  }

  // Devuelve artículos que cumplen condiciones para reponer stock
  @Get('paraReponer')
  @ApiOkResponse({
    schema: { $ref: getSchemaPath(GetArticuloDto) },
  })
  findParaReponer() {
    return this.articuloService.getParaReponer();
  }

  // Devuelve los artículos dados de baja
  @Get('baja')
  @ApiOkResponse({
    schema: { $ref: getSchemaPath(GetArticuloDto) },
  })
  findArticulosDadosDeBaja() {
    return this.articuloService.findBaja();
  }

  /* --------------------------- DELETE ---------------------------- */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.articuloService.remove(id);
  }
}
