// DEPENDENCIES ------------------------------------------------------
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ENTITY ------------------------------------------------------------
import { DetalleVenta } from '../entities/detalle-venta.entity';

@Injectable()
export class DetalleVentaService {
  /* Repositorio inyectado ----------------------------------------- */
  constructor(
    @InjectRepository(DetalleVenta)
    private readonly repo: Repository<DetalleVenta>,
  ) {}

  /* ------------------------- CREATE ------------------------------ */
  /** Crea un detalle individual (normalmente llamado desde VentaService). */
  create(data: Partial<DetalleVenta>) {
    const detalle = this.repo.create(data);
    return this.repo.save(detalle);
  }

  /* -------------------------- READ ------------------------------- */
  /** Lista todos los detalles con sus relaciones principales. */
  findAll() {
    return this.repo.find({ relations: ['articulo', 'venta'] });
  }
}
