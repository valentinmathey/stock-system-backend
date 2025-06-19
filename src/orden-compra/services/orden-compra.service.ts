// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ENTITIES ----------------------------------------------------------
import { OrdenCompra } from '../entities/orden-compra.entity';
import { CreateOrdenCompraDto } from '../dto/ordencompra/create-orden-compra.dto';
import { UpdateOrdenCompraDto } from '../dto/ordencompra/update-orden-compra.dto';
import { DetalleOrdenCompra } from '../entities/detalle-orden-compra.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';
import { EstadoOrdenCompra } from '../entities/estado-orden-compra.entity';
import { Proveedor } from 'src/articulo-proveedor/entities/proveedor.entity';
import { ArticuloProveedor } from 'src/articulo-proveedor/entities/articulo-proveedor.entity';

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
    @InjectRepository(EstadoOrdenCompra)
    private readonly estadoRepo: Repository<EstadoOrdenCompra>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
    @InjectRepository(ArticuloProveedor)
    private readonly articuloProveedorRepo: Repository<ArticuloProveedor>,
  ) {}

  /* ---------------------------- CREATE ---------------------------- */
  async create(data: CreateOrdenCompraDto) {
    // Validar proveedor
    const proveedor = await this.proveedorRepo.findOneBy({
      id: data.proveedorId,
    });
    if (!proveedor) {
      throw new BadRequestException('Proveedor no válido');
    }

    // Validar estado inicial
    const estadoInicial = await this.estadoRepo.findOneBy({
      codigoEstadoOrdenCompra: 'PENDIENTE',
    });
    if (!estadoInicial) {
      throw new BadRequestException('Estado inicial "PENDIENTE" no encontrado');
    }

    // VALIDAR EXISTENCIA DE ORDEN PENDIENTE PARA ALGÚN ARTÍCULO
    for (const d of data.detalles) {
      const articulo = await this.articuloRepo.findOneBy({ id: d.articuloId });
      if (!articulo) {
        throw new NotFoundException(
          `Artículo con ID ${d.articuloId} no encontrado`,
        );
      }

      const ordenExistente = await this.ordenRepo
        .createQueryBuilder('orden')
        .innerJoin('orden.detallesOrden', 'detalle')
        .innerJoin('orden.estado', 'estado')
        .where('orden.proveedor = :proveedorId', { proveedorId: proveedor.id })
        .andWhere('detalle.articulo = :articuloId', { articuloId: articulo.id })
        .andWhere('estado.codigoEstadoOrdenCompra IN (:...estados)', {
          estados: ['PENDIENTE', 'CONFIRMADA'],
        })
        .getOne();

      if (ordenExistente) {
        throw new BadRequestException(
          `Ya existe una orden de compra pendiente para el artículo ${articulo.nombreArticulo} con este proveedor.`,
        );
      }
    }

    const orden = this.ordenRepo.create({
      proveedor,
      estado: estadoInicial,
      fechaOrdenCompra: new Date(data.fechaOrdenCompra),
    });

    let costoPedidoTotal = 0;
    let costoCompraTotal = 0;
    const detalles: DetalleOrdenCompra[] = [];

    for (const d of data.detalles) {
      const articulo = await this.articuloRepo.findOneBy({ id: d.articuloId });
      if (!articulo) {
        throw new NotFoundException(
          `Artículo con ID ${d.articuloId} no encontrado`,
        );
      }

      // Buscar el registro ArticuloProveedor
      const artProv = await this.articuloProveedorRepo.findOne({
        where: {
          articulo: { id: articulo.id },
          proveedor: { id: proveedor.id },
        },
      });

      if (!artProv) {
        throw new NotFoundException(
          `No existe relación Articulo-Proveedor para artículo ${articulo.nombreArticulo} y proveedor ${proveedor.nombreProveedor}`,
        );
      }

      const costoCompra = artProv.costoCompraUnitarioArticulo;
      const costoPedido = artProv.costoPedido;

      const detalle = this.detalleRepo.create({
        articulo,
        cantidadArticulo: d.cantidadArticulo,
        costoCompraUnitarioArticulo: costoCompra,
        costoPedidoSubtotal: costoPedido,
        costoCompraSubtotal: d.cantidadArticulo * costoCompra,
      });

      costoPedidoTotal += costoPedido;
      costoCompraTotal += detalle.costoCompraSubtotal;
      detalles.push(detalle);
    }

    orden.detallesOrden = detalles;
    orden.costoPedidoTotal = costoPedidoTotal;
    orden.costoCompraTotal = costoCompraTotal;
    orden.costoTotal = costoPedidoTotal + costoCompraTotal;

    return this.ordenRepo.save(orden);
  }

  /* ----------------------------- READ ALL ----------------------------- */
  findAll() {
    return this.ordenRepo.find({
      relations: [
        'proveedor',
        'estado',
        'detallesOrden',
        'detallesOrden.articulo',
      ],
      order: {
        fechaOrdenCompra: 'DESC', // opcional, para ordenar por fecha descendente
      },
    });
  }

  /* ----------------------------- READ ONE ----------------------------- */
  async findOne(id: number) {
    const orden = await this.ordenRepo.findOne({
      where: { id },
      relations: [
        'proveedor',
        'estado',
        'detallesOrden',
        'detallesOrden.articulo',
      ],
    });

    if (!orden) {
      throw new NotFoundException(`Orden de compra con ID ${id} no encontrada`);
    }

    return orden;
  }

  // ---------------------------- UPDATE ----------------------------
  async update(id: number, dto: UpdateOrdenCompraDto) {
    const oc = await this.ordenRepo.findOne({
      where: { id },
      relations: ['proveedor', 'estado', 'detallesOrden'],
    });
    if (!oc) throw new NotFoundException(`Orden con id ${id} no encontrada`);

    if (oc.estado.codigoEstadoOrdenCompra !== 'PENDIENTE') {
      throw new BadRequestException('Solo se puede modificar una OC pendiente');
    }

    /* ---------- proveedor y estado (opcionales) ---------- */
    if (dto.proveedorId) {
      const proveedor = await this.proveedorRepo.findOneBy({
        id: dto.proveedorId,
      });
      if (!proveedor) throw new BadRequestException('Proveedor no válido');
      oc.proveedor = proveedor;
    }

    if (dto.estadoId) {
      const estado = await this.estadoRepo.findOneBy({ id: dto.estadoId });
      if (!estado) throw new BadRequestException('Estado no válido');
      oc.estado = estado;
    }

    /* ---------- detalles (sólo si dto.detalles existe) --- */
    if (dto.detalles) {
      // 1) borrar los existentes
      await this.detalleRepo.delete({ ordenCompra: { id: oc.id } });

      // 2) reconstruir
      let costoPedidoTotal = 0;
      let costoCompraTotal = 0;
      const nuevosDetalles: DetalleOrdenCompra[] = [];

      for (const d of dto.detalles) {
        const articulo = await this.articuloRepo.findOneBy({
          id: d.articuloId,
        });
        if (!articulo) {
          throw new NotFoundException(`Artículo ${d.articuloId} no encontrado`);
        }

        const artProv = await this.articuloProveedorRepo.findOne({
          where: {
            articulo: { id: articulo.id },
            proveedor: { id: oc.proveedor.id },
          },
        });
        if (!artProv) {
          throw new NotFoundException(
            `Relación Artículo-Proveedor inexistente para "${articulo.nombreArticulo}"`,
          );
        }

        const costoPedido = artProv.costoPedido;
        const costoCompra = artProv.costoCompraUnitarioArticulo;

        const detalle = this.detalleRepo.create({
          articulo,
          cantidadArticulo: d.cantidadArticulo,
          costoPedidoSubtotal: costoPedido,
          costoCompraUnitarioArticulo: costoCompra,
          costoCompraSubtotal: d.cantidadArticulo * costoCompra,
        });

        costoPedidoTotal += costoPedido;
        costoCompraTotal += detalle.costoCompraSubtotal;
        nuevosDetalles.push(detalle);
      }

      oc.detallesOrden = nuevosDetalles;
      oc.costoPedidoTotal = costoPedidoTotal;
      oc.costoCompraTotal = costoCompraTotal;
      oc.costoTotal = costoPedidoTotal + costoCompraTotal;
    }

    /* ---------- fecha (opcional) ---------- */
    if (dto.fechaOrdenCompra) {
      oc.fechaOrdenCompra = new Date(dto.fechaOrdenCompra);
    }

    return this.ordenRepo.save(oc);
  }

  /* ---------------------------- DELETE ---------------------------- */
  async delete(id: number) {
    const oc = await this.ordenRepo.findOne({
      where: { id },
      relations: ['estado'],
    });
    if (!oc) {
      throw new NotFoundException(`Orden de compra con id ${id} no encontrada`);
    }
    if (oc.estado.codigoEstadoOrdenCompra !== 'PENDIENTE') {
      throw new BadRequestException(
        'Solo se puede modificar/cancelar una OC pendiente',
      );
    }

    oc.fechaBajaOrdenCompra = new Date();
    return this.ordenRepo.save(oc);
  }

  public async getOrdenesDeCompraPendientesOEnviadas(articulo: Articulo) {
    const ordenCompraPendiente = await this.estadoRepo.findOne({
      where: { nombreEstadoOrdenCompra: 'PENDIENTE' },
    });
    if (!ordenCompraPendiente) throw new InternalServerErrorException();

    const oc = await this.ordenRepo
      .createQueryBuilder()
      .innerJoin('orden.estado', 'estado')
      .innerJoin('orden.detallesOrden', 'detalle')
      .innerJoin('detalle.articulo', 'articulo')
      .where('estado.id = :estadoId', { estadoId: ordenCompraPendiente.id })
      .andWhere('estado.codigoEstadoOrdenCompra IN (:...estados)', {
        estados: ['PENDIENTE', 'FINALIZADA'],
      })
      .andWhere('articulo.id = :articuloId', { articuloId: articulo.id })
      .getMany();
    return oc;
  }

  public async getCantidadPendiente(articulo: Articulo) {
    const ordenesPendientes =
      await this.getOrdenesDeCompraPendientesOEnviadas(articulo);
    const articulosPendientes = ordenesPendientes.reduce((prev, curr) => {
      const detalleArticulo = curr.detallesOrden.find(
        (detalle) => (detalle.articulo.id = articulo.id),
      );
      if (!detalleArticulo) {
        return prev;
      }
      return prev + detalleArticulo.cantidadArticulo;
    }, 0);
    return articulosPendientes;
  }
  // ---------------------------- CONFIRMACIÓN (Estado PENDIENTE) ----------------------------
  async confirmar(id: number) {
    const oc = await this.ordenRepo.findOne({
      where: { id },
      relations: ['estado'],
    });

    if (!oc || oc.estado.codigoEstadoOrdenCompra !== 'PENDIENTE') {
      throw new BadRequestException('Solo se puede confirmar una OC pendiente');
    }

    const estadoConfirmada = await this.estadoRepo.findOneBy({
      codigoEstadoOrdenCompra: 'CONFIRMADA',
    });

    if (!estadoConfirmada) {
      throw new Error('Estado CONFIRMADA no encontrado');
    }

    oc.estado = estadoConfirmada;
    return this.ordenRepo.save(oc);
  }

  // ---------------------------- RECEPCIÓN (Estado ENVIADO) ----------------------------
  async finalizar(id: number) {
    const oc = await this.ordenRepo.findOne({
      where: { id },
      relations: ['estado', 'detallesOrden', 'detallesOrden.articulo'],
    });

    if (!oc) {
      throw new NotFoundException(`Orden de compra con id ${id} no encontrada`);
    }

    if (oc.estado.codigoEstadoOrdenCompra !== 'CONFIRMADA') {
      throw new BadRequestException(
        'Solo se puede recibir una orden confirmada',
      );
    }

    const estadoFinalizada = await this.estadoRepo.findOneBy({
      codigoEstadoOrdenCompra: 'FINALIZADA',
    });

    if (!estadoFinalizada) {
      throw new InternalServerErrorException('Estado FINALIZADA no encontrado');
    }

    // Actualizar stock
    for (const detalle of oc.detallesOrden) {
      const articulo = await this.articuloRepo.findOneBy({
        id: detalle.articulo.id,
      });
      if (articulo) {
        articulo.stockActual += detalle.cantidadArticulo;
        await this.articuloRepo.save(articulo);
      }
    }

    // Cambiar estado
    oc.estado = estadoFinalizada;
    return this.ordenRepo.save(oc);
  }
}
