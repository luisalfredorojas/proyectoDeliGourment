import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRutaDto {
  @ApiProperty({
    description: 'Nombre de la ruta',
    example: 'Ruta Norte',
    maxLength: 100,
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción de la ruta',
    example: 'Ruta de entregas para la zona norte de la ciudad',
  })
  @IsString({ message: 'La descripción debe ser un texto' })
  @IsOptional()
  descripcion?: string;
}
