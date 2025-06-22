import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ArticuloProveedor,
  ModeloInventario,
} from 'src/articulo-proveedor/entities/articulo-proveedor.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';
import { Proveedor } from 'src/articulo-proveedor/entities/proveedor.entity';
import { CreateOrdenCompraDto } from 'src/orden-compra/dto/ordencompra/create-orden-compra.dto';
import { OrdenCompra } from 'src/orden-compra/entities/orden-compra.entity';
import { OrdenCompraService } from 'src/orden-compra/services/orden-compra.service';
import { EntityManager, Equal, Raw, Repository } from 'typeorm';

// ============================ SERVICE ==============================
@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(ArticuloProveedor)
    private articuloProveedorRepo: Repository<ArticuloProveedor>,
    private ordenCompraService: OrdenCompraService,
  ) {}

  // ================== CÁLCULOS DE INVENTARIO ======================

  // Calcula el Punto de Pedido para un artículo (modelo LOTE_FIJO)
  async calcularPuntoPedido(articulo: Articulo): Promise<number> {
    if (!articulo.proveedorPredeterminado) {
      console.warn('No hay proveedor predeterminado');
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

  // Calcula el Lote Óptimo (modelo LOTE_FIJO)
  async calcularLoteOptimo(articulo: Articulo): Promise<number> {
    if (!articulo.proveedorPredeterminado) {
      console.warn('No hay proveedor predeterminado');
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

  // Calcula el Costo Global de Inventario (CGI)
  async calcularCostoTotal(
    articulo: Articulo,
    artProv: ArticuloProveedor,
  ): Promise<number> {
    const demanda = articulo.demandaAnual;
    const costoUnidad = artProv.costoCompraUnitarioArticulo;
    const costoPedido = artProv.costoPedido;
    const costoMantenimiento = articulo.costoAlmacenamientoPorUnidad;

    // Para modelo LOTE_FIJO
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

    // Para modelo TIEMPO_FIJO
    const inventarioMax = articulo.inventarioMaximo ?? 0;
    return demanda * costoUnidad + (inventarioMax / 2) * costoMantenimiento;
  }

  // ======================= CONTROL AUTOMÁTICO ========================

  // Cron que se ejecuta cada día a las 10 AM y genera pedidos de modelo TIEMPO_FIJO
  @Cron(CronExpression.EVERY_10_SECONDS)
  public async pedirPedidoFijo() {
    console.log(
      'CRON PARA GENERAR OC PARA ARTICULOS DE TIEMPO FIJO HA EMPEZADO',
    );
    const artProv = await this.articuloProveedorRepo
      .createQueryBuilder('artProv')
      .innerJoinAndMapOne(
        'artProv.articulo',
        Articulo,
        'ar',
        'artProv.articulo.id = ar.id',
      )
      .innerJoinAndMapOne(
        'ar.proveedorPredeterminado',
        Proveedor,
        'prov',
        'ar.proveedorPredeterminado.id = prov.id',
      )
      .where('artProv.proximaFechaRevision = :hoy', { hoy: new Date() })
      .getMany();

    const articulos = artProv.map((artProv) => artProv.articulo);
    if (!articulos.length) {
      console.log('No hay ordenes de compras para crear.');
      return;
    }
    const ordenesCreadas = await this.generarPedido(
      articulos,
      ModeloInventario.TIEMPO_FIJO,
    );
    if (ordenesCreadas.length) {
      console.log('ORDENES DE COMPRA HAN SIDO CREADAS');
      console.log(JSON.stringify(ordenesCreadas, null, 2));

      return;
    }
    console.log('NINGUNA ORDEN FUE CREADA.');
  }

  // Evalúa si los artículos requieren generar OC y la crea si corresponde (modelo LOTE_FIJO)
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
    ).filter((a): a is Articulo => a !== undefined);

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

  // Verifica si un artículo está debajo del punto de pedido (modelo LOTE_FIJO)
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

  // (Pendiente de implementación) Para modelo TIEMPO_FIJO
  async calcularDemandaEsperada() {}

  // ======================== GENERADOR DE OC ==========================

  // Arma y genera las OC agrupadas por proveedor
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
        console.warn('No hay proveedor predeterminado');
        return 0;
      }
      const provId = articulo.proveedorPredeterminado.id;
      if (sonLoteFijo && !articulo.loteOptimo) {
        throw new InternalServerErrorException(
          `Lote Óptimo no existente o igual a cero para el artículo ${articulo.id} ${articulo.nombreArticulo}`,
        );
      }
      let cantidad = 0;
      if (sonLoteFijo && articulo.loteOptimo) {
        cantidad = articulo.loteOptimo;
      } else if (!sonLoteFijo) {
        if (articulo.inventarioMaximo) {
          cantidad = Math.abs(articulo.inventarioMaximo - articulo.stockActual);
        }
      }

      if (!articulosParaOC.has(provId)) {
        articulosParaOC.set(provId, [{ articulo, cantidad }]);
      } else {
        articulosParaOC.get(provId)!.push({ articulo, cantidad });
      }
    });
    let ordenesCompraCreadas: OrdenCompra[] = [];
    for (const [provId, articulos] of articulosParaOC.entries()) {
      const dto: CreateOrdenCompraDto = {
        proveedorId: provId,
        fechaOrdenCompra: new Date().toISOString().split('T')[0],
        detalles: articulos.map((item) => ({
          articuloId: item.articulo.id,
          cantidadArticulo: item.cantidad,
        })),
      };

      const ocCreada = await this.ordenCompraService.create(dto, manager);
      ordenesCompraCreadas.push(ocCreada);
    }
    return ordenesCompraCreadas;
  }

  //======================Stock seguridad============================
  /**
   * Fórmula: z * σ * sqrt(T + L)
   */
  public calcularStockSeguridadConstante(artProv: ArticuloProveedor): number {
    const zTable = {
      0.9: 1.2816,
      0.95: 1.6449,
      0.98: 2.0537,
      0.99: 2.3263,
    };

    const z = zTable[0.95];

    const variacionDemanda = artProv.articulo.variacionDemanda ?? 0;
    const stockSeguridad =
      z *
      variacionDemanda *
      Math.sqrt(artProv.demoraEntregaProveedor + (artProv.tiempoRevision || 0));

    return Math.ceil(stockSeguridad);
  }

  // ===================== CALCULO GENERAL ===========================

  // Asigna datos de inventario automáticamente según modelo de inventario
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
      relations: ['articulo'],
    });
    if (!artProv) {
      throw new InternalServerErrorException(
        'No se encontró la relación Articulo-Proveedor para el proveedor predeterminado',
      );
    }

    const demandaDiaria = articulo.demandaAnual / 365;

    //stock de seguridad para ambos modelos
    const stockSeguridadCalculado =
      this.calcularStockSeguridadConstante(artProv);
    articulo.stockSeguridad = stockSeguridadCalculado;

    // Para modelo LOTE_FIJO
    if (artProv.modeloInventario === ModeloInventario.LOTE_FIJO) {
      const lote = await this.calcularLoteOptimo(articulo);
      const punto = await this.calcularPuntoPedido(articulo);
      articulo.loteOptimo = Math.round(lote);
      articulo.puntoPedido = Math.round(punto);

      articulo.inventarioMaximo = null;
      artProv.tiempoRevision = null;
      artProv.proximaFechaRevision = null;
      await this.articuloProveedorRepo.save(artProv);
    }

    // Para modelo TIEMPO_FIJO
    if (artProv.modeloInventario === ModeloInventario.TIEMPO_FIJO) {
      if (!artProv.tiempoRevision) {
        throw new InternalServerErrorException(
          'Falta tiempo de revisión para modelo TIEMPO_FIJO',
        );
      }
      const inventarioMax =
        demandaDiaria *
          (artProv.tiempoRevision + artProv.demoraEntregaProveedor) +
        articulo.stockSeguridad;
      articulo.inventarioMaximo = Math.round(inventarioMax);

      articulo.loteOptimo = null;
      articulo.puntoPedido = null;
    }

    // CGI aplica a ambos modelos
    articulo.cgi = await this.calcularCostoTotal(articulo, artProv);
  }
}
