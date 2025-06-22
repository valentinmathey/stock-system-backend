import { ApiProperty } from '@nestjs/swagger';

export class GetProveedorDto {
  @ApiProperty({ example: 7 })
  id: number;

  @ApiProperty({ example: 'P-001' })
  codigoProveedor: string;

  @ApiProperty({ example: 'ACME S.A.' })
  nombreProveedor: string;
  @ApiProperty({ nullable: true })
  fechaBajaProveedor: Date | null;
}
