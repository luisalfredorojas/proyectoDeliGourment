import { IsString, IsNumber, IsNotEmpty, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class MateriaPrimaRequeridaDto {
  @IsString()
  @IsNotEmpty()
  materiaPrimaId: string;

  @IsNumber()
  @Min(0)
  cantidadRequerida: number;
}

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MateriaPrimaRequeridaDto)
  @IsOptional()
  materiasPrimas?: MateriaPrimaRequeridaDto[];
}
