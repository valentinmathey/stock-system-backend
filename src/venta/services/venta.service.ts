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
import { CreateOrdenCompraDto } from 'src/orden-compra/dto/ordencompra/create-orden-compra.dto';
import { ArticuloProveedor } from 'src/articulo-proveedor/entities/articulo-proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';
import { OrdenCompraService } from 'src/orden-compra/services/orden-compra.service';
@Injectable()
export class VentaService {
  /* Repositorios inyectados --------------------------------------- */
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    private readonly dataSource: DataSource,

    @InjectRepository(ArticuloProveedor)
    private readonly articuloProveedorRepo: Repository<ArticuloProveedor>,

    private readonly ordenCompraService: OrdenCompraService,
  ) {}

  /* ---------------------------- CREATE --------------------------- */
  async create(data: CreateVentaDto) {
    // Validación inicial ― debe haber al menos un detalle
    if (!data.detalle?.length) {
      throw new BadRequestException('Por favor enviar los artículos a vender');
    }

    // Evitar artículos repetidos en la venta
    const ids = data.detalle.map((d) => d.articuloId);
    const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (repetidos.length) {
      throw new BadRequestException(
        'Hay artículos repetidos en el detalle de la venta',
      );
    }

    // Transacción
    return this.dataSource.transaction(async (manager) => {
      /* ── Repositorios transaccionales ─────────────────────────── */
      const ventaRepo = manager.getRepository(Venta);
      const articuloRepo = manager.getRepository(Articulo);
      const detalleRepo = manager.getRepository(DetalleVenta);
      const ocRepo = manager.getRepository(OrdenCompra);

      /* ── Cabecera de venta ────────────────────────────────────── */
      const venta = ventaRepo.create({
        fechaVenta: data.fechaVenta ? new Date(data.fechaVenta) : undefined,
      });

      let total = 0;
      const detalles: DetalleVenta[] = [];

      // Agruparemos artículos que necesitan OC → por proveedor
      type ItemOC = { articulo: Articulo; cantidad: number };
      const articulosParaOC = new Map<number, ItemOC[]>();

      /* ── Iteramos cada ítem del detalle ───────────────────────── */
      for (const d of data.detalle) {
        // Buscar artículo con sus relaciones clave
        const articulo = await articuloRepo.findOne({
          where: { id: d.articuloId },
          relations: ['proveedorPredeterminado', 'articulosProveedor'],
        });

        if (!articulo) {
          throw new BadRequestException(
            `Artículo con ID ${d.articuloId} no existe`,
          );
        }

        // No permitir venta de artículos dados de baja
        if (articulo.fechaBajaArticulo) {
          throw new BadRequestException(
            `El artículo ${articulo.nombreArticulo} está dado de baja`,
          );
        }

        // Stock suficiente
        if (articulo.stockActual < d.cantidadArticulo) {
          throw new BadRequestException(
            `Stock insuficiente para el artículo ${articulo.nombreArticulo}`,
          );
        }

        // Sub-total y acumulado
        const subtotal =
          d.cantidadArticulo * articulo.precioVentaUnitarioArticulo;
        total += subtotal;

        // Descontar stock
        articulo.stockActual -= d.cantidadArticulo;
        await articuloRepo.save(articulo);

        // Crear detalle de venta
        detalles.push(
          detalleRepo.create({
            articulo,
            cantidadArticulo: d.cantidadArticulo,
            precioVentaUnitarioArticulo: articulo.precioVentaUnitarioArticulo,
            ventaSubtotal: subtotal,
          }),
        );

        /* ── ¿Disparar Orden de Compra automática? ──────────────── */
        const artProv = await this.articuloProveedorRepo.findOne({
          where: {
            articulo: { id: articulo.id },
            proveedor: { id: articulo.proveedorPredeterminado?.id },
          },
        });

        if (
          artProv?.modeloInventario === 'LOTE_FIJO' &&
          articulo.puntoPedido !== null &&
          articulo.stockActual <= articulo.puntoPedido
        ) {
          // ¿Existe ya una OC pendiente o confirmada para este artículo?
          const existeOC = await ocRepo
            .createQueryBuilder('orden')
            .innerJoin('orden.detallesOrden', 'detalle')
            .innerJoin('orden.estado', 'estado')
            .where('detalle.articulo = :articuloId', {
              articuloId: articulo.id,
            })
            .andWhere('estado.codigoEstadoOrdenCompra IN (:...estados)', {
              estados: ['PENDIENTE', 'CONFIRMADA'],
            })
            .getOne();

          // Si no hay OC activa:
          if (!existeOC && articulo.proveedorPredeterminado) {
            if (articulo.loteOptimo === null) {
              throw new BadRequestException(
                `Artículo ${articulo.nombreArticulo} no tiene lote óptimo configurado`,
              );
            }

            const provId = articulo.proveedorPredeterminado.id;
            const arr = articulosParaOC.get(provId) ?? [];
            arr.push({ articulo, cantidad: articulo.loteOptimo });
            articulosParaOC.set(provId, arr);
          }
        }
      }

      /* ── Guardamos la venta ───────────────────────────────────── */
      venta.detallesVenta = detalles;
      venta.ventaTotal = total;
      const ventaGuardada = await ventaRepo.save(venta);

      /* ── Generamos Orden(es) de Compra necesarias ─────────────── */
      for (const [provId, items] of articulosParaOC.entries()) {
        const dto: CreateOrdenCompraDto = {
          proveedorId: provId,
          fechaOrdenCompra: new Date().toISOString().split('T')[0],
          detalles: items.map(({ articulo, cantidad }) => ({
            articuloId: articulo.id,
            cantidadArticulo: cantidad,
          })),
        };

        // Servicio externo (fuera de la transacción)
        await this.ordenCompraService.create(dto);
      }

      return ventaGuardada;
    });
  }

  private getTotal(detalles: DetalleVenta[]) {
    return detalles.reduce((prev, curr) => prev + curr.ventaSubtotal, 0);
  }

  /* ----------------------------- READ ---------------------------- */
  findAll() {
    return this.ventaRepository.find({
      relations: ['detallesVenta', 'detallesVenta.articulo'],
      order: {
        fechaVenta: 'DESC',
      },
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
