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
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { CreateClienteProductoDto, UpdateClienteProductoDto } from './dto/create-cliente-producto.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Clientes')
@Controller('clientes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ASISTENTE')
  @ApiOperation({ summary: 'Crear nuevo cliente (ADMIN y ASISTENTE)' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Ya existe un cliente con ese CI/RUC' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  create(@Body() createClienteDto: CreateClienteDto) {
    return this.clientesService.create(createClienteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los clientes activos' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  findAll() {
    return this.clientesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ASISTENTE')
  @ApiOperation({ summary: 'Actualizar cliente (ADMIN y ASISTENTE)' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya existe un cliente con ese CI/RUC' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  update(@Param('id') id: string, @Body() updateClienteDto: UpdateClienteDto) {
    return this.clientesService.update(id, updateClienteDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ASISTENTE')
  @ApiOperation({ summary: 'Desactivar cliente (ADMIN y ASISTENTE)' })
  @ApiResponse({ status: 200, description: 'Cliente desactivado' })
  @ApiResponse({ status: 400, description: 'Cliente tiene sucursales asociadas' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  remove(@Param('id') id: string) {
    return this.clientesService.remove(id);
  }

  // ---- Catálogo de precios por cliente ----

  @Get(':id/productos')
  @ApiOperation({ summary: 'Obtener catálogo de productos y precios de un cliente' })
  @ApiResponse({ status: 200, description: 'Lista de productos con precios por cliente' })
  getClienteProductos(@Param('id') id: string) {
    return this.clientesService.getClienteProductos(id);
  }

  @Post(':id/productos')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Asignar producto con precio a un cliente (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Producto asignado al catálogo del cliente' })
  @ApiResponse({ status: 409, description: 'El producto ya está en el catálogo' })
  addClienteProducto(@Param('id') id: string, @Body() dto: CreateClienteProductoDto) {
    return this.clientesService.addClienteProducto(id, dto);
  }

  @Patch(':id/productos/:productoId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar precio de un producto para un cliente (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Precio actualizado' })
  updateClienteProducto(
    @Param('id') id: string,
    @Param('productoId') productoId: string,
    @Body() dto: UpdateClienteProductoDto,
  ) {
    return this.clientesService.updateClienteProducto(id, productoId, dto);
  }

  @Delete(':id/productos/:productoId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar producto del catálogo de un cliente (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Producto eliminado del catálogo' })
  removeClienteProducto(@Param('id') id: string, @Param('productoId') productoId: string) {
    return this.clientesService.removeClienteProducto(id, productoId);
  }
}
