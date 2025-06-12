// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';

// ENTITIES ----------------------------------------------------------
import { Proveedor } from '../entities/proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';

// DTOs --------------------------------------------------------------
import { CreateProveedorDto } from '../dto/proveedor/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/proveedor/update-proveedor.dto';

@Injectable()
export class ProveedorService {
  /* Repositorios --------------------------------------- */
  constructor(
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,

    @InjectRepository(OrdenCompra)
    private ordenCompraRepository: Repository<OrdenCompra>,
  ) {}

  /* ---------------------------- CREATE --------------------------- */
  async create(data: CreateProveedorDto) {
    // Validar unicidad de código -----------------------------------
    const existente = await this.proveedorRepository.findOneBy({
      codigoProveedor: data.codigoProveedor,
    });

    if (existente) {
      throw new BadRequestException(
        `Ya existe un proveedor con código "${data.codigoProveedor}".`,
      );
    }

    const nuevo = this.proveedorRepository.create(data);
    return this.proveedorRepository.save(nuevo);
  }

  /* ---------------------------- UPDATE --------------------------- */
  async update(id: number, data: UpdateProveedorDto) {
    const prov = await this.proveedorRepository.findOneBy({ id });
    if (!prov) {
      throw new NotFoundException(`Proveedor con id ${id} no existe`);
    }

    await this.proveedorRepository.update(id, data);
    return this.proveedorRepository.findOneBy({ id });
  }

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.proveedorRepository.find();
  }

  async findOne(id: number) {
    const prov = await this.proveedorRepository.findOneBy({ id });
    if (!prov) {
      throw new NotFoundException(`Proveedor con id ${id} no existe`);
    }
    return prov;
  }

  /* ---------------------------- DELETE --------------------------- */
  /** Baja lógica: valida que no haya OC activas ni sea predeterminado. */
  async delete(id: number) {
    const prov = await this.proveedorRepository.findOne({
      where: { id },
      relations: ['articulosProveedor'],
    });
    if (!prov) {
      throw new NotFoundException(`Proveedor con id ${id} no existe`);
    }

    // Verificar OC pendientes / enviadas ---------------------------
    const ocActiva = await this.ordenCompraRepository.findOne({
      where: {
        proveedor: { id },
        estado: { nombreEstadoOrdenCompra: Not(In(['Finalizada', 'Cancelada'])) },
      },
      relations: ['estado', 'proveedor'],
    });
    if (ocActiva) {
      throw new BadRequestException(
        'No se puede dar de baja: el proveedor tiene una orden de compra activa.',
      );
    }

    prov.fechaBajaProveedor = new Date();
    return this.proveedorRepository.save(prov);
  }
}
