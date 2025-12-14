import { PartialType } from '@nestjs/swagger';
import { CreatePedidoDto } from './create-pedido.dto';
import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePedidoDto extends PartialType(CreatePedidoDto) {
  @ApiPropertyOptional({
    description: 'Fecha de producción (solo ADMIN puede modificar)',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsOptional()
  fechaProduccion?: string;
}
