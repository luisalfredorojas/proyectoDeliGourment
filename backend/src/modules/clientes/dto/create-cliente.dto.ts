import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Razón social del cliente',
    example: 'Panadería San José S.A.C.',
    maxLength: 200,
  })
  @IsString({ message: 'La razón social debe ser un texto' })
  @IsNotEmpty({ message: 'La razón social es requerida' })
  @MaxLength(200, { message: 'La razón social no puede exceder 200 caracteres' })
  razonSocial: string;

  @ApiProperty({
    description: 'CI/RUC del cliente',
    example: '1234567890',
    minLength: 10,
    maxLength: 13,
  })
  @IsString({ message: 'El CI/RUC debe ser un texto' })
  @IsNotEmpty({ message: 'El CI/RUC es requerido' })
  @MinLength(10, { message: 'El CI/RUC debe tener entre 10 y 13 dígitos' })
  @MaxLength(13, { message: 'El CI/RUC debe tener entre 10 y 13 dígitos' })
  ruc: string;

  @ApiProperty({
    description: 'Dirección del cliente',
    example: 'Av. Principal 123, Lima',
    maxLength: 300,
  })
  @IsString({ message: 'La dirección debe ser un texto' })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @MaxLength(300, { message: 'La dirección no puede exceder 300 caracteres' })
  direccion: string;

  @ApiPropertyOptional({
    description: 'Ciudad del cliente',
    example: 'Lima',
  })
  @IsString({ message: 'La ciudad debe ser un texto' })
  @IsOptional()
  ciudad?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del cliente',
    example: '01-1234567',
  })
  @IsString({ message: 'El teléfono debe ser un texto' })
  @IsOptional()
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Email del cliente',
    example: 'contacto@panaderia.com',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Ubicación del cliente (coordenadas, referencia detallada)',
    example: '-12.0464, -77.0428',
  })
  @IsString({ message: 'La ubicación debe ser un texto' })
  @IsOptional()
  ubicacion?: string;
}
