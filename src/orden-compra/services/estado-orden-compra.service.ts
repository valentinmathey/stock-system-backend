import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoOrdenCompra } from '../entities/estado-orden-compra.entity';

@Injectable()
export class EstadoOrdenCompraService {
  constructor(
    @InjectRepository(EstadoOrdenCompra)
    private readonly repo: Repository<EstadoOrdenCompra>,
  ) {}

  create(data: Partial<EstadoOrdenCompra>) {
    const nuevo = this.repo.create(data);
    return this.repo.save(nuevo);
  }

  findAll() {
    return this.repo.find();
  }
}
