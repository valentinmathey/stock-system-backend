import { Injectable } from '@nestjs/common';

@Injectable()
export class IntervaloFijoService {
  // Verifica si corresponde una nueva revisión según la última fecha
  debeRevisarseHoy(ultimaFechaRevision: Date, intervaloDias: number): boolean {
    // lógica a implementar
    return false;
  }

  // Calcula la próxima fecha de revisión
  calcularProximaRevision(
    ultimaFechaRevision: Date,
    intervaloDias: number,
  ): Date {
    // lógica a implementar
    return new Date();
  }

  // Evalúa si debe hacerse un pedido en el intervalo actual
  evaluarPedido(stockActual: number, stockSeguridad: number): boolean {
    // lógica a implementar
    return false;
  }
}
