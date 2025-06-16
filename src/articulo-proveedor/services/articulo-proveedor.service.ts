// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

// ENTITY ------------------------------------------------------------
import { ArticuloProveedor, ModeloInventario } from '../entities/articulo-proveedor.entity';

// DTOs --------------------------------------------------------------
import { CreateArticuloProveedorDto } from '../dto/articuloproveedor/create-articulo-proveedor.dto';
import { UpdateArticuloProveedorDto } from '../dto/articuloproveedor/update-articulo-proveedor.dto';
import { Articulo } from '../entities/articulo.entity';

@Injectable()
export class ArticuloProveedorService {
  /* Repositorio ---------------------------------------------------- */
  constructor(
    @InjectRepository(ArticuloProveedor)
    private readonly repo: Repository<ArticuloProveedor>,
  ) {}

  /* ---------------------------- CREATE --------------------------- */
  async create(data: CreateArticuloProveedorDto, manager?: EntityManager) {
    // Usamos el repositorio transaccional si se pasó un manager, o el repositorio por defecto
    const repo = manager ? manager.getRepository(ArticuloProveedor) : this.repo;

    // Verificamos que no exista ya la relación artículo ↔ proveedor
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

    // Creamos la instancia con referencias por ID
    const nuevo = repo.create({
      ...data,
      articulo: { id: data.articuloId },
      proveedor: { id: data.proveedorId },
    });

    // Calculamos la próxima fecha
    if (
      !nuevo.proximaFechaRevision &&
      nuevo.tiempoRevision !== null &&
      nuevo.tiempoRevision !== undefined
    ) {
      const hoy = new Date();
      hoy.setDate(hoy.getDate() + nuevo.tiempoRevision);
      nuevo.proximaFechaRevision = hoy;
    }

    // Guardamos la entidad
    const guardado = await repo.save(nuevo);

    // Retornamos la entidad guardada con relaciones cargadas
    return repo.find({
      where: { id: guardado.id },
      relations: ['proveedor', 'articulo'],
    });
  }

  /* ---------------------------- CREATE ARTICULO-PROVEEDOR --------------------------- */
  async createDesdeFormulario(data: CreateArticuloProveedorDto) {
    // relación existente?
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

    // Si es LOTE_FIJO, ignoramos tiempoRevision y proximaFechaRevision
    if (data.modeloInventario === ModeloInventario.LOTE_FIJO) {
      data.tiempoRevision = undefined;
      data.proximaFechaRevision = undefined;
    }

    const nuevo = this.repo.create({
      ...data,
      articulo: { id: data.articuloId },
      proveedor: { id: data.proveedorId },
    });

    // calcular proximaFechaRevision solo para TIEMPO_FIJO
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

  /* ---------------------------- UPDATE --------------------------- */
  async update(id: number, data: UpdateArticuloProveedorDto) {
    const ap = await this.repo.findOneBy({ id });
    if (!ap) {
      throw new HttpException(
        `Relación id ${id} no existe`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Si se cambia (o mantiene) LOTE_FIJO, quitamos tiempoRevision
    if (data.modeloInventario === ModeloInventario.LOTE_FIJO) {
      data.tiempoRevision = undefined;
      data.proximaFechaRevision = undefined;
    }

    // Si es TIEMPO_FIJO y mandan tiempoRevision, recalculamos proximaFechaRevision
    if (
      data.modeloInventario === ModeloInventario.TIEMPO_FIJO &&
      data.tiempoRevision !== undefined
    ) {
      const hoy = new Date();
      hoy.setDate(hoy.getDate() + data.tiempoRevision);
      data.proximaFechaRevision = hoy;
    }

    await this.repo.update(id, data);
    return this.repo.findOne({
      where: { id },
      relations: ['articulo', 'proveedor'],
    });
  }

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.repo.find({ relations: ['articulo', 'proveedor'] });
  }

  /* --------------------- READ: proveedores por artículo -------------------- */
  async findProveedoresByArticulo(articuloId: number) {
    const relaciones = await this.repo.find({
      where: { articulo: { id: articuloId } },
      relations: ['proveedor'],
      select: {
        proveedor: {
          id: true,
          nombreProveedor: true,
        },
      },
    });

    // Mapeamos para devolver únicamente los datos del proveedor
    return relaciones.map((r) => r.proveedor);
  }

  /* -------------- READ: relaciones completas por artículo ---------------- */
  async findRelacionesByArticulo(articuloId: number) {
    return this.repo.find({
      where: { articulo: { id: articuloId } },
      relations: ['proveedor'], // incluye todos los campos de proveedor
      order: { id: 'ASC' },
    });
  }
}
