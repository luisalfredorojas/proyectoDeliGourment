import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ReportesService } from './reportes.service';
import { ProductionReportDto } from './dto/production-report.dto';

@ApiTags('reportes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  // Production Reports
  @Get('produccion')
  @Roles(UserRole.ADMIN, UserRole.ASISTENTE)
  @ApiOperation({ summary: 'Obtener reporte de producción' })
  async getProductionReport(@Query() filters: ProductionReportDto) {
    return this.reportesService.getProductionReport(filters);
  }

  @Get('produccion/diario')
  @Roles(UserRole.ADMIN, UserRole.ASISTENTE)
  @ApiOperation({ summary: 'Obtener reporte diario de producción' })
  async getDailyProductionReport(@Query('fecha') fecha: string) {
    return this.reportesService.getDailyProductionReport(fecha);
  }

  @Get('produccion/semanal')
  @Roles(UserRole.ADMIN, UserRole.ASISTENTE)
  @ApiOperation({ summary: 'Obtener reporte semanal de producción' })
  async getWeeklyProductionReport(
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.reportesService.getWeeklyProductionReport(
      fechaInicio,
      fechaFin,
    );
  }

  // Sales Reports
  @Get('ventas')
  @Roles(UserRole.ADMIN, UserRole.ASISTENTE)
  @ApiOperation({ summary: 'Obtener reporte de ventas' })
  async getSalesReport(@Query() filters: any) {
    return this.reportesService.getSalesReport(filters);
  }

  // Delivery Reports
  @Get('entregas')
  @Roles(UserRole.ADMIN, UserRole.ASISTENTE)
  @ApiOperation({ summary: 'Obtener reporte de entregas' })
  async getDeliveryReport(@Query() filters: any) {
    return this.reportesService.getDeliveryReport(filters);
  }

  // Consignment Reports
  @Get('consignaciones')
  @Roles(UserRole.ADMIN, UserRole.ASISTENTE)
  @ApiOperation({ summary: 'Obtener reporte de consignaciones' })
  async getConsignmentReport(@Query() filters: any) {
    return this.reportesService.getConsignmentReport(filters);
  }

  // Operational Reports
  @Get('operativos')
  @Roles(UserRole.ADMIN, UserRole.ASISTENTE)
  @ApiOperation({ summary: 'Obtener reporte operativo' })
  async getOperationalReport(@Query() filters: any) {
    return this.reportesService.getOperationalReport(filters);
  }
}
