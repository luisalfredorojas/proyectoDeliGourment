-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "esProyeccion" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "stockDisponible" DOUBLE PRECISION NOT NULL DEFAULT 0;
