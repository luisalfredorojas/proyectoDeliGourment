import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoMovimiento, MotivoMovimiento, EstadoProductoEnTarea } from '@prisma/client';
import { RegistrarMovimientoDto, UpdateMateriaPrimaDto } from './dto/inventario.dto';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  // ========== Materias Primas ==========

  async findAllMateriasPrimas() {
    return this.prisma.materiaPrima.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { movimientos: true, productos: true },
        },
      },
    });
  }

  async findOneMateriaPrima(id: string) {
    const mp = await this.prisma.materiaPrima.findUnique({
      where: { id },
      include: {
        productos: {
          include: {
            producto: { select: { id: true, nombre: true } },
          },
        },
        movimientos: {
          orderBy: { fecha: 'desc' },
          take: 20,
          include: {
            usuario: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    if (!mp) {
      throw new NotFoundException('Materia prima no encontrada');
    }

    return mp;
  }

  async updateMateriaPrima(id: string, dto: UpdateMateriaPrimaDto) {
    await this.findOneMateriaPrima(id);

    return this.prisma.materiaPrima.update({
      where: { id },
      data: dto,
    });
  }

  // ========== Movimientos de Inventario ==========

  /**
   * Registrar un movimiento de inventario manual (compra, ajuste, merma).
   */
  async registrarMovimiento(dto: RegistrarMovimientoDto, userId: string) {
    if (!dto.materiaPrimaId && !dto.productoId) {
      throw new BadRequestException('Debe indicar una materia prima o un producto');
    }

    let nuevoStock = 0;
    let cantidadAjuste: number;

    if (dto.tipo === TipoMovimiento.ENTRADA) {
      cantidadAjuste = dto.cantidad;
    } else if (dto.tipo === TipoMovimiento.SALIDA) {
      cantidadAjuste = -dto.cantidad;
    } else {
      cantidadAjuste = dto.cantidad;
    }

    // If it's a materia prima movement, update stock
    if (dto.materiaPrimaId) {
      const materiaPrima = await this.prisma.materiaPrima.findUnique({
        where: { id: dto.materiaPrimaId },
      });
      if (!materiaPrima) {
        throw new NotFoundException('Materia prima no encontrada');
      }
      nuevoStock = materiaPrima.cantidadDisponible + cantidadAjuste;
      if (nuevoStock < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${materiaPrima.cantidadDisponible} ${materiaPrima.unidadMedida}`,
        );
      }
    }

    // If it's a product movement, update product stock
    if (dto.productoId) {
      const producto = await this.prisma.producto.findUnique({
        where: { id: dto.productoId },
      });
      if (!producto) {
        throw new NotFoundException('Producto no encontrado');
      }
      nuevoStock = producto.stockDisponible + cantidadAjuste;
      if (nuevoStock < 0) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${producto.stockDisponible}`,
        );
      }
    }

    // Transaction: create movement + update stock (if materia prima)
    const operations: any[] = [
      this.prisma.movimientoInventario.create({
        data: {
          materiaPrimaId: dto.materiaPrimaId || null,
          productoId: dto.productoId || null,
          tipo: dto.tipo,
          motivo: dto.motivo,
          cantidad: cantidadAjuste,
          stockResultante: nuevoStock,
          referencia: dto.referencia,
          observaciones: dto.observaciones,
          usuarioId: userId,
        },
        include: {
          materiaPrima: { select: { nombre: true, unidadMedida: true } },
          producto: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true } },
        },
      }),
    ];

    if (dto.materiaPrimaId) {
      operations.push(
        this.prisma.materiaPrima.update({
          where: { id: dto.materiaPrimaId },
          data: { cantidadDisponible: nuevoStock },
        }),
      );
    }

    if (dto.productoId) {
      operations.push(
        this.prisma.producto.update({
          where: { id: dto.productoId },
          data: { stockDisponible: nuevoStock },
        }),
      );
    }

    const [movimiento] = await this.prisma.$transaction(operations);
    return movimiento;
  }

  /**
   * Get movement history for a specific materia prima.
   */
  async getMovimientos(materiaPrimaId: string, limit = 50) {
    return this.prisma.movimientoInventario.findMany({
      where: { materiaPrimaId },
      orderBy: { fecha: 'desc' },
      take: limit,
      include: {
        materiaPrima: { select: { nombre: true, unidadMedida: true } },
        usuario: { select: { id: true, nombre: true } },
      },
    });
  }

  /**
   * Get all movements across all materias primas and productos.
   */
  async getAllMovimientos(limit = 100) {
    return this.prisma.movimientoInventario.findMany({
      orderBy: { fecha: 'desc' },
      take: limit,
      include: {
        materiaPrima: { select: { id: true, nombre: true, unidadMedida: true } },
        producto: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true } },
      },
    });
  }

  /**
   * Get materias primas with stock below their minimum threshold.
   */
  async getAlertasStockBajo() {
    const materiasPrimas = await this.prisma.materiaPrima.findMany({
      where: {
        stockMinimo: { gt: 0 },
      },
      orderBy: { nombre: 'asc' },
    });

    return materiasPrimas
      .filter((mp) => mp.cantidadDisponible <= mp.stockMinimo)
      .map((mp) => ({
        ...mp,
        deficit: mp.stockMinimo - mp.cantidadDisponible,
        porcentajeStock: mp.stockMinimo > 0
          ? Math.round((mp.cantidadDisponible / mp.stockMinimo) * 100)
          : 100,
      }));
  }

  // ========== Automatic stock deduction ==========

  /**
   * Deduct raw materials when a product moves to EN_LOGISTICA.
   * Called from tareas.service when a product state changes to EN_LOGISTICA.
   */
  async deducirMateriaPrimaPorProducto(
    productoNombre: string,
    cantidad: number,
    tareaId: string,
    userId: string,
  ) {
    // Find product by name to get its recipe (materias primas)
    const producto = await this.prisma.producto.findFirst({
      where: { nombre: productoNombre },
      include: {
        materiasPrimas: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });

    if (!producto || producto.materiasPrimas.length === 0) {
      // No recipe found — skip silently (product may not have a recipe yet)
      return [];
    }

    const movimientos = [];

    for (const pm of producto.materiasPrimas) {
      const cantidadRequerida = pm.cantidadRequerida * cantidad;
      const mp = pm.materiaPrima;

      const nuevoStock = mp.cantidadDisponible - cantidadRequerida;

      try {
        const [movimiento] = await this.prisma.$transaction([
          this.prisma.movimientoInventario.create({
            data: {
              materiaPrimaId: mp.id,
              tipo: TipoMovimiento.SALIDA,
              motivo: MotivoMovimiento.PRODUCCION,
              cantidad: -cantidadRequerida,
              stockResultante: Math.max(0, nuevoStock),
              referencia: `Tarea #${tareaId.slice(-6)} - ${productoNombre} x${cantidad}`,
              usuarioId: userId,
            },
          }),
          this.prisma.materiaPrima.update({
            where: { id: mp.id },
            data: { cantidadDisponible: Math.max(0, nuevoStock) },
          }),
        ]);

        movimientos.push(movimiento);
      } catch (error) {
        console.error(`Error deducting ${mp.nombre} for ${productoNombre}:`, error);
      }
    }

    return movimientos;
  }

  // ========== Product Stock Management ==========

  /**
   * Add product to inventory (when projection order is ENTREGADO).
   */
  async sumarProductoAlInventario(
    productoNombre: string,
    cantidad: number,
    tareaId: string,
    userId: string,
  ) {
    const producto = await this.prisma.producto.findFirst({
      where: { nombre: productoNombre },
    });
    if (!producto) return null;

    const nuevoStock = producto.stockDisponible + cantidad;

    const [movimiento] = await this.prisma.$transaction([
      this.prisma.movimientoInventario.create({
        data: {
          productoId: producto.id,
          tipo: TipoMovimiento.ENTRADA,
          motivo: MotivoMovimiento.PRODUCCION,
          cantidad: cantidad,
          stockResultante: nuevoStock,
          referencia: `Proyección - Tarea #${tareaId.slice(-6)} - ${productoNombre} x${cantidad}`,
          usuarioId: userId,
        },
      }),
      this.prisma.producto.update({
        where: { id: producto.id },
        data: { stockDisponible: nuevoStock },
      }),
    ]);

    return movimiento;
  }

  /**
   * Subtract product from inventory (when normal order reaches EN_LOGISTICA).
   */
  async deducirProductoDelInventario(
    productoNombre: string,
    cantidad: number,
    tareaId: string,
    userId: string,
  ) {
    const producto = await this.prisma.producto.findFirst({
      where: { nombre: productoNombre },
    });
    if (!producto) return null;

    const nuevoStock = Math.max(0, producto.stockDisponible - cantidad);

    const [movimiento] = await this.prisma.$transaction([
      this.prisma.movimientoInventario.create({
        data: {
          productoId: producto.id,
          tipo: TipoMovimiento.SALIDA,
          motivo: MotivoMovimiento.PRODUCCION,
          cantidad: -cantidad,
          stockResultante: nuevoStock,
          referencia: `Entrega - Tarea #${tareaId.slice(-6)} - ${productoNombre} x${cantidad}`,
          usuarioId: userId,
        },
      }),
      this.prisma.producto.update({
        where: { id: producto.id },
        data: { stockDisponible: nuevoStock },
      }),
    ]);

    return movimiento;
  }

  /**
   * Register MERMA for products returned from a consignación.
   * The returned products cannot be sold again (used internally only).
   * This creates an informational MERMA record WITHOUT modifying stockDisponible.
   */
  async registrarMermaConsignacion(
    productoNombre: string,
    cantidad: number,
    tareaId: string,
    userId: string,
  ) {
    const producto = await this.prisma.producto.findFirst({
      where: { nombre: productoNombre },
    });
    if (!producto) {
      console.warn(`⚠️ Producto "${productoNombre}" no encontrado para MERMA`);
      return null;
    }

    // Record as MERMA — does NOT update stockDisponible (not sellable stock)
    return this.prisma.movimientoInventario.create({
      data: {
        productoId: producto.id,
        tipo: TipoMovimiento.ENTRADA,
        motivo: MotivoMovimiento.MERMA,
        cantidad: cantidad,
        stockResultante: producto.stockDisponible, // unchanged
        referencia: `Merma consignación - Tarea #${tareaId.slice(-6)} - ${productoNombre} x${cantidad}`,
        usuarioId: userId,
      },
    });
  }

  /**
   * Subtract product from inventory for consignación replenishment (products going out to client).
   */
  async deducirProductoPorConsignacion(
    productoNombre: string,
    cantidad: number,
    tareaId: string,
    userId: string,
  ) {
    const producto = await this.prisma.producto.findFirst({
      where: { nombre: productoNombre },
    });
    if (!producto) return null;

    const nuevoStock = Math.max(0, producto.stockDisponible - cantidad);

    const [movimiento] = await this.prisma.$transaction([
      this.prisma.movimientoInventario.create({
        data: {
          productoId: producto.id,
          tipo: TipoMovimiento.SALIDA,
          motivo: MotivoMovimiento.PRODUCCION,
          cantidad: -cantidad,
          stockResultante: nuevoStock,
          referencia: `Consignación - Tarea #${tareaId.slice(-6)} - ${productoNombre} x${cantidad}`,
          usuarioId: userId,
        },
      }),
      this.prisma.producto.update({
        where: { id: producto.id },
        data: { stockDisponible: nuevoStock },
      }),
    ]);

    return movimiento;
  }

  /**
   * Get all products with their stock levels and MERMA totals.
   */
  async getStockProductos() {
    const [productos, mermaTotals] = await Promise.all([
      this.prisma.producto.findMany({
        orderBy: { nombre: 'asc' },
        select: {
          id: true,
          nombre: true,
          precio: true,
          stockDisponible: true,
          _count: { select: { movimientosInventario: true } },
        },
      }),
      this.prisma.movimientoInventario.groupBy({
        by: ['productoId'],
        where: { motivo: MotivoMovimiento.MERMA, productoId: { not: null } },
        _sum: { cantidad: true },
      }),
    ]);

    const mermaMap = new Map(
      mermaTotals.map((m) => [m.productoId, m._sum.cantidad || 0]),
    );

    return productos.map((p) => ({
      ...p,
      mermaTotal: mermaMap.get(p.id) || 0,
    }));
  }

  /**
   * Cuadre de stock: compara stockDisponible actual vs stock calculado
   * a partir del historial de pedidos ENTREGADOS.
   */
  async getCuadreStock() {
    const rows = await this.prisma.$queryRaw<any[]>`
      WITH adds AS (
        SELECT item->>'producto' AS nombre, SUM((item->>'cantidad')::int) AS qty
        FROM "pedidos" p
        JOIN "tareas" t ON t."pedidoId" = p.id AND t.estado = 'ENTREGADO'
        JOIN LATERAL jsonb_array_elements(p.detalles::jsonb) AS item ON TRUE
        WHERE p."esProyeccion" = TRUE AND p.detalles IS NOT NULL
        GROUP BY 1
      ),
      subs AS (
        SELECT item->>'producto' AS nombre, SUM((item->>'cantidad')::int) AS qty
        FROM "pedidos" p
        JOIN "tareas" t ON t."pedidoId" = p.id AND t.estado = 'ENTREGADO'
        JOIN LATERAL jsonb_array_elements(p.detalles::jsonb) AS item ON TRUE
        WHERE p."esProyeccion" = FALSE AND p."soloConsignaciones" = FALSE AND p.detalles IS NOT NULL
        GROUP BY 1
      ),
      consig_subs AS (
        SELECT item->>'producto' AS nombre, SUM((item->>'cantidad')::int) AS qty
        FROM "pedidos" p
        JOIN "tareas" t ON t."pedidoId" = p.id AND t.estado = 'ENTREGADO'
        JOIN LATERAL jsonb_array_elements(p.consignaciones::jsonb) AS item ON TRUE
        WHERE p."esProyeccion" = FALSE
          AND p.consignaciones IS NOT NULL
          AND jsonb_array_length(p.consignaciones::jsonb) > 0
        GROUP BY 1
      )
      SELECT
        pr.nombre,
        pr."stockDisponible"                                              AS stock_actual,
        COALESCE(a.qty, 0)                                                AS total_entradas,
        COALESCE(s.qty, 0)                                                AS total_salidas,
        COALESCE(c.qty, 0)                                                AS total_consig,
        GREATEST(0,
          COALESCE(a.qty, 0) - COALESCE(s.qty, 0) - COALESCE(c.qty, 0)
        )                                                                 AS stock_calculado,
        pr."stockDisponible" - GREATEST(0,
          COALESCE(a.qty, 0) - COALESCE(s.qty, 0) - COALESCE(c.qty, 0)
        )                                                                 AS diferencia
      FROM "productos" pr
      LEFT JOIN adds         a ON a.nombre = pr.nombre
      LEFT JOIN subs         s ON s.nombre = pr.nombre
      LEFT JOIN consig_subs  c ON c.nombre = pr.nombre
      WHERE (COALESCE(a.qty,0) + COALESCE(s.qty,0) + COALESCE(c.qty,0)) > 0
      ORDER BY pr.nombre
    `;

    return rows.map((r) => ({
      nombre: r.nombre,
      stock_actual: Number(r.stock_actual),
      total_entradas: Number(r.total_entradas),
      total_salidas: Number(r.total_salidas),
      total_consig: Number(r.total_consig),
      stock_calculado: Number(r.stock_calculado),
      diferencia: Number(r.diferencia),
      cuadrado: Number(r.diferencia) === 0,
    }));
  }

  /**
   * Dashboard summary for inventory.
   */
  async getResumenInventario() {
    const [materiasPrimas, alertas, totalMovimientos, totalProductos] = await Promise.all([
      this.prisma.materiaPrima.count(),
      this.getAlertasStockBajo(),
      this.prisma.movimientoInventario.count(),
      this.prisma.producto.count(),
    ]);

    return {
      totalMateriasPrimas: materiasPrimas,
      alertasStockBajo: alertas.length,
      totalMovimientos,
      totalProductos,
      alertas,
    };
  }
}
