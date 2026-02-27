-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "MotivoMovimiento" AS ENUM ('COMPRA', 'PRODUCCION', 'MERMA', 'AJUSTE_MANUAL', 'DEVOLUCION');

-- AlterTable
ALTER TABLE "materias_primas" ADD COLUMN     "costoUnitario" DECIMAL(10,2),
ADD COLUMN     "proveedor" TEXT,
ADD COLUMN     "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" TEXT NOT NULL,
    "materiaPrimaId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "motivo" "MotivoMovimiento" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "stockResultante" DOUBLE PRECISION NOT NULL,
    "referencia" TEXT,
    "observaciones" TEXT,
    "usuarioId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "materias_primas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
