// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ENTITIES ----------------------------------------------------------
import { OrdenCompra } from '../entities/orden-compra.entity';
import {
  CreateOrdenCompraDto,
  CreateDetalleOrdenCompraDto,
} from '../dto/ordencompra/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from '../dto/ordencompra/update-orden-compra.dto';
import { DetalleOrdenCompra } from '../entities/detalle-orden-compra.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';

@Injectable()
export class OrdenCompraService {
  /* Repositorios inyectados ---------------------------------------- */
  constructor(
    @InjectRepository(OrdenCompra)
    private readonly ordenRepo: Repository<OrdenCompra>,

    @InjectRepository(DetalleOrdenCompra)
    private readonly detalleRepo: Repository<DetalleOrdenCompra>,

    @InjectRepository(Articulo)
    private readonly articuloRepo: Repository<Articulo>,
  ) {}

  /* ---------------------------- CREATE ---------------------------- */
  async create(data: CreateOrdenCompraDto) {
    if (!data.detalles?.length) {
      throw new BadRequestException('Debes incluir al menos un detalle');
    }

    /* 1️⃣  Persistir cabecera sin detalles */
    const oc = this.ordenRepo.create({
      codigoOrdenCompra: data.codigoOrdenCompra,
      fechaOrdenCompra: new Date(data.fechaOrdenCompra),
      costoPedidoTotal: data.costoPedidoTotal,
      costoCompraTotal: data.costoCompraTotal,
      costoTotal: data.costoTotal,
      proveedor: { id: data.proveedorId },
      estado: { id: data.estadoId },
    });
    const savedOC = await this.ordenRepo.save(oc);

    /* 2️⃣  Construir cada detalle validando existencia de artículo */
    const detalles: DetalleOrdenCompra[] = [];

    for (const d of data.detalles) {
      const articulo = await this.articuloRepo.findOneBy({ id: d.articuloId });
      if (!articulo) {
        throw new BadRequestException(
          `Artículo con ID ${d.articuloId} no existe`,
        );
      }

      detalles.push(
        this.detalleRepo.create({
          ordenCompra: savedOC,
          articulo,
          cantidadArticulo: d.cantidadArticulo,
          costoCompraUnitarioArticulo: d.costoCompraUnitarioArticulo,
          costoPedidoSubtotal: d.costoPedidoSubtotal,
          costoCompraSubtotal: d.costoCompraSubtotal,
        }),
      );
    }

    /* 3️⃣  Guardar detalles en bloque y devolver OC completa */
    await this.detalleRepo.save(detalles);
    return this.findOne(savedOC.id);
  }

  /* ----------------------------- READ ----------------------------- */
  findAll() {
    return this.ordenRepo.find({
      relations: [
        'proveedor',
        'estado',
        'detallesOrden',
        'detallesOrden.articulo',
      ],
    });
  }

  async findOne(id: number) {
    const oc = await this.ordenRepo.findOne({
      where: { id },
      relations: [
        'proveedor',
        'estado',
        'detallesOrden',
        'detallesOrden.articulo',
      ],
    });
    if (!oc) {
      throw new NotFoundException(`Orden de compra con id ${id} no encontrada`);
    }
    return oc;
  }

  /* ---------------------------- UPDATE ---------------------------- */
  async update(id: number, dto: UpdateOrdenCompraDto) {
    const oc = await this.ordenRepo.findOneBy({ id });
    if (!oc) {
      throw new NotFoundException(`Orden de compra con id ${id} no encontrada`);
    }

    Object.assign(oc, dto, {
      proveedor: dto.proveedorId ? { id: dto.proveedorId } : oc.proveedor,
      estado: dto.estadoId ? { id: dto.estadoId } : oc.estado,
    });

    return this.ordenRepo.save(oc);
  }

  /* ---------------------------- DELETE ---------------------------- */
  async delete(id: number) {
    const oc = await this.ordenRepo.findOneBy({ id });
    if (!oc) {
      throw new NotFoundException(`Orden de compra con id ${id} no encontrada`);
    }
    oc.fechaBajaOrdenCompra = new Date();
    return this.ordenRepo.save(oc);
  }
}
