import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';

// =========================== ENTIDADES ============================
import { Proveedor } from '../entities/proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';
import { Articulo } from '../entities/articulo.entity';

// ============================== DTOs ==============================
import { CreateProveedorDto } from '../dto/proveedor/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/proveedor/update-proveedor.dto';

// ========================== SERVICIOS =============================
import { ArticuloProveedorService } from './articulo-proveedor.service';
import { ArticuloProveedor } from '../entities/articulo-proveedor.entity';

// =========================== SERVICE ==============================
@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,

    @InjectRepository(OrdenCompra)
    private ordenCompraRepository: Repository<OrdenCompra>,

    @InjectRepository(Articulo)
    private articuloRepository: Repository<Articulo>,

    @InjectRepository(ArticuloProveedor)
    private readonly articuloProveedorRepo: Repository<ArticuloProveedor>,

    private readonly dataSource: DataSource,
    private readonly articuloProveedorService: ArticuloProveedorService,
  ) {}

  /* ========================== CREATE ============================ */

  // Crea un nuevo proveedor y su relación con artículo en una transacción
  async create(data: CreateProveedorDto) {
    const existente = await this.proveedorRepository.findOneBy({
      codigoProveedor: data.codigoProveedor,
    });

    if (existente) {
      throw new BadRequestException(
        `Ya existe un proveedor con código "${data.codigoProveedor}".`,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const nuevoProveedor = this.proveedorRepository.create({
        codigoProveedor: data.codigoProveedor,
        nombreProveedor: data.nombreProveedor,
      });

      const proveedorGuardado = await manager
        .getRepository(Proveedor)
        .save(nuevoProveedor);

      await this.articuloProveedorService.create(
        {
          articuloId: data.articulo.articuloId,
          proveedorId: proveedorGuardado.id,
          modeloInventario: data.articulo.modeloInventario,
          costoPedido: data.articulo.costoPedido,
          costoCompraUnitarioArticulo:
            data.articulo.costoCompraUnitarioArticulo,
          demoraEntregaProveedor: data.articulo.demoraEntregaProveedor,
          tiempoRevision: data.articulo.tiempoRevision,
        },
        manager,
      );

      return proveedorGuardado;
    });
  }

  /* ========================== UPDATE ============================ */

  // Actualiza los datos de un proveedor existente
  async update(id: number, data: UpdateProveedorDto) {
    const prov = await this.proveedorRepository.findOneBy({ id });

    if (!prov) {
      throw new NotFoundException(`Proveedor con id ${id} no existe`);
    }

    await this.proveedorRepository.update(id, data);
    return this.proveedorRepository.findOneBy({ id });
  }

  /* =========================== READ ============================= */

  // Devuelve todos los proveedores activos
  findAll() {
    return this.proveedorRepository.find({
      where: { fechaBajaProveedor: IsNull() },
      order: { id: 'ASC' },
    });
  }

  // Devuelve un proveedor específico por ID
  async findOne(id: number) {
    const prov = await this.proveedorRepository.findOne({
      where: { id, fechaBajaProveedor: IsNull() },
    });

    if (!prov) {
      throw new NotFoundException(`Proveedor con id ${id} no existe`);
    }

    return prov;
  }

  // Devuelve la lista completa articulos por proveedor
  async getArticulosByProveedor(proveedorId: number) {
    const relaciones = await this.articuloProveedorRepo.find({
      where: { proveedor: { id: proveedorId } },
      relations: ['articulo'],
    });

    return relaciones
      .filter((r) => r.articulo.fechaBajaArticulo === null)
      .map((r) => ({
        ...r.articulo,
        modeloInventario: r.modeloInventario,
      }));
  }

  // Devuelve los proveedores dados de baja
  findDadoDeBaja() {
    return this.proveedorRepository.find({
      where: {
        fechaBajaProveedor: Not(IsNull()),
      },
      order: { id: 'ASC' },
    });
  }

  /* =========================== DELETE =========================== */

  // Baja lógica de proveedor con validaciones de OC activas y artículos
  async delete(id: number) {
    const prov = await this.proveedorRepository.findOne({
      where: { id },
      relations: ['articulosProveedor'],
    });

    if (!prov) {
      throw new NotFoundException(`Proveedor con id ${id} no existe`);
    }

    // Verifica si tiene órdenes de compra activas
    const ocActiva = await this.ordenCompraRepository.findOne({
      where: {
        proveedor: { id },
        estado: {
          codigoEstadoOrdenCompra: Not(In(['FINALIZADA', 'CANCELADA'])),
        },
      },
      relations: ['estado'],
    });

    if (ocActiva) {
      throw new BadRequestException(
        'No se puede dar de baja: el proveedor tiene una orden de compra activa.',
      );
    }

    // Verifica si es proveedor predeterminado de artículos activos
    const cntPred = await this.articuloRepository.count({
      where: {
        proveedorPredeterminado: { id },
        fechaBajaArticulo: IsNull(),
      },
    });

    if (cntPred > 0) {
      throw new BadRequestException(
        'No se puede dar de baja: el proveedor es predeterminado de uno o más artículos.',
      );
    }

    // Marca la fecha de baja
    prov.fechaBajaProveedor = new Date();
    return this.proveedorRepository.save(prov);
  }
}
