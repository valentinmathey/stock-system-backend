// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';

// ENTITY ------------------------------------------------------------
import { Articulo } from '../entities/articulo.entity';

// DTOs --------------------------------------------------------------
import { CreateArticuloDto } from '../dto/articulo/create-articulo.dto';
import { UpdateArticuloDto } from '../dto/articulo/update-articulo.dto';
import { Proveedor } from '../entities/proveedor.entity';
import { InventarioService } from 'src/inventario/services/inventario.service';
import { DetalleOrdenCompra } from 'src/orden-compra/entities/detalle-orden-compra.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';
import { EstadoOrdenCompra } from 'src/orden-compra/entities/estado-orden-compra.entity';

@Injectable()
export class ArticuloService {
  /* Repositorio ----------------------------------------- */
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

  /* ---------------------------- CREATE --------------------------- */
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

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.articuloRepo.find({
      relations: ['proveedorPredeterminado'],
      where: { fechaBajaArticulo: IsNull() },
      order: {
        id: 'ASC',
      },
    });
  }

  /* ---------------------------- READ by ID ------------------------ */
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

  /* ---------------------------- UPDATE --------------------------- */
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

    // Asignamos los datos del cuerpo
    Object.assign(art, data);

    // Si se envía un proveedor predeterminado, validamos que exista y esté activo
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

      // Asignamos el proveedor predeterminado
      art.proveedorPredeterminado = proveedor;

      // Calculamos los datos del inventario automáticamente
      await this.inventarioService.calcularYAsignarDatosInventario(art);
    }

    return this.articuloRepo.save(art);
  }

  /* ---------- Extra: proveedores asociados al artículo ----------- */
  async getProviders(id: number) {
    const art = await this.articuloRepo.findOne({
      where: { id },
      relations: ['articulosProveedor', 'articulosProveedor.proveedor'],
    });
    return art?.articulosProveedor.map((ap) => ap.proveedor) || [];
  }

  /* ---------- Extra: artículos con stock por debajo de seguridad - */
  getStockBajo() {
    return this.articuloRepo
      .createQueryBuilder('articulo')
      .where('articulo.stockActual <= articulo.stockSeguridad')
      .orderBy('articulo.stockActual', 'ASC')
      .addOrderBy('articulo.nombreArticulo', 'ASC')
      .getMany();
  }

  /* ---------- Extra: artículos que alcanzaron el punto de pedido y NO tienen OC pendientes --- */
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

  /* --------------------- TOP N por stock --------------------- */
  async getTopStock(limit = 10) {
    return this.articuloRepo
      .createQueryBuilder('articulo')
      .leftJoinAndSelect('articulo.proveedorPredeterminado', 'prov')
      .orderBy('articulo.stockActual', 'DESC')
      .limit(limit)
      .getMany();
  }

  /* --------------------------- DELETE ---------------------------- */
  /** Baja lógica del artículo con validaciones de stock y OC (todo). */
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

    const estadosPendientes = ['PENDIENTE', 'ENVIADA'];
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
