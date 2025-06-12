import {
  Controller,
  Post,
  Get,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';

import { OrdenCompraService } from '../services/orden-compra.service';
import { CreateOrdenCompraDto } from '../dto/ordencompra/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from '../dto/ordencompra/update-orden-compra.dto';

@Controller('ordenes-compra')
export class OrdenCompraController {
  /* DI --------------------------- */
  constructor(private readonly service: OrdenCompraService) {}

  /* -------------------------- CREATE ----------------------------- */
  @Post()
  create(@Body() dto: CreateOrdenCompraDto) {
    return this.service.create(dto);
  }

  /* --------------------------- READ ------------------------------ */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /* -------------------------- UPDATE ----------------------------- */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdenCompraDto,
  ) {
    return this.service.update(id, dto);
  }

  /* -------------------------- DELETE ----------------------------- */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
