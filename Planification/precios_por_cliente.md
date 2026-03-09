# Contexto Corporativo: Precios por Cliente
Migrar sistema de precios base por `Producto` a precios configurables por `Cliente`.
**Reglas críticas:**
1. Administradores configuran qué productos y a qué precio puede comprar cada cliente.
2. Asistentes solo ven los productos permitidos para el cliente en turno durante el pedido. No pueden editar precios.
3. El JSON `detalles` del `Pedido` debe mantener su estructura actual para salvaguardar el precio unitario histórico de la venta.

---

# Tareas de Ejecución (Claude Code Checklist)

## Fase 1: Base de Datos (`backend/prisma/schema.prisma`)
- [ ] Crea el modelo `ClienteProducto`: `id (uuid)`, `clienteId`, `productoId`, `precio (Decimal 10,2)`.
- [ ] Añade relaciones con `Cliente` y `Producto` (`onDelete: Cascade`). Añade `@@unique([clienteId, productoId])` y mapea a `clientes_productos`.
- [ ] Agrega las referencias inversas en los modelos `Cliente` y `Producto`.
- [ ] Ejecuta `npx prisma migrate dev --name init_client_pricing` y `npx prisma generate`.

## Fase 2: Backend API (`backend/src/modules/`)
- [ ] **Clientes**: Implementa CRUD de `ClienteProducto` en el controller y service de clientes (protegido para ADMIN).
  - `GET /clientes/:id/productos`
  - `POST /clientes/:id/productos` (asignar producto + precio)
  - `PATCH /clientes/:id/productos/:productoId` (actualizar precio)
  - `DELETE /clientes/:id/productos/:productoId`
- [ ] **Pedidos (`pedidos.service.ts`)**: Modifica la creación del pedido. Ignora el precio enviado por el frontend. Para cada ítem del detalle, consulta su precio en la tabla `ClienteProducto` usando la combinación `(sucursal.clienteId, detalle.productoId)`. Calcula el `montoTotal` con esos valores del backend y guárdalos en el JSON `detalles`.

## Fase 3: Frontend Admin (`frontend/src/pages/Clientes/ClienteDetalle.tsx`)
- [ ] Agrega la pestaña "Catálogo y Precios".
- [ ] Muestra una tabla con los productos configurados haciendo fetch a `GET /clientes/:id/productos`.
- [ ] Implementa un Modal para asignar productos (Autocomplete con todos los productos de BD) y fijar su precio (input numérico). Conecta con POST/PATCH/DELETE.

## Fase 4: Frontend Pedidos (`frontend/src/pages/Pedidos/PedidoForm.tsx`)
- [ ] Al cambiar el campo `Sucursal`, extrae su `clienteId` y haz fetch del catálogo de precios del cliente.
- [ ] En los _Detalles del Pedido_, restringe las opciones del `Autocomplete` de productos a la lista recién obtenida.
- [ ] Haz que el `precioUnitario` se llene automáticamente al elegir el producto, y oculta o bloquea (disabled/readonly) este campo para que el usuario no pueda editarlo. El sistema seguirá calculando los subtotales visuales correctamente.
