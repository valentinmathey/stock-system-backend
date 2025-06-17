import {
  Controller,
  Post,
  Get,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';

import { OrdenCompraService } from '../services/orden-compra.service';
import { CreateOrdenCompraDto } from '../dto/ordencompra/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from '../dto/ordencompra/update-orden-compra.dto';

@Controller('ordenes-compra')
export class OrdenCompraController {
  constructor(private readonly ordenCompraService: OrdenCompraService) {}

  /* -------------------------- CREATE ----------------------------- */
  @Post()
  create(@Body() dto: CreateOrdenCompraDto) {
    return this.ordenCompraService.create(dto);
  }

  /* --------------------------- READ ------------------------------ */
  @Get()
  findAll() {
    return this.ordenCompraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordenCompraService.findOne(id);
  }

  /* -------------------------- UPDATE ----------------------------- */
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdenCompraDto,
  ) {
    return this.ordenCompraService.update(id, dto);
  }

  /* -------------------------- DELETE ----------------------------- */
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.ordenCompraService.delete(id);
  }
  @Patch(':id/finalizar')
  finalizar(@Param('id', ParseIntPipe) id: number) {
    return this.ordenCompraService.finalizar(id);
  }
  @Patch(':id/confirmar')
  confirmar(@Param('id', ParseIntPipe) id: number) {
  return this.ordenCompraService.confirmar(id);
}

}
