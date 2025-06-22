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
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { GetArticuloProveedorDto } from '../dto/articuloproveedor/get-artprovedor.dto';
import { GetProveedorDto } from '../dto/proveedor/get-proveedor.dto';

@Controller('articulos-proveedores')
@ApiExtraModels(GetArticuloProveedorDto)
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
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(GetArticuloProveedorDto) },
    },
  })
  findAll() {
    return this.service.findAll();
  }

  // Devuelve los proveedores asociados a un artículo
  @Get('proveedores-por-articulo/:articuloId')
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(GetProveedorDto) } },
  })
  findProveedoresPorArticulo(
    @Param('articuloId', ParseIntPipe) articuloId: number,
  ) {
    return this.service.findProveedoresByArticulo(articuloId);
  }

  // Devuelve todas las relaciones de un artículo (con proveedores)
  @Get('por-articulo/:articuloId')
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(GetArticuloProveedorDto) },
    },
  })
  findRelacionesPorArticulo(
    @Param('articuloId', ParseIntPipe) articuloId: number,
  ) {
    return this.service.findRelacionesByArticulo(articuloId);
  }

  // Devuelve todas las relaciones de un proveedor (con artículos)
  @Get('por-proveedor/:proveedorId')
  @ApiOkResponse({
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(GetArticuloProveedorDto) },
    },
  })
  findRelacionesPorProveedor(
    @Param('proveedorId', ParseIntPipe) proveedorId: number,
  ) {
    return this.service.findRelacionesByProveedor(proveedorId);
  }
}
