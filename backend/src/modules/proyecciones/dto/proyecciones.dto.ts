import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EstadoProyeccion, OrigenProyeccion } from '@prisma/client';

class DetalleProyeccionDto {
  @ApiProperty()
  @IsString()
  producto: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  precioUnitario?: number;
}

export class CrearProyeccionDto {
  @ApiProperty({ description: 'Fecha para la cual se produce' })
  @IsDateString()
  fechaProduccion: string;

  @ApiProperty({ type: [DetalleProyeccionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleProyeccionDto)
  detalles: DetalleProyeccionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiPropertyOptional({ enum: OrigenProyeccion })
  @IsEnum(OrigenProyeccion)
  @IsOptional()
  origen?: OrigenProyeccion;
}

export class ActualizarProyeccionDto {
  @ApiPropertyOptional({ type: [DetalleProyeccionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DetalleProyeccionDto)
  detalles?: DetalleProyeccionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class CambiarEstadoProyeccionDto {
  @ApiProperty({ enum: EstadoProyeccion })
  @IsEnum(EstadoProyeccion)
  nuevoEstado: EstadoProyeccion;
}

export class CuadrarProyeccionDto {
  @ApiProperty({ description: 'IDs de pedidos a asociar con la proyección' })
  @IsArray()
  @IsString({ each: true })
  pedidoIds: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observaciones?: string;
}
