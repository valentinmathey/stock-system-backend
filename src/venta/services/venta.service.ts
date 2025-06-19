import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';

// ============================= ENTIDADES ==================================
import { Venta } from '../entities/venta.entity';
import { DetalleVenta } from '../entities/detalle-venta.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';
import { ArticuloProveedor } from 'src/articulo-proveedor/entities/articulo-proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';

// ================================ DTOs ====================================
import { CreateVentaDto } from '../dto/venta/create-venta.dto';
import { UpdateVentaDto } from '../dto/venta/update-venta.dto';
import { CreateOrdenCompraDto } from 'src/orden-compra/dto/ordencompra/create-orden-compra.dto';

// ============================= SERVICIOS =================================
import { OrdenCompraService } from 'src/orden-compra/services/orden-compra.service';

@Injectable()
export class VentaService {
  constructor(
    /* -------------------- Repositorios inyectados ----------------- */
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    private readonly dataSource: DataSource,

    @InjectRepository(ArticuloProveedor)
    private readonly articuloProveedorRepo: Repository<ArticuloProveedor>,

    private readonly ordenCompraService: OrdenCompraService,
  ) {}

  /* ============================= CREATE =============================== */

  // Crea una venta, descuenta stock y genera orden de compra si es necesario
  async create(data: CreateVentaDto) {
    if (!data.detalle?.length) {
      throw new BadRequestException('Por favor enviar los artículos a vender');
    }

    // Validación para evitar artículos repetidos
    const ids = data.detalle.map((d) => d.articuloId);
    const repetidos = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (repetidos.length) {
      throw new BadRequestException(
        'Hay artículos repetidos en el detalle de la venta',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Repos transaccionales
      const ventaRepo = manager.getRepository(Venta);
      const articuloRepo = manager.getRepository(Articulo);
      const detalleRepo = manager.getRepository(DetalleVenta);
      const ocRepo = manager.getRepository(OrdenCompra);

      // Crear cabecera de venta
      const venta = ventaRepo.create({
        fechaVenta: data.fechaVenta ? new Date(data.fechaVenta) : undefined,
      });

      let total = 0;
      const detalles: DetalleVenta[] = [];

      // Agrupar artículos para futuras órdenes de compra
      type ItemOC = { articulo: Articulo; cantidad: number };
      const articulosParaOC = new Map<number, ItemOC[]>();

      // Iterar cada artículo del detalle
      for (const d of data.detalle) {
        const articulo = await articuloRepo.findOne({
          where: { id: d.articuloId },
          relations: ['proveedorPredeterminado', 'articulosProveedor'],
        });

        if (!articulo) {
          throw new BadRequestException(
            `Artículo con ID ${d.articuloId} no existe`,
          );
        }

        // No permitir artículos dados de baja
        if (articulo.fechaBajaArticulo) {
          throw new BadRequestException(
            `El artículo ${articulo.nombreArticulo} está dado de baja`,
          );
        }

        // Validar stock suficiente
        if (articulo.stockActual < d.cantidadArticulo) {
          throw new BadRequestException(
            `Stock insuficiente para el artículo ${articulo.nombreArticulo}`,
          );
        }

        // Calcular subtotal y actualizar total
        const subtotal =
          d.cantidadArticulo * articulo.precioVentaUnitarioArticulo;
        total += subtotal;

        // Descontar stock
        articulo.stockActual -= d.cantidadArticulo;
        await articuloRepo.save(articulo);

        // Agregar detalle de venta
        detalles.push(
          detalleRepo.create({
            articulo,
            cantidadArticulo: d.cantidadArticulo,
            precioVentaUnitarioArticulo: articulo.precioVentaUnitarioArticulo,
            ventaSubtotal: subtotal,
          }),
        );

        // Verificar si se debe disparar OC automática
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

          // Si no hay OC activa y el artículo tiene proveedor predeterminado
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

      // Guardar venta y sus detalles
      venta.detallesVenta = detalles;
      venta.ventaTotal = total;
      const ventaGuardada = await ventaRepo.save(venta);

      // Crear órdenes de compra necesarias
      for (const [provId, items] of articulosParaOC.entries()) {
        const dto: CreateOrdenCompraDto = {
          proveedorId: provId,
          fechaOrdenCompra: new Date().toISOString().split('T')[0],
          detalles: items.map(({ articulo, cantidad }) => ({
            articuloId: articulo.id,
            cantidadArticulo: cantidad,
          })),
        };

        await this.ordenCompraService.create(dto);
      }

      return ventaGuardada;
    });
  }

  /* ============================== READ ================================ */

  // Devuelve todas las ventas con sus detalles y artículos relacionados
  findAll() {
    return this.ventaRepository.find({
      where: { fechaBajaVenta: IsNull() },
      relations: ['detallesVenta', 'detallesVenta.articulo'],
      order: {
        fechaVenta: 'DESC',
      },
    });
  }

  // Devuelve una venta específica por ID
  async findOne(id: number) {
    const venta = await this.ventaRepository.findOne({
      where: {
        id,
        fechaBajaVenta: IsNull(),
      },
      relations: ['detallesVenta', 'detallesVenta.articulo'],
    });

    if (!venta) {
      throw new NotFoundException(
        `Venta con ID ${id} no encontrada o fue dada de baja`,
      );
    }

    return venta;
  }

  /* ============================= UPDATE ================================ */

  // Actualiza una venta existente
  async update(id: number, data: UpdateVentaDto) {
    const venta = await this.ventaRepository.findOneBy({ id });
    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    await this.ventaRepository.update(id, data);
    return this.ventaRepository.findOneBy({ id });
  }

  /* ============================= DELETE ================================ */

  // Marca la venta como dada de baja lógicamente
  async delete(id: number) {
    const venta = await this.ventaRepository.findOneBy({ id });
    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    venta.fechaBajaVenta = new Date();
    return this.ventaRepository.save(venta);
  }
}
