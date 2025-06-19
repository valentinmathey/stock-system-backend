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
  /* -------------------- Inyección de Servicio -------------------- */
  constructor(private readonly service: ArticuloProveedorService) {}

  /* -------------------------- CREATE ----------------------------- */
  @Post()
  create(@Body() data: CreateArticuloProveedorDto) {
    return this.service.createDesdeFormulario(data);
  }

  /* -------------------------- UPDATE ----------------------------- */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() data: UpdateArticuloProveedorDto,
  ) {
    return this.service.update(id, data);
  }

  /* ---------------------------- READ ----------------------------- */
  
  // Obtiene todas las relaciones artículo-proveedor
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // Devuelve los proveedores asociados a un artículo
  @Get('proveedores-por-articulo/:articuloId')
  findProveedoresPorArticulo(
    @Param('articuloId', ParseIntPipe) articuloId: number,
  ) {
    return this.service.findProveedoresByArticulo(articuloId);
  }

  // Devuelve todas las relaciones de un artículo (con proveedores)
  @Get('por-articulo/:articuloId')
  findRelacionesPorArticulo(
    @Param('articuloId', ParseIntPipe) articuloId: number,
  ) {
    return this.service.findRelacionesByArticulo(articuloId);
  }

  // Devuelve todas las relaciones de un proveedor (con artículos)
  @Get('por-proveedor/:proveedorId')
  findRelacionesPorProveedor(
    @Param('proveedorId', ParseIntPipe) proveedorId: number,
  ) {
    return this.service.findRelacionesByProveedor(proveedorId);
  }
}
