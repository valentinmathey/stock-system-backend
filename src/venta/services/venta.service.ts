// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

// ENTITIES ----------------------------------------------------------
import { Venta } from '../entities/venta.entity';
import { DetalleVenta } from '../entities/detalle-venta.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';

// DTOs --------------------------------------------------------------
import { CreateVentaDto } from '../dto/venta/create-venta.dto';
import { UpdateVentaDto } from '../dto/venta/update-venta.dto';
import { InventarioService } from 'src/inventario/services/inventario.service';
@Injectable()
export class VentaService {
  /* Repositorios inyectados --------------------------------------- */
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    private readonly dataSource: DataSource,
    private readonly inventarioService: InventarioService,
  ) {}

  /* ---------------------------- CREATE --------------------------- */
  async create(data: CreateVentaDto) {
    if (!data.detalle?.length) {
      throw new BadRequestException('Por favor enviar los artículos a vender');
    }

    const ids = data.detalle.map((d) => d.articuloId);
    const repetidos = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (repetidos.length) {
      throw new BadRequestException(
        'Hay artículos repetidos en el detalle de la venta',
      );
    }

    try {
      const venta = await this.dataSource.transaction(async (manager) => {
        const ventaRepo = manager.getRepository(Venta);
        const articuloRepo = manager.getRepository(Articulo);
        const detalleRepo = manager.getRepository(DetalleVenta);

        const venta = ventaRepo.create({
          fechaVenta: data.fechaVenta ? new Date(data.fechaVenta) : undefined,
        });

        const detalles = await Promise.all(
          data.detalle.map(async (d) => {
            const articulo = await articuloRepo.findOne({
              where: { id: d.articuloId },
            });

            if (!articulo) {
              throw new BadRequestException(
                `Artículo con ID ${d.articuloId} no existe`,
              );
            }
            if (articulo.fechaBajaArticulo) {
              throw new BadRequestException(
                `El artículo ${articulo.nombreArticulo} está dado de baja`,
              );
            }
            if (articulo.stockActual < d.cantidadArticulo) {
              throw new BadRequestException(
                `Stock insuficiente para el artículo ${articulo.nombreArticulo}`,
              );
            }

            articulo.stockActual -= d.cantidadArticulo;
            await articuloRepo.save(articulo);

            const subtotal =
              d.cantidadArticulo * articulo.precioVentaUnitarioArticulo;

            return detalleRepo.create({
              articulo,
              cantidadArticulo: d.cantidadArticulo,
              precioVentaUnitarioArticulo: articulo.precioVentaUnitarioArticulo,
              ventaSubtotal: subtotal,
            });
          }),
        );

        const detallesGuardados = await detalleRepo.save(detalles);
        venta.detallesVenta = detallesGuardados;
        venta.ventaTotal = this.getTotal(detallesGuardados);

        // Lógica de OC dentro de la transacción para rollback si falla
        await this.inventarioService.evaluarYPedirLoteFijo(
          detallesGuardados.map((detalle) => detalle.articulo),
          manager,
        );

        return await ventaRepo.save(venta);
      });

      return venta;
    } catch (error) {
      console.error('ERROR DETECTADO EN VENTA:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Hubo un error inesperado al generar la venta. Si el problema persiste, contacte con soporte',
      );
    }
  }

  private getTotal(detalles: DetalleVenta[]) {
    return detalles.reduce((prev, curr) => prev + curr.ventaSubtotal, 0);
  }

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.ventaRepository.find({
      relations: ['detallesVenta', 'detallesVenta.articulo'],
    });
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
