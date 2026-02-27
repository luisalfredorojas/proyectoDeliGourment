/*
  Warnings:

  - The values [ENTREGADO_LOGISTICA] on the enum `TareaEstado` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "EstadoProductoEnTarea" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'LISTO', 'EN_LOGISTICA', 'ENTREGADO');

-- AlterEnum
BEGIN;
CREATE TYPE "TareaEstado_new" AS ENUM ('ABIERTO', 'EN_PROCESO', 'EN_ESPERA', 'EMBALAJE', 'LOGISTICA', 'ENTREGADO', 'CANCELADO');
ALTER TABLE "tareas" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "tareas" ALTER COLUMN "estado" TYPE "TareaEstado_new" USING ("estado"::text::"TareaEstado_new");
ALTER TABLE "historial_estados" ALTER COLUMN "estadoAnterior" TYPE "TareaEstado_new" USING ("estadoAnterior"::text::"TareaEstado_new");
ALTER TABLE "historial_estados" ALTER COLUMN "estadoNuevo" TYPE "TareaEstado_new" USING ("estadoNuevo"::text::"TareaEstado_new");
ALTER TYPE "TareaEstado" RENAME TO "TareaEstado_old";
ALTER TYPE "TareaEstado_new" RENAME TO "TareaEstado";
DROP TYPE "TareaEstado_old";
ALTER TABLE "tareas" ALTER COLUMN "estado" SET DEFAULT 'ABIERTO';
COMMIT;

-- CreateTable
CREATE TABLE "tarea_producto_estados" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "productoNombre" TEXT NOT NULL,
    "productoId" TEXT,
    "cantidad" INTEGER NOT NULL,
    "estado" "EstadoProductoEnTarea" NOT NULL DEFAULT 'PENDIENTE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarea_producto_estados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tarea_producto_estados_tareaId_productoNombre_key" ON "tarea_producto_estados"("tareaId", "productoNombre");

-- AddForeignKey
ALTER TABLE "tarea_producto_estados" ADD CONSTRAINT "tarea_producto_estados_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tareas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_producto_estados" ADD CONSTRAINT "tarea_producto_estados_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
