import {
  Controller,
  Get,
  Patch,
  Post,
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
import { InventarioService } from './inventario.service';
import { RegistrarMovimientoDto, UpdateMateriaPrimaDto } from './dto/inventario.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventario')
@Controller('inventario')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  // ========== Materias Primas ==========

  @Get('materias-primas')
  @ApiOperation({ summary: 'Listar todas las materias primas con conteo de movimientos' })
  findAllMateriasPrimas() {
    return this.inventarioService.findAllMateriasPrimas();
  }

  @Get('materias-primas/:id')
  @ApiOperation({ summary: 'Detalle de materia prima con últimos movimientos y productos' })
  findOneMateriaPrima(@Param('id') id: string) {
    return this.inventarioService.findOneMateriaPrima(id);
  }

  @Patch('materias-primas/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar materia prima (stock mínimo, costo, proveedor)' })
  updateMateriaPrima(
    @Param('id') id: string,
    @Body() dto: UpdateMateriaPrimaDto,
  ) {
    return this.inventarioService.updateMateriaPrima(id, dto);
  }

  // ========== Movimientos ==========

  @Post('movimientos')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Registrar movimiento de inventario (compra, ajuste, merma)' })
  @ApiResponse({ status: 201, description: 'Movimiento registrado y stock actualizado' })
  registrarMovimiento(
    @Body() dto: RegistrarMovimientoDto,
    @CurrentUser() user: any,
  ) {
    return this.inventarioService.registrarMovimiento(dto, user.id);
  }

  @Get('movimientos')
  @ApiOperation({ summary: 'Listar todos los movimientos de inventario' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  getAllMovimientos(@Query('limit') limit?: number, @Query('skip') skip?: number) {
    return this.inventarioService.getAllMovimientos(limit ? Number(limit) : 100, skip ? Number(skip) : 0);
  }

  @Get('movimientos/:materiaPrimaId')
  @ApiOperation({ summary: 'Movimientos de una materia prima específica' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMovimientos(
    @Param('materiaPrimaId') materiaPrimaId: string,
    @Query('limit') limit?: number,
  ) {
    return this.inventarioService.getMovimientos(materiaPrimaId, limit ? Number(limit) : 50);
  }

  // ========== Alertas y Resumen ==========

  @Get('alertas')
  @ApiOperation({ summary: 'Materias primas con stock bajo (debajo del mínimo)' })
  getAlertasStockBajo() {
    return this.inventarioService.getAlertasStockBajo();
  }

  @Get('stock-productos')
  @ApiOperation({ summary: 'Stock de todos los productos terminados' })
  getStockProductos() {
    return this.inventarioService.getStockProductos();
  }

  @Get('cuadre-stock')
  @ApiOperation({ summary: 'Cuadre de stock: stock actual vs calculado por historial ENTREGADO' })
  getCuadreStock() {
    return this.inventarioService.getCuadreStock();
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Resumen general del inventario' })
  getResumen() {
    return this.inventarioService.getResumenInventario();
  }
}
