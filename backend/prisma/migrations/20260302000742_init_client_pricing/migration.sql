-- CreateTable
CREATE TABLE "clientes_productos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "clientes_productos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_productos_clienteId_productoId_key" ON "clientes_productos"("clienteId", "productoId");

-- AddForeignKey
ALTER TABLE "clientes_productos" ADD CONSTRAINT "clientes_productos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes_productos" ADD CONSTRAINT "clientes_productos_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
