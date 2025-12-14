import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RutasModule } from './modules/rutas/rutas.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { TareasModule } from './modules/tareas/tareas.module';

import { MateriasPrimasModule } from './modules/materias-primas/materias-primas.module';
import { ProductosModule } from './modules/productos/productos.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    RutasModule,
    ClientesModule,
    SucursalesModule,
    PedidosModule,
    TareasModule,
    MateriasPrimasModule,
    ProductosModule,
    UsersModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
