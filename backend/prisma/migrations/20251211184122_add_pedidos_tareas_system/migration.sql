/*
  Warnings:

  - The `tipo` column on the `comentarios_tareas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `fechaEntrega` on the `pedidos` table. All the data in the column will be lost.
  - Added the required column `fechaProduccion` to the `pedidos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TipoComentario" AS ENUM ('GENERAL', 'ESPERA', 'PROBLEMA');

-- AlterTable
ALTER TABLE "comentarios_tareas" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoComentario" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "pedidos" DROP COLUMN "fechaEntrega",
ADD COLUMN     "fechaProduccion" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fueraDeHorario" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "observaciones" TEXT;
