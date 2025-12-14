import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async create(createProductoDto: CreateProductoDto) {
    const { materiasPrimas, ...productoData } = createProductoDto;

    return this.prisma.producto.create({
      data: {
        ...productoData,
        materiasPrimas: {
          create: materiasPrimas?.map((mp) => ({
            materiaPrima: { connect: { id: mp.materiaPrimaId } },
            cantidadRequerida: mp.cantidadRequerida,
          })),
        },
      },
      include: {
        materiasPrimas: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.producto.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        materiasPrimas: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        materiasPrimas: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: string, updateProductoDto: UpdateProductoDto) {
    const { materiasPrimas, ...productoData } = updateProductoDto;

    // If materiasPrimas is provided, we need to handle the update logic
    // This simple approach deletes existing relations and creates new ones if materiasPrimas is present
    // A more complex approach would be to diff the lists
    
    if (materiasPrimas) {
      await this.prisma.productoMateriaPrima.deleteMany({
        where: { productoId: id },
      });
    }

    return this.prisma.producto.update({
      where: { id },
      data: {
        ...productoData,
        materiasPrimas: materiasPrimas ? {
          create: materiasPrimas.map((mp) => ({
            materiaPrima: { connect: { id: mp.materiaPrimaId } },
            cantidadRequerida: mp.cantidadRequerida,
          })),
        } : undefined,
      },
      include: {
        materiasPrimas: {
          include: {
            materiaPrima: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.producto.delete({
      where: { id },
    });
  }
}
