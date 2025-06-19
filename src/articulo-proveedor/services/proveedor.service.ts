// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';

// ENTITIES ----------------------------------------------------------
import { Proveedor } from '../entities/proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';

// DTOs --------------------------------------------------------------
import { CreateProveedorDto } from '../dto/proveedor/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/proveedor/update-proveedor.dto';
import { ArticuloProveedorService } from './articulo-proveedor.service';
import { Articulo } from '../entities/articulo.entity';

@Injectable()
export class ProveedorService {
  constructor(
    @InjectRepository(Proveedor)
    private proveedorRepository: Repository<Proveedor>,

    @InjectRepository(OrdenCompra)
    private ordenCompraRepository: Repository<OrdenCompra>,

    @InjectRepository(Articulo)                        // ← nuevo
    private articuloRepository: Repository<Articulo>, // ← nuevo

    private readonly dataSource: DataSource,
    private readonly articuloProveedorService: ArticuloProveedorService,
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

    return await this.dataSource.transaction(async (manager) => {
      // Crear proveedor
      const nuevoProveedor = this.proveedorRepository.create({
        codigoProveedor: data.codigoProveedor,
        nombreProveedor: data.nombreProveedor,
      });

      const proveedorGuardado = await manager
        .getRepository(Proveedor)
        .save(nuevoProveedor);

      // Crear relación artículo-proveedor usando el servicio reutilizable
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
        manager, // Se le pasás el manager
      );

      return proveedorGuardado;
    });
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
  return this.proveedorRepository.find({
    where: { fechaBajaProveedor: IsNull() },
    order: { id: 'ASC' },
  });
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
    if (!prov) throw new NotFoundException(`Proveedor con id ${id} no existe`);

    // 1) ódenes activas
    const ocActiva = await this.ordenCompraRepository.findOne({
      where: {
        proveedor: { id },
        estado: {
          nombreEstadoOrdenCompra: Not(In(['Finalizada', 'Cancelada'])),
        },
      },
      relations: ['estado'],
    });
    if (ocActiva) {
      throw new BadRequestException(
        'No se puede dar de baja: el proveedor tiene una orden de compra activa.',
      );
    }

    // 2) ser predeterminado en artículos
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

    // 3) marcar baja
    prov.fechaBajaProveedor = new Date();
    return this.proveedorRepository.save(prov);
  }
}

