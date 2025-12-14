import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RutasService } from './rutas.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Rutas')
@Controller('rutas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear nueva ruta (solo ADMIN)' })
  @ApiResponse({ status: 201, description: 'Ruta creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe una ruta con ese nombre' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  create(@Body() createRutaDto: CreateRutaDto) {
    return this.rutasService.create(createRutaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las rutas activas' })
  @ApiResponse({ status: 200, description: 'Lista de rutas' })
  findAll() {
    return this.rutasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una ruta por ID' })
  @ApiResponse({ status: 200, description: 'Ruta encontrada' })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada' })
  findOne(@Param('id') id: string) {
    return this.rutasService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar ruta (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Ruta actualizada' })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya existe una ruta con ese nombre' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  update(@Param('id') id: string, @Body() updateRutaDto: UpdateRutaDto) {
    return this.rutasService.update(id, updateRutaDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Desactivar ruta (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Ruta desactivada' })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  remove(@Param('id') id: string) {
    return this.rutasService.remove(id);
  }
}
