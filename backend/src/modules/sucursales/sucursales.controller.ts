import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Sucursales')
@Controller('sucursales')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ASISTENTE')
  @ApiOperation({ summary: 'Crear nueva sucursal (ADMIN y ASISTENTE)' })
  @ApiResponse({ status: 201, description: 'Sucursal creada exitosamente' })
  @ApiResponse({ status: 404, description: 'Cliente o ruta no encontrados' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  create(@Body() createSucursalDto: CreateSucursalDto) {
    return this.sucursalesService.create(createSucursalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las sucursales activas' })
  @ApiResponse({ status: 200, description: 'Lista de sucursales' })
  @ApiQuery({ name: 'clienteId', required: false, description: 'Filtrar por cliente' })
  @ApiQuery({ name: 'rutaId', required: false, description: 'Filtrar por ruta' })
  findAll(
    @Query('clienteId') clienteId?: string,
    @Query('rutaId') rutaId?: string,
  ) {
    if (clienteId) {
      return this.sucursalesService.findByCliente(clienteId);
    }
    if (rutaId) {
      return this.sucursalesService.findByRuta(rutaId);
    }
    return this.sucursalesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una sucursal por ID' })
  @ApiResponse({ status: 200, description: 'Sucursal encontrada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  findOne(@Param('id') id: string) {
    return this.sucursalesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ASISTENTE')
  @ApiOperation({ summary: 'Actualizar sucursal (ADMIN y ASISTENTE)' })
  @ApiResponse({ status: 200, description: 'Sucursal actualizada' })
  @ApiResponse({ status: 404, description: 'Sucursal, cliente o ruta no encontrados' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  update(
    @Param('id') id: string,
    @Body() updateSucursalDto: UpdateSucursalDto,
  ) {
    return this.sucursalesService.update(id, updateSucursalDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ASISTENTE')
  @ApiOperation({ summary: 'Desactivar sucursal (ADMIN y ASISTENTE)' })
  @ApiResponse({ status: 200, description: 'Sucursal desactivada' })
  @ApiResponse({ status: 404, description: 'Sucursal no encontrada' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  remove(@Param('id') id: string) {
    return this.sucursalesService.remove(id);
  }
}
