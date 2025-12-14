import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TareasService } from './tareas.service';
import { CambiarEstadoDto, AsignarTareaDto, AddComentarioDto } from './dto/tarea.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TareaEstado } from '@prisma/client';

@ApiTags('Tareas')
@Controller('tareas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tareas con filtros' })
  @ApiQuery({ name: 'estado', required: false, enum: TareaEstado })
  @ApiQuery({ name: 'asignadoId', required: false })
  @ApiQuery({ name: 'rutaId', required: false })
  @ApiQuery({ name: 'fecha', required: false, description: 'YYYY-MM-DD' })
  findAll(
    @Query('estado') estado?: TareaEstado,
    @Query('asignadoId') asignadoId?: string,
    @Query('rutaId') rutaId?: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.tareasService.findAll({ estado, asignadoId, rutaId, fecha });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tarea por ID con últimos eventos' })
  findOne(@Param('id') id: string) {
    return this.tareasService.findOne(id);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Cambiar estado de tarea (con permisos según rol y hora)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado y registrado en historial' })
  @ApiResponse({ status: 403, description: 'No tiene permisos para cambiar estado en este horario' })
  cambiarEstado(
    @Param('id') id: string,
    @Body() cambiarEstadoDto: CambiarEstadoDto,
    @CurrentUser() user: any,
  ) {
    return this.tareasService.cambiarEstado(id, cambiarEstadoDto, user.id, user.rol);
  }

  @Patch(':id/asignar')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Asignar tarea a usuario PRODUCCION (solo ADMIN)' })
  asignar(
    @Param('id') id: string,
    @Body() asignarTareaDto: AsignarTareaDto,
    @CurrentUser() user: any,
  ) {
    return this.tareasService.asignar(id, asignarTareaDto, user.id);
  }

  @Post(':id/comentarios')
  @ApiOperation({ summary: 'Agregar comentario a tarea' })
  addComentario(
    @Param('id') id: string,
    @Body() addComentarioDto: AddComentarioDto,
    @CurrentUser() user: any,
  ) {
    return this.tareasService.addComentario(id, addComentarioDto, user.id);
  }

  @Get(':id/historial')
  @ApiOperation({ summary: 'Obtener historial completo de tarea (comentarios + cambios)' })
  getHistorial(@Param('id') id: string) {
    return this.tareasService.getHistorialCompleto(id);
  }
}
