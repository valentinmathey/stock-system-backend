import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ArticuloProveedor,
  ModeloInventario,
} from 'src/articulo-proveedor/entities/articulo-proveedor.entity';
import { Articulo } from 'src/articulo-proveedor/entities/articulo.entity';
import { CreateOrdenCompraDto } from 'src/orden-compra/dto/ordencompra/create-orden-compra.dto';
import { OrdenCompraService } from 'src/orden-compra/services/orden-compra.service';
import { Raw, Repository } from 'typeorm';

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

  async calcularCostoTotal(articulo: Articulo) {
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
    const costoUnidad = artProv.costoCompraUnitarioArticulo;
    const loteOptimo = articulo.loteOptimo ?? 0;
    if (loteOptimo <= 0) {
      throw new InternalServerErrorException(
        'No se puede calcular el CT con lote optimo igual a 0 o nulo',
      );
    }
    const costoPedido = artProv.costoPedido;
    const costoAlmacenamiento = articulo.costoAlmacenamientoPorUnidad;

    return (
      demanda * costoUnidad +
      (demanda / loteOptimo) * costoPedido +
      (loteOptimo / 2) * costoAlmacenamiento
    );
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
  public async evaluarYPedirLoteFijo(articulos: Articulo[]) {
    const articuloAPedir = (
      await Promise.all(
        articulos.map(async (articulo) => {
          if (await this.hayQuePedirLoteFijo(articulo)) {
            return articulo;
          }
        }),
      )
    ).filter((a) => a !== undefined);

    if (articuloAPedir.length === 0) {
      console.log('Los articulos evaluados no necesitan OC');
      return;
    }
    await this.generarPedido(articulos, ModeloInventario.LOTE_FIJO);
  }
  public async hayQuePedirLoteFijo(articulo: Articulo) {
    const artProv = await this.articuloProveedorRepo.findOne({
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

    const posicionInvenatario = articulo.stockActual + articulosEnCamino;
    if (!articulo.puntoPedido) {
      const msg = `Articulo conm modelo inventario ${ModeloInventario.TIEMPO_FIJO} sin punto pedido calculado`;
      console.log(msg);
      throw new InternalServerErrorException(msg);
    }
    return posicionInvenatario <= articulo.puntoPedido;
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
      const provId = articulo.proveedorPredeterminado.id;
      if (sonLoteFijo && (!articulo.loteOptimo || articulo.loteOptimo === 0)) {
        throw new InternalServerErrorException(
          `Lote Optimo no existente o igual a cero para el articulo ${articulo.id} ${articulo.nombreArticulo}`,
        );
      }

      let cantidad: number;
      if (sonLoteFijo && articulo.loteOptimo) {
        cantidad = articulo.loteOptimo;
      } else {
        cantidad = Math.abs(articulo.stockActual - articulo.stockSeguridad);
      }

      if (!articulosParaOC.has(provId)) {
        articulosParaOC.set(provId, [{ articulo, cantidad }]);
      } else {
        articulosParaOC.get(provId)!.push({
          articulo,
          cantidad,
        });
      }
    });

    // Crear OC por cada proveedor que lo necesite,
    for (const [provId, articulos] of articulosParaOC.entries()) {
      const dto: CreateOrdenCompraDto = {
        proveedorId: provId,
        fechaOrdenCompra: new Date().toISOString().split('T')[0],
        detalles: articulos.map((item) => ({
          articuloId: item.articulo.id,
          cantidadArticulo: item.cantidad,
        })),
      };
      await this.ordenCompraService.create(dto);
    }
  }
}
