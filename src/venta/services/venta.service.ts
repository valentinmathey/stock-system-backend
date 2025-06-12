// DEPENDENCIES ------------------------------------------------------
import {
  BadRequestException,
  Injectable,
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
import { ArticuloProveedor } from 'src/articulo-proveedor/entities/articulo-proveedor.entity';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';
import { CreateOrdenCompraDto } from 'src/orden-compra/dto/ordencompra/create-orden-compra.dto';
import { OrdenCompraService } from 'src/orden-compra/services/orden-compra.service';
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

    @InjectRepository(ArticuloProveedor)
    private readonly articuloProveedorRepo: Repository<ArticuloProveedor>,

    @InjectRepository(OrdenCompra)
    private readonly ordenCompraRepo: Repository<OrdenCompra>,

    private readonly ordenCompraService: OrdenCompraService,

    private readonly dataSource: DataSource,
  ) {}

  /* ---------------------------- CREATE --------------------------- */
  async create(data: CreateVentaDto) {
    // Validación inicial: debe haber al menos un detalle
    if (!data.detalle?.length) {
      throw new BadRequestException('Por favor enviar los artículos a vender');
    }

    // Evitar artículos repetidos en la venta
    const ids = data.detalle.map((d) => d.articuloId);
    const repetidos = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (repetidos.length) {
      throw new BadRequestException(
        'Hay artículos repetidos en el detalle de la venta',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Repositorios transaccionales
      const ventaRepo = manager.getRepository(Venta);
      const articuloRepo = manager.getRepository(Articulo);
      const detalleRepo = manager.getRepository(DetalleVenta);
      const ocRepo = manager.getRepository(OrdenCompra);

      // Crear cabecera de venta con fecha (si se pasó)
      const venta = ventaRepo.create({
        fechaVenta: data.fechaVenta ? new Date(data.fechaVenta) : undefined,
      });

      let total = 0;
      const detalles: DetalleVenta[] = [];

      // Mapa para agrupar artículos que requieren OC por proveedor
      const articulosParaOC = new Map<
        number,
        { articulo: Articulo; cantidad: number }[]
      >();

      for (const d of data.detalle) {
        // Buscar artículo y cargar relaciones necesarias
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

        // Verificar stock suficiente
        if (articulo.stockActual < d.cantidadArticulo) {
          throw new BadRequestException(
            `Stock insuficiente para el artículo ${articulo.nombreArticulo}`,
          );
        }

        // Calcular subtotal y acumular
        const subtotal =
          d.cantidadArticulo * articulo.precioVentaUnitarioArticulo;
        total += subtotal;

        // Restar stock actual y guardar
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

        // Evaluar si debe dispararse una OC automática
        const artProv = await this.articuloProveedorRepo.findOne({
          where: {
            articulo: { id: articulo.id },
            proveedor: { id: articulo.proveedorPredeterminado?.id },
          },
        });

        // Si es LOTE_FIJO y bajó al PP, se evalúa si necesita OC
        if (
          artProv?.modeloInventario === 'LOTE_FIJO' &&
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

          // Si no hay OC activa y tiene proveedor predeterminado, se agrupa para crear OC luego
          if (!existeOC && articulo.proveedorPredeterminado) {
            const provId = articulo.proveedorPredeterminado.id;
            if (!articulosParaOC.has(provId)) {
              articulosParaOC.set(provId, []);
            }
            articulosParaOC.get(provId)!.push({
              articulo,
              cantidad: articulo.loteOptimo,
            });
          }
        }
      }

      // Asignar detalles a la venta y guardar
      venta.detallesVenta = detalles;
      venta.ventaTotal = total;
      const ventaGuardada = await ventaRepo.save(venta);

      // Crear OC por cada proveedor que lo necesite, usando el servicio centralizado
      for (const [provId, articulos] of articulosParaOC.entries()) {
        const dto: CreateOrdenCompraDto = {
          proveedorId: provId,
          fechaOrdenCompra: new Date().toISOString().split('T')[0],
          detalles: articulos.map((item) => ({
            articuloId: item.articulo.id,
            cantidadArticulo: item.articulo.loteOptimo,
          })),
        };

        await this.ordenCompraService.create(dto); // este método ya es externo a la transacción
      }

      return ventaGuardada;
    });
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
