import {
  IsNotEmpty,
  IsUUID,
  IsArray,
  IsString,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  IsInt,
  Min,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DetalleProductoDto {
  @ApiProperty({ description: 'Nombre del producto', example: 'Pan francés' })
  @IsString()
  @IsNotEmpty()
  producto: string;

  @ApiProperty({ description: 'Cantidad solicitada', example: 50 })
  @IsNotEmpty()
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario', example: 0.5 })
  @IsNotEmpty()
  precioUnitario: number;

  @ApiPropertyOptional({ description: 'ID del producto (opcional)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4')
  @IsOptional()
  productoId?: string;
}

class DetalleConsignacionDto {
  @ApiProperty({ description: 'Nombre del producto', example: 'Empanada' })
  @IsString()
  @IsNotEmpty()
  producto: string;

  @ApiProperty({ description: 'Cantidad', example: 2 })
  @IsInt()
  @Min(1)
  cantidad: number;

  @ApiProperty({ description: 'Precio unitario', example: 1.5 })
  @IsNumber()
  @Min(0)
  precioUnitario: number;
}

export class CreatePedidoDto {
  @ApiPropertyOptional({
    description: 'ID de la sucursal que hace el pedido (opcional para proyecciones)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsOptional()
  sucursalId?: string;

  @ApiProperty({
    description: 'Detalles de los productos',
    type: [DetalleProductoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleProductoDto)
  detalles: DetalleProductoDto[];

  @ApiPropertyOptional({ description: 'Items de consignación (no producir)', type: [DetalleConsignacionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DetalleConsignacionDto)
  consignaciones?: DetalleConsignacionDto[];

  @ApiPropertyOptional({
    description: 'Indica si el pedido es solo de consignaciones (sin productos a producir)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  soloConsignaciones?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el pedido es una proyección de producción',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  esProyeccion?: boolean;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales',
    example: 'Entregar antes de las 8 AM',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
