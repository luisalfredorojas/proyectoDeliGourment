import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateClienteProductoDto {
  @ApiProperty({ description: 'ID del producto', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  productoId: string;

  @ApiProperty({ description: 'Precio acordado para este cliente', example: 12.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio: number;
}

export class UpdateClienteProductoDto {
  @ApiProperty({ description: 'Nuevo precio acordado para este cliente', example: 15.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio: number;
}
