// DEPENDENCIES ------------------------------------------------------
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Query,
  ParseIntPipe,
  Param,
} from '@nestjs/common';

import { ArticuloProveedorService } from '../services/articulo-proveedor.service';
import { CreateArticuloProveedorDto } from '../dto/articuloproveedor/create-articulo-proveedor.dto';
import { UpdateArticuloProveedorDto } from '../dto/articuloproveedor/update-articulo-proveedor.dto';

@Controller('articulos-proveedores')
export class ArticuloProveedorController {
  /* DI ------------------------------------------------------------- */
  constructor(private readonly service: ArticuloProveedorService) {}

  /* -------------------------- CREATE ----------------------------- */
  @Post()
  create(@Body() data: CreateArticuloProveedorDto) {
    return this.service.createDesdeFormulario(data);
  }

  /* -------------------------- UPDATE ----------------------------- */
  @Put(':id')
  update(
    @Query('id', ParseIntPipe) id: number,
    @Body() data: UpdateArticuloProveedorDto,
  ) {
    return this.service.update(id, data);
  }

  /* --------------------------- READ ------------------------------ */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /* ----------- READ: proveedores válidos para un artículo ---------------- */
  @Get('proveedores-por-articulo/:articuloId')
  findProveedoresPorArticulo(
    @Param('articuloId', ParseIntPipe) articuloId: number,
  ) {
    return this.service.findProveedoresByArticulo(articuloId);
  }

  @Get('por-articulo/:articuloId') // ← nuevo endpoint para el modal
  findRelacionesPorArticulo(
    @Param('articuloId', ParseIntPipe) articuloId: number,
  ) {
    return this.service.findRelacionesByArticulo(articuloId);
  }
}
