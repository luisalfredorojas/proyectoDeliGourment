import { PartialType } from '@nestjs/swagger';
import { CreateRutaDto } from './create-ruta.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRutaDto extends PartialType(CreateRutaDto) {
  @ApiPropertyOptional({
    description: 'Estado de la ruta',
    example: true,
  })
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  @IsOptional()
  activa?: boolean;
}
