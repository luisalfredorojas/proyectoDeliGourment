import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Obtener estadísticas completas (solo Admin)' })
  async getAdminStats(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.dashboardService.getAdminStats(fechaInicio, fechaFin);
  }

  @Get('tareas-operativas')
  @ApiOperation({ summary: 'Obtener tareas pendientes y en proceso' })
  async getTareasOperativas() {
    return this.dashboardService.getTareasOperativas();
  }
}
