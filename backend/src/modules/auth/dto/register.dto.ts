import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  ASISTENTE = 'ASISTENTE',
  PRODUCCION = 'PRODUCCION',
}

export class RegisterDto {
  @ApiProperty({
    example: 'admin@deligourmet.com',
    description: 'Email del usuario',
  })
  @IsEmail({}, { message: 'El email debe ser válido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @ApiProperty({
    example: 'Admin123!',
    description: 'Contraseña del usuario',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.ASISTENTE,
    description: 'Rol del usuario en el sistema',
  })
  @IsEnum(UserRole, { message: 'El rol debe ser ADMIN, ASISTENTE o PRODUCCION' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  rol: UserRole;
}
