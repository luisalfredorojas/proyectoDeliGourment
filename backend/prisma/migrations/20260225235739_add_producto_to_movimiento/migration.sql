-- AlterTable
ALTER TABLE "movimientos_inventario" ADD COLUMN     "productoId" TEXT,
ALTER COLUMN "materiaPrimaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
