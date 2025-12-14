# Bakery Management System - DeliGourmet

Sistema de gestión de pedidos y producción para panadería que trabaja bajo pedido.

## 🎯 Descripción

Aplicación web diseñada para mejorar la visualización de pedidos para el departamento de producción, asistente y gerencia. Permite la gestión completa del flujo de órdenes desde la recepción hasta la entrega a logística.

## 🚀 Características Principales

- **Gestión de Pedidos**: Recepción y creación de tareas basadas en pedidos
- **Flujo de Estados**: ABIERTO → EN PROCESO → EN ESPERA → EMBALAJE → ENTREGADO
- **Dashboard de Indicadores**: Ventas diarias, consignaciones, cumplimiento de tareas
- **Gestión de Clientes**: Múltiples sucursales por cliente con rutas asignadas
- **Control de Horarios**: Corte de pedidos a las 11:30 AM
- **Roles de Usuario**: Administrador, Asistente, Producción
- **Reportes**: Generación de PDFs y exportación a Excel
- **Etiquetas**: Impresión de etiquetas para embalaje

## 🛠️ Stack Tecnológico

### Frontend
- React 18 + TypeScript
- Vite
- Material-UI (MUI)
- React Router v6
- Axios
- React Hook Form + Zod
- Recharts

### Backend
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL 15
- JWT Authentication
- Nodemailer

### DevOps
- Docker & Docker Compose
- Git & GitHub

## 📁 Estructura del Proyecto

```
proyectoDeliGourment/
├── frontend/          # Aplicación React
├── backend/           # API NestJS
└── docker-compose.yml # Servicios (PostgreSQL, Redis)
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ y npm
- Docker y Docker Compose
- Git

### Instalación

#### ⚙️ Requisitos Previos

Antes de empezar, asegúrate de tener instalado:
- **Node.js 18+** y npm
- **Docker Desktop** (debe estar corriendo)
- **Git**

#### 🚀 Opción 1: Script de inicio rápido (Recomendado)

**Paso 1: Verificar que Docker está corriendo**
```bash
docker --version
docker ps  # Debe mostrar una tabla (puede estar vacía)
```

**Paso 2: Clonar e iniciar**
```bash
git clone git@github.com:luisalfredorojas/proyectoDeliGourment.git
cd proyectoDeliGourment
./start-dev.sh
```

El script automáticamente:
- ✅ Inicia PostgreSQL y Redis en Docker
- ✅ Ejecuta las migraciones de base de datos
- ✅ Crea el usuario administrador inicial
- ✅ Inicia el backend en http://localhost:3000
- ✅ Inicia el frontend en http://localhost:5173

**Credenciales de acceso:**
- **Email:** `admin@deligourmet.com`
- **Password:** `Admin123!`

---

#### 🔧 Opción 2: Instalación Manual Paso a Paso

**Paso 1: Clonar el repositorio**
```bash
git clone git@github.com:luisalfredorojas/proyectoDeliGourment.git
cd proyectoDeliGourment
```

**Paso 2: Iniciar Docker y la base de datos**
```bash
# Verificar que Docker está corriendo
docker ps

# Iniciar PostgreSQL y Redis
docker-compose up -d

# Verificar que los contenedores están corriendo
docker ps
# Deberías ver: deli-gourmet-db y deli-gourmet-redis
```

**Paso 3: Configurar el backend**
```bash
cd backend

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones (SOLO LA PRIMERA VEZ)
npx prisma migrate dev --name init

# Crear usuario administrador inicial
npm run seed

# Iniciar servidor de desarrollo
npm run start:dev
```

**Paso 4: Configurar el frontend** (en otra terminal)
```bash
cd frontend

# Copiar variables de entorno
cp .env.example .env

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Paso 5: Acceder a la aplicación**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs
- Prisma Studio: `cd backend && npx prisma studio`

---

#### 🆘 Solución de Problemas

**Error: "Can't reach database server"**
```bash
# Reiniciar Docker
docker-compose down
docker-compose up -d
sleep 10  # Esperar a que la BD esté lista
cd backend && npx prisma migrate dev --name init
```

**Error: "Port 3000 already in use"**
```bash
# Detener proceso en puerto 3000
lsof -ti:3000 | xargs kill -9

# O reiniciar el backend
cd backend && npm run start:dev
```

**Error: "Port 5173 already in use"**
```bash
# Detener proceso en puerto 5173
lsof -ti:5173 | xargs kill -9

# O reiniciar el frontend
cd frontend && npm run dev
```

**Limpiar todo y empezar de cero**
```bash
# Detener todos los servicios
docker-compose down
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Borrar la base de datos (CUIDADO: borra todos los datos)
docker-compose down -v

# Volver a iniciar desde el Paso 2
```

---

#### 🔄 Comandos Útiles

```bash
# Ver logs de Docker
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f postgres

# Detener Docker sin borrar datos
docker-compose down

# Detener Docker y borrar volúmenes (datos)
docker-compose down -v

# Acceder a Prisma Studio (interfaz visual de BD)
cd backend && npx prisma studio

# Ver migraciones aplicadas
cd backend && npx prisma migrate status

# Ejecutar seed de nuevo (crear usuario admin)
cd backend && npm run seed
```
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/api

## 👥 Roles de Usuario

- **Administrador**: Acceso completo, visualización de indicadores, gestión de usuarios
- **Asistente**: Recepción de pedidos, creación de tareas
- **Producción**: Visualización y actualización de tareas en proceso

## 📦 Funcionalidades Futuras

- [ ] Integración con Bot de Telegram
- [ ] Notificaciones automáticas por email
- [ ] Reportes avanzados
- [ ] Gestión de inventario

## 📄 Licencia

Proyecto privado - DeliGourmet

## 👨‍💻 Desarrollado por

Luis Alfredo Rojas
