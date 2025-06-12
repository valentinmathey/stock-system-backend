// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ENTITY ------------------------------------------------------------
import { ArticuloProveedor } from '../entities/articulo-proveedor.entity';

// DTOs --------------------------------------------------------------
import { CreateArticuloProveedorDto } from '../dto/articuloproveedor/create-articulo-proveedor.dto';
import { UpdateArticuloProveedorDto } from '../dto/articuloproveedor/update-articulo-proveedor.dto';

@Injectable()
export class ArticuloProveedorService {
  /* Repositorio ---------------------------------------------------- */
  constructor(
    @InjectRepository(ArticuloProveedor)
    private readonly repo: Repository<ArticuloProveedor>,
  ) {}

  /* ---------------------------- CREATE --------------------------- */
  async create(data: CreateArticuloProveedorDto) {
    // Evitar duplicados (mismo artículo + proveedor) -----------------
    const existe = await this.repo.findOneBy({
      articulo: { id: data.articuloId },
      proveedor: { id: data.proveedorId },
    });

    if (existe) {
      throw new BadRequestException(
        `Ya existe la relación Artículo(${data.articuloId}) ↔ Proveedor(${data.proveedorId})`,
      );
    }

    // Construir entidad con referencias por id ---------------------
    const nuevo = this.repo.create({
      ...data,
      articulo: { id: data.articuloId },
      proveedor: { id: data.proveedorId },
    });

    // Guardar y devolver con relaciones pobladas -------------------
    const guardado = await this.repo.save(nuevo);
    return this.repo.find({
      where: { id: guardado.id },
      relations: ['proveedor', 'articulo'],
    });
  }

  /* ---------------------------- UPDATE --------------------------- */
  async update(id: number, data: UpdateArticuloProveedorDto) {
    const ap = await this.repo.findOneBy({ id });
    if (!ap) {
      throw new HttpException(`Relación id ${id} no existe`, HttpStatus.BAD_REQUEST);
    }

    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
  }

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.repo.find({ relations: ['articulo', 'proveedor'] });
  }
}
