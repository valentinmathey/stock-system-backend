import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { log } from 'console';
import {
  ArticuloProveedor,
  ModeloInventario,
} from 'src/articulo-proveedor/entities/articulo-proveedor.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';
import { CreateOrdenCompraDto } from 'src/orden-compra/dto/ordencompra/create-orden-compra.dto';
import { OrdenCompraService } from 'src/orden-compra/services/orden-compra.service';
import { EntityManager, Raw, Repository } from 'typeorm';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(ArticuloProveedor)
    private articuloProveedorRepo: Repository<ArticuloProveedor>,
    private ordenCompraService: OrdenCompraService,
  ) {}

  // ------------ MODELO LOTE FIJO --------------------------------------

  // Calcula el punto de pedido basado en la demanda y el tiempo de entrega
  async calcularPuntoPedido(articulo: Articulo): Promise<number> {
    if (!articulo.proveedorPredeterminado) {
      console.log('No hay proveedor predeterminado');
      return 0;
    }
    const artProv = await this.articuloProveedorRepo.findOne({
      where: {
        articulo: { id: articulo.id },
        proveedor: { id: articulo.proveedorPredeterminado.id },
      },
    });
    if (!artProv) {
      throw new InternalServerErrorException(
        `Proveedor determinador no cargado en articulo-proveedor`,
      );
    }
    if (artProv.demoraEntregaProveedor <= 0) {
      throw new InternalServerErrorException(
        'Demora de entrega de proveedor no puede ser menor o igual a 0',
      );
    }
    const demandaDiaria = articulo.demandaAnual / 365;
    return (
      demandaDiaria * artProv.demoraEntregaProveedor + articulo.stockSeguridad
    );
  }

  async calcularLoteOptimo(articulo: Articulo): Promise<number> {
    if (!articulo.proveedorPredeterminado) {
      console.log('No hay proveedor predeterminado');
      return 0;
    }
    const artProv = await this.articuloProveedorRepo.findOne({
      where: {
        articulo: { id: articulo.id },
        proveedor: { id: articulo.proveedorPredeterminado.id },
      },
    });
    if (!artProv) {
      throw new InternalServerErrorException(
        `Proveedor determinador no cargado en articulo-proveedor`,
      );
    }
    const demanda = articulo.demandaAnual;
    const costoPedido = artProv.costoPedido;
    const costoMantenimiento = articulo.costoAlmacenamientoPorUnidad;
    if (costoMantenimiento <= 0) {
      throw new InternalServerErrorException(
        'Costo de mantenimiento no puede ser menor o igual a 0',
      );
    }
    return Math.sqrt((2 * demanda * costoPedido) / costoMantenimiento);
  }
  async calcularCostoTotal(
    articulo: Articulo,
    artProv: ArticuloProveedor,
  ): Promise<number> {
    const demanda = articulo.demandaAnual;
    const costoUnidad = artProv.costoCompraUnitarioArticulo;
    const costoPedido = artProv.costoPedido;
    const costoMantenimiento = articulo.costoAlmacenamientoPorUnidad;

    if (artProv.modeloInventario === ModeloInventario.LOTE_FIJO) {
      const lote = articulo.loteOptimo ?? 0;
      if (lote <= 0) {
        throw new InternalServerErrorException(
          'No se puede calcular CT con lote óptimo igual a 0 o nulo',
        );
      }
      return (
        demanda * costoUnidad +
        (demanda / lote) * costoPedido +
        (lote / 2) * costoMantenimiento
      );
    }

    // -------- TIEMPO_FIJO ----------
    //   CT = Costo de compra + Costo de mantenimiento sobre inventario máximo
    const inventarioMax = articulo.inventarioMaximo ?? 0;
    return demanda * costoUnidad + (inventarioMax / 2) * costoMantenimiento;
  }

  /**
   * @description Se activa todos los dias y trae los articulos que hay que pedir.
   */

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  public async pedirPedidoFijo() {
    // DUDA: PROVEDOR_PREDETERMINADO
    const artProv = await this.articuloProveedorRepo.find({
      where: {
        proximaFechaRevision: Raw((alias) => `${alias}::date = CURRENT_DATE`),
      },
      relations: ['articulo'],
    });
    const articulos = artProv.map((artProv) => artProv.articulo);
    await this.generarPedido(articulos, ModeloInventario.TIEMPO_FIJO);
  }

  /**
   * @description Le pasamos articulos y si están bajo el Punto de Pedido, generamos OC.
   */
  public async evaluarYPedirLoteFijo(
    articulos: Articulo[],
    manager?: EntityManager,
  ) {
    const articuloAPedir = (
      await Promise.all(
        articulos.map(async (articulo) => {
          if (await this.hayQuePedirLoteFijo(articulo, manager)) {
            return articulo;
          }
        }),
      )
    ).filter((a) => a !== undefined);

    if (articuloAPedir.length === 0) {
      console.log('Los articulos evaluados no necesitan OC');
      return;
    }

    await this.generarPedido(
      articuloAPedir,
      ModeloInventario.LOTE_FIJO,
      manager,
    );
  }

  public async hayQuePedirLoteFijo(
    articulo: Articulo,
    manager?: EntityManager,
  ) {
    const artProvRepo = manager
      ? manager.getRepository(ArticuloProveedor)
      : this.articuloProveedorRepo;

    const artProv = await artProvRepo.findOne({
      where: {
        articulo: { id: articulo.id },
        proveedor: { id: articulo.proveedorPredeterminado?.id },
      },
    });

    if (!artProv) {
      throw new InternalServerErrorException(
        'El articulo no tiene instancia de articuloProveedor para el proveedor determinado',
      );
    }

    if (artProv.modeloInventario !== ModeloInventario.LOTE_FIJO) return;

    const articulosEnCamino =
      await this.ordenCompraService.getCantidadPendiente(articulo);
    const posicionInventario = articulo.stockActual + articulosEnCamino;

    if (!articulo.puntoPedido) {
      const msg = `Articulo con modelo de inventario ${ModeloInventario.TIEMPO_FIJO} sin punto de pedido calculado`;
      throw new InternalServerErrorException(msg);
    }

    return posicionInventario <= articulo.puntoPedido;
  }

  // --------- MODELO PEDIDO FIJO
  // TODO
  async calcularDemandaEsperada() {}

  // -----------  PARA AMBOS MODELOS
  /**
   * @description Para la lista de articulos genera las OC con las cantidades correspondientes al modelo de inventario
   */
  private async generarPedido(
    articulos: Articulo[],
    modeloInventario: ModeloInventario,
    manager?: EntityManager,
  ) {
    const sonLoteFijo = modeloInventario === ModeloInventario.LOTE_FIJO;

    const articulosParaOC = new Map<
      number,
      {
        articulo: Articulo;
        cantidad: number;
      }[]
    >();

    articulos.forEach((articulo) => {
      if (!articulo.proveedorPredeterminado) {
        console.log('No hay proveedor predeterminado');
        return 0;
      }
      const provId = articulo.proveedorPredeterminado.id;
      if (sonLoteFijo && !articulo.loteOptimo) {
        throw new InternalServerErrorException(
          `Lote Óptimo no existente o igual a cero para el artículo ${articulo.id} ${articulo.nombreArticulo}`,
        );
      }

      const cantidad =
        sonLoteFijo && articulo.loteOptimo
          ? articulo.loteOptimo
          : Math.abs(articulo.stockActual - articulo.stockSeguridad);

      if (!articulosParaOC.has(provId)) {
        articulosParaOC.set(provId, [{ articulo, cantidad }]);
      } else {
        articulosParaOC.get(provId)!.push({ articulo, cantidad });
      }
    });

    for (const [provId, articulos] of articulosParaOC.entries()) {
      const dto: CreateOrdenCompraDto = {
        proveedorId: provId,
        fechaOrdenCompra: new Date().toISOString().split('T')[0],
        detalles: articulos.map((item) => ({
          articuloId: item.articulo.id,
          cantidadArticulo: item.cantidad,
        })),
      };

      // Ejecutar dentro de transacción si hay manager
      if (manager) {
        const ordenCompraService =
          manager.getCustomRepository?.(OrdenCompraService) ||
          this.ordenCompraService;
        await ordenCompraService.create(dto);
      } else {
        await this.ordenCompraService.create(dto);
      }
    }
  }

  // CALCULO GENERAL

  /**
   * @description Calcula y asigna lote óptimo, punto de pedido, inventario máximo y CGI al artículo, según el modelo de inventario.
   */
  async calcularYAsignarDatosInventario(articulo: Articulo): Promise<void> {
    if (!articulo.proveedorPredeterminado) {
      throw new InternalServerErrorException(
        'El artículo no tiene proveedor predeterminado asignado',
      );
    }

    const artProv = await this.articuloProveedorRepo.findOne({
      where: {
        articulo: { id: articulo.id },
        proveedor: { id: articulo.proveedorPredeterminado.id },
      },
    });

    if (!artProv) {
      throw new InternalServerErrorException(
        'No se encontró la relación Articulo-Proveedor para el proveedor predeterminado',
      );
    }

    const demandaDiaria = articulo.demandaAnual / 365;

    // Lote fijo
    if (artProv.modeloInventario === ModeloInventario.LOTE_FIJO) {
      const lote = await this.calcularLoteOptimo(articulo);
      const punto = await this.calcularPuntoPedido(articulo);
      articulo.loteOptimo = Math.round(lote);
      articulo.puntoPedido = Math.round(punto);
      articulo.inventarioMaximo = Math.round(
        articulo.loteOptimo + articulo.stockSeguridad,
      );
    }

    // Tiempo fijo
    if (artProv.modeloInventario === ModeloInventario.TIEMPO_FIJO) {
      if (!artProv.tiempoRevision) {
        throw new InternalServerErrorException(
          'Falta tiempo de revisión para modelo TIEMPO_FIJO',
        );
      }
      articulo.loteOptimo = null;
      const punto = await this.calcularPuntoPedido(articulo);
      const inventarioMax =
        demandaDiaria * artProv.tiempoRevision + articulo.stockSeguridad;

      articulo.puntoPedido = Math.round(punto);
      articulo.inventarioMaximo = Math.round(inventarioMax);
    }

    // CGI aplica a ambos modelos
    articulo.cgi = await this.calcularCostoTotal(articulo, artProv);
  }
}
