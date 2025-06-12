import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  codigoProveedor: string;

  @IsString()
  nombreProveedor: string;

  @IsOptional()
  @IsDateString()
  fechaBajaProveedor?: string;
}
