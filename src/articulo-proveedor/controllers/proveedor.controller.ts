// DEPENDENCIES ------------------------------------------------------
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

@Controller('proveedores')
export class ProveedorController {
  /* DI ------------------------------------------------------------- */
  constructor(private readonly proveedorService: ProveedorService) {}

  /* --------------------------- CREATE ----------------------------- */
  @Post()
  create(@Body() dto: CreateProveedorDto) {
    return this.proveedorService.create(dto);
  }

  /* ---------------------------- READ ------------------------------ */
  @Get()
  findAll() {
    return this.proveedorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.findOne(id);
  }

  /* --------------------------- UPDATE ----------------------------- */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProveedorDto,
  ) {
    return this.proveedorService.update(id, dto);
  }

  /* --------------------------- DELETE ----------------------------- */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.proveedorService.delete(id);
  }
}
