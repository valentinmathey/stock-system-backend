import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { ProveedorService } from '../services/proveedor.service';
import { CreateProveedorDto } from '../dto/proveedor/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/proveedor/update-proveedor.dto';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { GetProveedorDto } from '../dto/proveedor/get-proveedor.dto';
import { GetArticuloDto } from '../dto/articulo/get-articulo.dto';

@Controller('proveedores')
@ApiExtraModels(GetProveedorDto)
export class ProveedorController {
  /* -------------------- Inyección de Servicio -------------------- */
  constructor(private readonly proveedorService: ProveedorService) {}

  /* --------------------------- CREATE ---------------------------- */
  @Post()
  create(@Body() dto: CreateProveedorDto) {
    return this.proveedorService.create(dto);
  }

  /* --------------------------- UPDATE ---------------------------- */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProveedorDto,
  ) {
    return this.proveedorService.update(id, dto);
  }

  /* ---------------------------- READ ----------------------------- */

  // Devuelve la lista completa de proveedores
  @Get()
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(GetProveedorDto) } },
  })
  findAll() {
    return this.proveedorService.findAll();
  }

  // Devuelve los proveedores dados de baja
  @Get('baja')
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(GetProveedorDto) } },
  })
  findBaja() {
    return this.proveedorService.findDadoDeBaja();
  }

  // Devuelve un proveedor específico por ID
  @Get(':id')
  @ApiOkResponse({
    schema: { $ref: getSchemaPath(GetProveedorDto) },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.findOne(id);
  }

  // Devuelve la lista completa articulos por proveedor
  @Get(':id/articulos')
  @ApiOkResponse({
    schema: { type: 'array', items: { $ref: getSchemaPath(GetArticuloDto) } },
  })
  getArticulosDeProveedor(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.getArticulosByProveedor(id);
  }

  /* --------------------------- DELETE ---------------------------- */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.delete(id);
  }
}
