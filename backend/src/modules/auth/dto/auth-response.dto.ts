import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Datos del usuario autenticado',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@deligourmet.com',
      nombre: 'Administrador',
      rol: 'ADMIN',
      activo: true,
    },
  })
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
    activo: boolean;
  };
}
