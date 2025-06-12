// DEPENDENCIES ------------------------------------------------------
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// ENTITIES ----------------------------------------------------------
import { Venta } from '../entities/venta.entity';
import { DetalleVenta } from '../entities/detalle-venta.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';

// DTOs --------------------------------------------------------------
import { CreateVentaDto } from '../dto/venta/create-venta.dto';
import { UpdateVentaDto } from '../dto/venta/update-venta.dto';

@Injectable()
export class VentaService {
  /* Repositorios inyectados --------------------------------------- */
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,

    @InjectRepository(DetalleVenta)
    private readonly ventaDetalleRepository: Repository<DetalleVenta>,

    @InjectRepository(Articulo)
    private readonly articuloRepository: Repository<Articulo>,
  ) {}

  /* ---------------------------- CREATE --------------------------- */
  async create(data: CreateVentaDto) {
    // Validación mínima ----------------------------------------------------
    if (!data.detalle?.length) {
      throw new BadRequestException('Por favor enviar los artículos a vender');
    }

    // 1️⃣  Cabecera de venta ------------------------------------------------
    const venta = this.ventaRepository.create({
      fechaVenta: data.fechaVenta ? new Date(data.fechaVenta) : undefined,
    });

    // 2️⃣  Procesar detalles y calcular total ------------------------------
    let total = 0;
    const detalles: DetalleVenta[] = [];

    for (const d of data.detalle) {
      const articulo = await this.articuloRepository.findOneBy({ id: d.articuloId });
      if (!articulo) {
        throw new BadRequestException(`Artículo con ID ${d.articuloId} no existe`);
      }

      const subtotal = d.cantidadArticulo * articulo.precioVentaUnitarioArticulo;
      total += subtotal;

      detalles.push(
        this.ventaDetalleRepository.create({
          articulo,
          cantidadArticulo: d.cantidadArticulo,
          precioVentaUnitarioArticulo: articulo.precioVentaUnitarioArticulo,
          ventaSubtotal: subtotal,
        }),
      );
    }

    venta.detallesVenta = detalles;
    venta.ventaTotal = total;

    // 3️⃣  Persistir venta completa ----------------------------------------
    return this.ventaRepository.save(venta);
  }

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.ventaRepository.find({ relations: ['detallesVenta', 'detallesVenta.articulo'] });
  }

  async findOne(id: number) {
    const venta = await this.ventaRepository.findOne({
      where: { id },
      relations: ['detallesVenta', 'detallesVenta.articulo'],
    });
    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }
    return venta;
  }

  /* ---------------------------- UPDATE --------------------------- */
  async update(id: number, data: UpdateVentaDto) {
    const venta = await this.ventaRepository.findOneBy({ id });
    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    await this.ventaRepository.update(id, data);
    return this.ventaRepository.findOneBy({ id });
  }

  /* ---------------------------- DELETE --------------------------- */
  async delete(id: number) {
    const venta = await this.ventaRepository.findOneBy({ id });
    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    venta.fechaBajaVenta = new Date();
    return this.ventaRepository.save(venta);
  }
}
