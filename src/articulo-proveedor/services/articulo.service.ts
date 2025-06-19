import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';

// =========================== ENTIDADES ============================
import { Articulo } from '../entities/articulo.entity';
import { Proveedor } from '../entities/proveedor.entity';
import { DetalleOrdenCompra } from 'src/orden-compra/entities/detalle-orden-compra.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';
import { EstadoOrdenCompra } from 'src/orden-compra/entities/estado-orden-compra.entity';

// ============================== DTOs ==============================
import { CreateArticuloDto } from '../dto/articulo/create-articulo.dto';
import { UpdateArticuloDto } from '../dto/articulo/update-articulo.dto';

// ========================== SERVICIOS =============================
import { InventarioService } from 'src/inventario/services/inventario.service';

// =========================== SERVICE ==============================
@Injectable()
export class ArticuloService {
  /* ---------------------- Repositorios -------------------------- */
  constructor(
    @InjectRepository(Articulo)
    private readonly articuloRepo: Repository<Articulo>,

    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,

    @InjectRepository(OrdenCompra)
    private readonly ocRepo: Repository<OrdenCompra>,

    @InjectRepository(DetalleOrdenCompra)
    private readonly detOCRepo: Repository<DetalleOrdenCompra>,

    private readonly inventarioService: InventarioService,
  ) {}

  /* ========================== CREATE ============================ */

  // Crea un nuevo artículo, validando código y proveedor predeterminado
  async create(data: CreateArticuloDto) {
    const existe = await this.articuloRepo.findOneBy({
      codigoArticulo: data.codigoArticulo,
    });

    if (existe) {
      throw new BadRequestException(
        `Artículo con código ${data.codigoArticulo} ya existe`,
      );
    }

    const nuevo = this.articuloRepo.create(data);

    if (data.proveedorPredeterminadoId) {
      const proveedor = await this.proveedorRepo.findOne({
        where: {
          id: data.proveedorPredeterminadoId,
          fechaBajaProveedor: IsNull(),
        },
      });

      if (!proveedor) {
        throw new BadRequestException(
          `Proveedor con id ${data.proveedorPredeterminadoId} no existe o está dado de baja`,
        );
      }

      nuevo.proveedorPredeterminado = proveedor;
    }

    return this.articuloRepo.save(nuevo);
  }

  /* ========================== UPDATE ============================ */

  // Actualiza un artículo por ID, recalculando inventario si se cambia proveedor
  async update(id: number, data: UpdateArticuloDto) {
    const art = await this.articuloRepo.findOne({
      where: { id },
      relations: ['proveedorPredeterminado'],
    });

    if (!art) {
      throw new HttpException(
        `Artículo con id ${id} no existe`,
        HttpStatus.BAD_REQUEST,
      );
    }

    Object.assign(art, data);

    if (data.proveedorPredeterminadoId !== undefined) {
      const proveedor = await this.proveedorRepo.findOne({
        where: {
          id: data.proveedorPredeterminadoId,
          fechaBajaProveedor: IsNull(),
        },
      });

      if (!proveedor) {
        throw new HttpException(
          `Proveedor con id ${data.proveedorPredeterminadoId} no existe o está dado de baja`,
          HttpStatus.BAD_REQUEST,
        );
      }

      art.proveedorPredeterminado = proveedor;

      await this.inventarioService.calcularYAsignarDatosInventario(art);
    }

    return this.articuloRepo.save(art);
  }

  /* =========================== READ ============================= */

  // Devuelve todos los artículos activos
  findAll() {
    return this.articuloRepo.find({
      relations: ['proveedorPredeterminado'],
      where: { fechaBajaArticulo: IsNull() },
      order: { id: 'ASC' },
    });
  }

  // Devuelve un artículo específico por ID si está activo
  async findOne(id: number) {
    const art = await this.articuloRepo.findOne({
      where: { id, fechaBajaArticulo: IsNull() },
      relations: ['proveedorPredeterminado'],
    });

    if (!art) {
      throw new HttpException(
        `Artículo con id ${id} no existe o fue dado de baja`,
        HttpStatus.NOT_FOUND,
      );
    }

    return art;
  }

  // Devuelve los proveedores asociados a un artículo
  async getProviders(id: number) {
    const art = await this.articuloRepo.findOne({
      where: { id },
      relations: ['articulosProveedor', 'articulosProveedor.proveedor'],
    });

    return art?.articulosProveedor.map((ap) => ap.proveedor) || [];
  }

  // Devuelve artículos con stock actual menor o igual al stock de seguridad
  getStockBajo() {
    return this.articuloRepo
      .createQueryBuilder('articulo')
      .where('articulo.stockActual <= articulo.stockSeguridad')
      .orderBy('articulo.stockActual', 'ASC')
      .addOrderBy('articulo.nombreArticulo', 'ASC')
      .getMany();
  }

  // Devuelve artículos que deben reponerse y no tienen OC pendientes
  async getParaReponer() {
    const estadosPendientes = ['PENDIENTE', 'ENVIADA'];

    return this.articuloRepo
      .createQueryBuilder('a')
      .leftJoin(DetalleOrdenCompra, 'd', 'd.articuloId = a.id')
      .leftJoin(OrdenCompra, 'oc', 'oc.id = d.ordenCompraId')
      .leftJoin(EstadoOrdenCompra, 'e', 'e.id = oc.estadoId')
      .where('a.stockActual <= a.puntoPedido')
      .andWhere(
        new Brackets((qb) =>
          qb
            .where('oc.id IS NULL')
            .orWhere('e.codigoEstadoOrdenCompra NOT IN (:...pend)', {
              pend: estadosPendientes,
            }),
        ),
      )
      .getMany();
  }

  // Devuelve los N artículos con más stock
  async getTopStock(limit = 10) {
    return this.articuloRepo
      .createQueryBuilder('articulo')
      .leftJoinAndSelect('articulo.proveedorPredeterminado', 'prov')
      .orderBy('articulo.stockActual', 'DESC')
      .limit(limit)
      .getMany();
  }

  /* =========================== DELETE =========================== */

  // Baja lógica del artículo con validaciones de stock y OC pendientes
  async remove(id: number) {
    const art = await this.articuloRepo.findOneBy({ id });

    if (!art) {
      throw new HttpException(
        `Artículo con id ${id} no existe`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (art.stockActual > 0) {
      throw new HttpException(
        `El artículo aún tiene stock`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const estadosPendientes = ['PENDIENTE', 'CONFIRMADA'];
    const ocCount = await this.detOCRepo
      .createQueryBuilder('d')
      .innerJoin('d.ordenCompra', 'oc')
      .innerJoin('oc.estado', 'e')
      .where('d.articuloId = :id', { id })
      .andWhere('e.codigoEstadoOrdenCompra IN (:...estados)', {
        estados: estadosPendientes,
      })
      .getCount();

    if (art.stockActual > 0) {
      throw new BadRequestException(
        'No se puede dar de baja: el artículo tiene unidades en stock',
      );
    }

    if (ocCount > 0) {
      throw new BadRequestException(
        'No se puede dar de baja: existen órdenes de compra pendientes o enviadas',
      );
    }

    await this.articuloRepo.update(id, { fechaBajaArticulo: new Date() });
  }
}
