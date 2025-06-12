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
import { Articulo } from '../entities/articulo.entity';

// DTOs --------------------------------------------------------------
import { CreateArticuloDto } from '../dto/articulo/create-articulo.dto';
import { UpdateArticuloDto } from '../dto/articulo/update-articulo.dto';

@Injectable()
export class ArticuloService {
  /* Repositorio inyectado ----------------------------------------- */
  constructor(
    @InjectRepository(Articulo)
    private readonly articuloRepo: Repository<Articulo>,
  ) {}

  /* ---------------------------- CREATE --------------------------- */
  async create(data: CreateArticuloDto) {
    // Verificar unicidad de código ---------------------------------
    const existe = await this.articuloRepo.findOneBy({
      codigoArticulo: data.codigoArticulo,
    });
    if (existe) {
      throw new BadRequestException(
        `Articulo con código ${data.codigoArticulo} ya existe`,
      );
    }

    const nuevo = this.articuloRepo.create(data);
    return this.articuloRepo.save(nuevo);
  }

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.articuloRepo.find({
      relations: ['proveedorPredeterminado'],
    });
  }

  /* ---------------------------- UPDATE --------------------------- */
  async update(id: number, data: UpdateArticuloDto) {
    const art = await this.articuloRepo.findOneBy({ id });
    if (!art) {
      throw new HttpException(`Artículo con id ${id} no existe`, HttpStatus.BAD_REQUEST);
    }

    await this.articuloRepo.update(id, data);
    return this.articuloRepo.findOneBy({ id });
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
      .getMany();
  }

  /* --------------------------- DELETE ---------------------------- */
  /** Baja lógica del artículo con validaciones de stock y OC (todo). */
  async remove(id: number) {
    const art = await this.articuloRepo.findOneBy({ id });
    if (!art) {
      throw new HttpException(`Artículo con id ${id} no existe`, HttpStatus.BAD_REQUEST);
    }
    if (art.stockActual > 0) {
      throw new HttpException(`El artículo aún tiene stock`, HttpStatus.BAD_REQUEST);
    }
    // TODO: validar que no existan OC pendientes/enviadas relacionadas
    await this.articuloRepo.update(id, { fechaBajaArticulo: new Date() });
  }
}
