// DEPENDENCIES ------------------------------------------------------
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ENTITY ------------------------------------------------------------
import { DetalleOrdenCompra } from '../entities/detalle-orden-compra.entity';

@Injectable()
export class DetalleOrdenCompraService {
  constructor(
    @InjectRepository(DetalleOrdenCompra)
    private readonly repo: Repository<DetalleOrdenCompra>,
  ) {}

  /* ------------------------- CREATE ------------------------------ */
  /**
   * Crea un detalle. Útil para seeds o pruebas unitarias; la creación
   * masiva se gestiona desde OrdenCompraService.
   */
  create(data: Partial<DetalleOrdenCompra>) {
    const detalle = this.repo.create(data);
    return this.repo.save(detalle);
  }

  /* -------------------------- READ ------------------------------- */
  /** Devuelve todos los detalles con sus relaciones básicas */
  findAll() {
    return this.repo.find({ relations: ['ordenCompra', 'articulo'] });
  }
}
