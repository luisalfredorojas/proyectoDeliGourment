import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSucursalDto {
  @ApiProperty({
    description: 'ID del cliente al que pertenece la sucursal',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'El ID del cliente debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El cliente es requerido' })
  clienteId: string;

  @ApiProperty({
    description: 'ID de la ruta asignada a la sucursal',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID('4', { message: 'El ID de la ruta debe ser un UUID válido' })
  @IsNotEmpty({ message: 'La ruta es requerida' })
  rutaId: string;

  @ApiProperty({
    description: 'Nombre de la sucursal',
    example: 'Sucursal Centro',
    maxLength: 200,
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Dirección de la sucursal',
    example: 'Calle Los Olivos 456',
  })
  @IsString({ message: 'La dirección debe ser un texto' })
  @IsOptional()
  direccion?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de la sucursal',
    example: '01-9876543',
  })
  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional()
  telefono?: string;
}
