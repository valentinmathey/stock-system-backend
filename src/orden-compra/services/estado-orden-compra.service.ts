import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

// =========================== ENTIDAD ==============================
import { EstadoOrdenCompra } from '../entities/estado-orden-compra.entity';

// =========================== SERVICE ==============================
@Injectable()
export class EstadoOrdenCompraService {
  constructor(
    @InjectRepository(EstadoOrdenCompra)
    private readonly repo: Repository<EstadoOrdenCompra>,
  ) {}

  /* ========================== CREATE ============================ */

  // Crea un nuevo estado de orden de compra
  create(data: Partial<EstadoOrdenCompra>) {
    const nuevo = this.repo.create(data);
    return this.repo.save(nuevo);
  }

  /* =========================== READ ============================= */

  // Devuelve todos los estados de orden de compra
  findAll() {
    return this.repo.find({
      where: { fechaBajaEstadoOrdenCompra: IsNull() },
      order: { id: 'ASC' },
    });
  }
}
