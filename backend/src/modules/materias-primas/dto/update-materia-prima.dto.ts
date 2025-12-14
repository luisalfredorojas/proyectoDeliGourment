import { PartialType } from '@nestjs/mapped-types';
import { CreateMateriaPrimaDto } from './create-materia-prima.dto';

export class UpdateMateriaPrimaDto extends PartialType(CreateMateriaPrimaDto) {}
