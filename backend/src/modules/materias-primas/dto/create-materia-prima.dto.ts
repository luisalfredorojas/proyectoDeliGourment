import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateMateriaPrimaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsNumber()
  @Min(0)
  cantidadDisponible: number;

  @IsString()
  @IsNotEmpty()
  unidadMedida: string;
}
