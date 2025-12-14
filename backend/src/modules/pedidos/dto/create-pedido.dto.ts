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
}

export class CreatePedidoDto {
  @ApiProperty({
    description: 'ID de la sucursal que hace el pedido',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  sucursalId: string;

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
    description: 'Observaciones adicionales',
    example: 'Entregar antes de las 8 AM',
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
