/*
  Warnings:

  - You are about to drop the column `nombre` on the `clientes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ruc]` on the table `clientes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `direccion` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `razonSocial` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruc` to the `clientes` table without a default value. This is not possible if the table is not empty.
  - Made the column `rutaId` on table `sucursales` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "sucursales" DROP CONSTRAINT "sucursales_rutaId_fkey";

-- AlterTable
ALTER TABLE "clientes" DROP COLUMN "nombre",
ADD COLUMN     "ciudad" TEXT,
ADD COLUMN     "direccion" TEXT NOT NULL,
ADD COLUMN     "razonSocial" TEXT NOT NULL,
ADD COLUMN     "ruc" TEXT NOT NULL,
ADD COLUMN     "ubicacion" TEXT;

-- AlterTable
ALTER TABLE "sucursales" ALTER COLUMN "rutaId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_ruc_key" ON "clientes"("ruc");

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
