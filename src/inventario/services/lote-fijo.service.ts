import { Injectable } from '@nestjs/common';

@Injectable()
export class LoteFijoService {
  // Calcula el punto de pedido basado en la demanda y el tiempo de entrega
  calcularPuntoPedido(
    demandaDiaria: number,
    tiempoEntregaDias: number,
  ): number {
    // lógica a implementar
    return 0;
  }

  // Calcula el lote económico de pedido (EOQ) si es necesario
  calcularLoteFijo(
    costoPedido: number,
    demandaAnual: number,
    costoAlmacenamientoUnidad: number,
  ): number {
    // lógica a implementar
    return 0;
  }

  // Determina si se debe realizar un pedido según el stock actual
  esNecesarioPedir(stockActual: number, puntoPedido: number): boolean {
    // lógica a implementar
    return false;
  }
}
