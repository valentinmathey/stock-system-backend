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
import { ArticuloProveedor } from '../entities/articulo-proveedor.entity';

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
    // Validamos que no exista la relación ya
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

    const nuevo = this.repo.create({
      ...data,
      articulo: { id: data.articuloId },
      proveedor: { id: data.proveedorId },
    });

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

    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.repo.find({ relations: ['articulo', 'proveedor'] });
  }
}
