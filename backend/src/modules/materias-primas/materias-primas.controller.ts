import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MateriasPrimasService } from './materias-primas.service';
import { CreateMateriaPrimaDto } from './dto/create-materia-prima.dto';
import { UpdateMateriaPrimaDto } from './dto/update-materia-prima.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('materias-primas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MateriasPrimasController {
  constructor(private readonly materiasPrimasService: MateriasPrimasService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PRODUCCION)
  create(@Body() createMateriaPrimaDto: CreateMateriaPrimaDto) {
    return this.materiasPrimasService.create(createMateriaPrimaDto);
  }

  @Get()
  findAll() {
    return this.materiasPrimasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materiasPrimasService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PRODUCCION)
  update(@Param('id') id: string, @Body() updateMateriaPrimaDto: UpdateMateriaPrimaDto) {
    return this.materiasPrimasService.update(id, updateMateriaPrimaDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.materiasPrimasService.remove(id);
  }
}
