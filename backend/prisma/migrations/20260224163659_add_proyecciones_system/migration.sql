/*
  Warnings:

  - A unique constraint covering the columns `[proyeccionId]` on the table `tareas` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrigenProyeccion" AS ENUM ('MANUAL', 'AUTOMATICA');

-- CreateEnum
CREATE TYPE "EstadoProyeccion" AS ENUM ('BORRADOR', 'PENDIENTE', 'EN_PRODUCCION', 'CUADRADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "tareas" ADD COLUMN     "proyeccionId" TEXT;

-- CreateTable
CREATE TABLE "proyecciones" (
    "id" TEXT NOT NULL,
    "fechaProduccion" TIMESTAMP(3) NOT NULL,
    "detalles" JSONB NOT NULL,
    "origen" "OrigenProyeccion" NOT NULL,
    "estado" "EstadoProyeccion" NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuadres_proyeccion" (
    "id" TEXT NOT NULL,
    "proyeccionId" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "observaciones" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuadres_proyeccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cuadres_proyeccion_proyeccionId_pedidoId_key" ON "cuadres_proyeccion"("proyeccionId", "pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "tareas_proyeccionId_key" ON "tareas"("proyeccionId");

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_proyeccionId_fkey" FOREIGN KEY ("proyeccionId") REFERENCES "proyecciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecciones" ADD CONSTRAINT "proyecciones_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuadres_proyeccion" ADD CONSTRAINT "cuadres_proyeccion_proyeccionId_fkey" FOREIGN KEY ("proyeccionId") REFERENCES "proyecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuadres_proyeccion" ADD CONSTRAINT "cuadres_proyeccion_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
