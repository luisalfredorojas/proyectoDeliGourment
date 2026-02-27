import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProyeccionesService } from './proyecciones.service';
import {
  CrearProyeccionDto,
  ActualizarProyeccionDto,
  CambiarEstadoProyeccionDto,
  CuadrarProyeccionDto,
} from './dto/proyecciones.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EstadoProyeccion } from '@prisma/client';

@ApiTags('Proyecciones')
@Controller('proyecciones')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class ProyeccionesController {
  constructor(
    private readonly proyeccionesService: ProyeccionesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar proyecciones (filtrar por fecha y estado)' })
  @ApiQuery({ name: 'fecha', required: false })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoProyeccion })
  findAll(
    @Query('fecha') fecha?: string,
    @Query('estado') estado?: EstadoProyeccion,
  ) {
    return this.proyeccionesService.findAll({ fecha, estado });
  }

  @Get('sugerencia')
  @ApiOperation({ summary: 'Obtener sugerencia de producción basada en tendencias' })
  @ApiQuery({ name: 'fecha', required: true })
  getSugerencia(@Query('fecha') fecha: string) {
    return this.proyeccionesService.getSugerenciaParaFecha(fecha);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una proyección con cuadres' })
  findOne(@Param('id') id: string) {
    return this.proyeccionesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva proyección manual' })
  @ApiResponse({ status: 201, description: 'Proyección creada' })
  crear(
    @Body() dto: CrearProyeccionDto,
    @CurrentUser() user: any,
  ) {
    return this.proyeccionesService.crear(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar detalles de una proyección' })
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarProyeccionDto,
  ) {
    return this.proyeccionesService.actualizar(id, dto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado de una proyección' })
  cambiarEstado(
    @Param('id') id: string,
    @Body() dto: CambiarEstadoProyeccionDto,
  ) {
    return this.proyeccionesService.cambiarEstado(id, dto);
  }

  @Post(':id/confirmar')
  @ApiOperation({ summary: 'Confirmar proyección (BORRADOR → PENDIENTE) y crear tarea en Kanban' })
  confirmar(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.proyeccionesService.confirmar(id, user.id);
  }

  @Post(':id/cuadrar')
  @ApiOperation({ summary: 'Cuadrar proyección con pedidos reales' })
  cuadrar(
    @Param('id') id: string,
    @Body() dto: CuadrarProyeccionDto,
  ) {
    return this.proyeccionesService.cuadrar(id, dto);
  }

  @Get(':id/resumen-cuadre')
  @ApiOperation({ summary: 'Resumen comparativo proyección vs pedidos reales del día' })
  getResumenCuadre(@Param('id') id: string) {
    return this.proyeccionesService.getResumenCuadre(id);
  }
}
