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
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Pedidos')
@Controller('pedidos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ASISTENTE', 'ADMIN')
  @ApiOperation({ summary: 'Crear nuevo pedido (ASISTENTE o ADMIN)' })
  @ApiResponse({ status: 201, description: 'Pedido creado y tarea auto-generada' })
  @ApiResponse({
    status: 400,
    description: 'Error de validación',
  })
  create(@Body() createPedidoDto: CreatePedidoDto, @CurrentUser() user: any) {
    return this.pedidosService.create(createPedidoDto, user.id, user.rol);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos con filtros' })
  @ApiQuery({ name: 'sucursalId', required: false })
  @ApiQuery({ name: 'rutaId', required: false })
  @ApiQuery({ name: 'fecha', required: false, description: 'YYYY-MM-DD' })
  findAll(
    @Query('sucursalId') sucursalId?: string,
    @Query('rutaId') rutaId?: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.pedidosService.findAll({ sucursalId, rutaId, fecha });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido por ID' })
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar pedido (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Pedido actualizado' })
  @ApiResponse({
    status: 403,
    description: 'Fuera de ventana de tiempo para modificar',
  })
  update(
    @Param('id') id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
    @CurrentUser() user: any,
  ) {
    const isAdmin = user.rol === 'ADMIN';
    return this.pedidosService.update(id, updatePedidoDto, user.id, isAdmin);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar pedido (solo ADMIN y si tarea está ABIERTA)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    const isAdmin = user.rol === 'ADMIN';
    return this.pedidosService.remove(id, isAdmin);
  }
}
