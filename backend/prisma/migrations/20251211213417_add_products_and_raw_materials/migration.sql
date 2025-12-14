-- CreateTable
CREATE TABLE "materias_primas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidadDisponible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidadMedida" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materias_primas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos_materias_primas" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "materiaPrimaId" TEXT NOT NULL,
    "cantidadRequerida" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "productos_materias_primas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materias_primas_nombre_key" ON "materias_primas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_nombre_key" ON "productos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_materias_primas_productoId_materiaPrimaId_key" ON "productos_materias_primas"("productoId", "materiaPrimaId");

-- AddForeignKey
ALTER TABLE "productos_materias_primas" ADD CONSTRAINT "productos_materias_primas_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos_materias_primas" ADD CONSTRAINT "productos_materias_primas_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "materias_primas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
