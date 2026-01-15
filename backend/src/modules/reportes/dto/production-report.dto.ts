import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductionReportDto {
  @ApiPropertyOptional({ description: 'Fecha de inicio (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @ApiPropertyOptional({ description: 'ID de ruta para filtrar' })
  @IsOptional()
  @IsString()
  rutaId?: string;

  @ApiPropertyOptional({ description: 'Nombre de producto para filtrar' })
  @IsOptional()
  @IsString()
  producto?: string;
}
