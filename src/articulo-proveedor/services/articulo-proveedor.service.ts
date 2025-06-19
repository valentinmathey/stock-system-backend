import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';

// =========================== ENTIDADES ============================
import {
  ArticuloProveedor,
  ModeloInventario,
} from '../entities/articulo-proveedor.entity';
import { Articulo } from '../entities/articulo.entity';

// ============================== DTOs ==============================
import { CreateArticuloProveedorDto } from '../dto/articuloproveedor/create-articulo-proveedor.dto';
import { UpdateArticuloProveedorDto } from '../dto/articuloproveedor/update-articulo-proveedor.dto';

// ========================== SERVICIOS =============================
import { InventarioService } from 'src/inventario/services/inventario.service';

@Injectable()
export class ArticuloProveedorService {
  /* ---------------------- Repositorios -------------------------- */
  constructor(
    @InjectRepository(ArticuloProveedor)
    private readonly repo: Repository<ArticuloProveedor>,

    @InjectRepository(Articulo)
    private readonly artRepo: Repository<Articulo>,

    private readonly inventarioService: InventarioService,
  ) {}

  /* ========================== CREATE ============================ */

  // Crea una nueva relación usando repositorio opcional para transacciones
  async create(data: CreateArticuloProveedorDto, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(ArticuloProveedor) : this.repo;

    const existe = await repo.findOne({
      where: {
        articulo: { id: data.articuloId },
        proveedor: { id: data.proveedorId },
      },
    });

    if (existe) {
      throw new BadRequestException(
        `Ya existe la relación Artículo(${data.articuloId}) ↔ Proveedor(${data.proveedorId})`,
      );
    }

    const nuevo = repo.create({
      ...data,
      articulo: { id: data.articuloId },
      proveedor: { id: data.proveedorId },
    });

    if (
      !nuevo.proximaFechaRevision &&
      nuevo.tiempoRevision !== null &&
      nuevo.tiempoRevision !== undefined
    ) {
      const hoy = new Date();
      hoy.setDate(hoy.getDate() + nuevo.tiempoRevision);
      nuevo.proximaFechaRevision = hoy;
    }

    const guardado = await repo.save(nuevo);

    return repo.find({
      where: { id: guardado.id },
      relations: ['proveedor', 'articulo'],
    });
  }

  // Crea relación desde formulario, lógica segun modelo de inventario)
  async createDesdeFormulario(data: CreateArticuloProveedorDto) {
    const existe = await this.repo.findOne({
      where: {
        articulo: { id: data.articuloId },
        proveedor: { id: data.proveedorId },
      },
    });

    if (existe) {
      throw new BadRequestException(
        `Ya existe una relación entre el proveedor y ese artículo.`,
      );
    }

    if (data.modeloInventario === ModeloInventario.LOTE_FIJO) {
      data.tiempoRevision = undefined;
      data.proximaFechaRevision = undefined;
    }

    const nuevo = this.repo.create({
      ...data,
      articulo: { id: data.articuloId },
      proveedor: { id: data.proveedorId },
    });

    if (
      nuevo.modeloInventario === ModeloInventario.TIEMPO_FIJO &&
      !nuevo.proximaFechaRevision &&
      nuevo.tiempoRevision
    ) {
      const hoy = new Date();
      hoy.setDate(hoy.getDate() + nuevo.tiempoRevision);
      nuevo.proximaFechaRevision = hoy;
    }

    const guardado = await this.repo.save(nuevo);

    return this.repo.findOne({
      where: { id: guardado.id },
      relations: ['articulo', 'proveedor'],
    });
  }

  /* ========================== UPDATE ============================ */

  // Actualiza una relación artículo-proveedor y recalcula inventario
  async update(id: number, data: UpdateArticuloProveedorDto) {
    const rel = await this.repo.findOne({
      where: { id },
      relations: ['articulo'],
    });

    if (!rel) {
      throw new HttpException(
        `Relación id ${id} no existe`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.modeloInventario === ModeloInventario.LOTE_FIJO) {
      data.tiempoRevision = null;
      data.proximaFechaRevision = null;
    }

    if (
      data.modeloInventario === ModeloInventario.TIEMPO_FIJO &&
      data.tiempoRevision !== undefined &&
      data.tiempoRevision !== null
    ) {
      const hoy = new Date();
      hoy.setDate(hoy.getDate() + data.tiempoRevision);
      data.proximaFechaRevision = hoy;
    }

    await this.repo.update(id, data);

    const articulo = await this.artRepo.findOne({
      where: { id: rel.articulo.id },
      relations: ['proveedorPredeterminado'],
    });

    if (articulo) {
      await this.inventarioService.calcularYAsignarDatosInventario(articulo);
      await this.artRepo.save(articulo);
    }

    return this.repo.findOne({
      where: { id },
      relations: ['articulo', 'proveedor'],
    });
  }

  /* =========================== READ ============================= */

  // Devuelve todas las relaciones con proveedor y artículo
  findAll() {
    return this.repo.find({ relations: ['articulo', 'proveedor'] });
  }

  // Devuelve los proveedores activos de un artículo
  async findProveedoresByArticulo(articuloId: number) {
    const relaciones = await this.repo.find({
      where: {
        articulo: { id: articuloId },
        proveedor: { fechaBajaProveedor: IsNull() },
      },
      relations: ['proveedor'],
      select: {
        proveedor: {
          id: true,
          nombreProveedor: true,
        },
      },
    });

    return relaciones.map((r) => r.proveedor);
  }

  // Devuelve relaciones completas activas de un artículo
  async findRelacionesByArticulo(articuloId: number) {
    return this.repo.find({
      where: {
        articulo: { id: articuloId },
        proveedor: { fechaBajaProveedor: IsNull() },
      },
      relations: ['proveedor'],
      order: { id: 'ASC' },
    });
  }

  // Devuelve relaciones activas de un proveedor
  async findRelacionesByProveedor(proveedorId: number) {
    return this.repo.find({
      where: {
        proveedor: { id: proveedorId, fechaBajaProveedor: IsNull() },
        articulo: { fechaBajaArticulo: IsNull() },
      },
      relations: ['articulo'],
      order: { id: 'ASC' },
    });
  }
}
