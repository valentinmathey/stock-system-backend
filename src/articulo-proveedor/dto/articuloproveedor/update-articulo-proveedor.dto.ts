import { PartialType } from '@nestjs/swagger';
import { CreateArticuloProveedorDto } from './create-articulo-proveedor.dto';

export class UpdateArticuloProveedorDto extends PartialType(CreateArticuloProveedorDto) {}
