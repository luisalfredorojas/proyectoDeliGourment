import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMovimiento, MotivoMovimiento } from '@prisma/client';

export class RegistrarMovimientoDto {
  @ApiPropertyOptional({ description: 'ID de la materia prima' })
  @IsUUID('4')
  @IsOptional()
  materiaPrimaId?: string;

  @ApiPropertyOptional({ description: 'ID del producto' })
  @IsUUID('4')
  @IsOptional()
  productoId?: string;

  @ApiProperty({ enum: TipoMovimiento })
  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  @ApiProperty({ enum: MotivoMovimiento })
  @IsEnum(MotivoMovimiento)
  motivo: MotivoMovimiento;

  @ApiProperty({ description: 'Cantidad del movimiento (siempre positivo, el tipo determina si suma o resta)', minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  cantidad: number;

  @ApiPropertyOptional({ description: 'Referencia del movimiento (ej: "Pedido #abc", "Proveedor X")' })
  @IsString()
  @IsOptional()
  referencia?: string;

  @ApiPropertyOptional({ description: 'Observaciones adicionales' })
  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class UpdateMateriaPrimaDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  cantidadDisponible?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unidadMedida?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  stockMinimo?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  costoUnitario?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  proveedor?: string;
}
