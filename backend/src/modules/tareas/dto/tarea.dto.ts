import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TareaEstado } from '@prisma/client';

export enum TipoComentario {
  GENERAL = 'GENERAL',
  ESPERA = 'ESPERA',
  PROBLEMA = 'PROBLEMA',
}

export class CambiarEstadoDto {
  @ApiProperty({
    description: 'Nuevo estado de la tarea',
    enum: TareaEstado,
    example: 'EN_PROCESO',
  })
  @IsEnum(TareaEstado)
  nuevoEstado: TareaEstado;

  @ApiPropertyOptional({
    description: 'Comentario opcional al cambiar estado',
    example: 'Iniciando producción',
  })
  @IsString()
  @IsOptional()
  comentario?: string;
}

export class AsignarTareaDto {
  @ApiProperty({
    description: 'ID del usuario al que se asignará la tarea',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  usuarioId: string;
}

export class AddComentarioDto {
  @ApiProperty({
    description: 'Texto del comentario',
    example: 'Falta verificar cantidad de pan integral',
  })
  @IsString()
  comentario: string;

  @ApiPropertyOptional({
    description: 'Tipo de comentario',
    enum: TipoComentario,
    example: 'GENERAL',
  })
  @IsEnum(TipoComentario)
  @IsOptional()
  tipo?: TipoComentario;
}
