import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, Button, Tab, Tabs, Table, TableHead,
  TableRow, TableCell, TableBody, IconButton, Chip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete,
  Alert,
} from '@mui/material';
import {
  ArrowBack, Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { clientesService } from '../../services/clientesService';
import { productosService, Producto } from '../../services/productosService';
import { Cliente, ClienteProducto } from '../../types/entities';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';

const ClienteDetalle: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.rol === UserRole.ADMIN;

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [catalogo, setCatalogo] = useState<ClienteProducto[]>([]);
  const [todosProductos, setTodosProductos] = useState<Producto[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClienteProducto | null>(null);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [precio, setPrecio] = useState<string>('');
  const [savingModal, setSavingModal] = useState(false);

  // Delete confirm
  const [deleteItem, setDeleteItem] = useState<ClienteProducto | null>(null);

  useEffect(() => {
    if (id) loadAll(id);
  }, [id]);

  const loadAll = async (clienteId: string) => {
    try {
      setLoading(true);
      const [clienteData, catalogoData, productosData] = await Promise.all([
        clientesService.getCliente(clienteId),
        clientesService.getClienteProductos(clienteId),
        productosService.getProductos(),
      ]);
      setCliente(clienteData);
      setCatalogo(catalogoData);
      setTodosProductos(productosData);
    } catch {
      toast.error('Error al cargar datos del cliente');
      navigate('/clientes');
    } finally {
      setLoading(false);
    }
  };

  const reloadCatalogo = async () => {
    if (!id) return;
    const data = await clientesService.getClienteProductos(id);
    setCatalogo(data);
  };

  // Products not yet in catalog (for adding new)
  const productosSinAsignar = todosProductos.filter(
    (p) => !catalogo.some((c) => c.productoId === p.id),
  );

  const openAddModal = () => {
    setEditingItem(null);
    setSelectedProducto(null);
    setPrecio('');
    setModalOpen(true);
  };

  const openEditModal = (item: ClienteProducto) => {
    setEditingItem(item);
    setSelectedProducto(todosProductos.find((p) => p.id === item.productoId) || null);
    setPrecio(String(item.precio));
    setModalOpen(true);
  };

  const handleSaveModal = async () => {
    if (!id) return;
    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      toast.error('Ingresa un precio válido');
      return;
    }
    setSavingModal(true);
    try {
      if (editingItem) {
        await clientesService.updateClienteProducto(id, editingItem.productoId, precioNum);
        toast.success('Precio actualizado');
      } else {
        if (!selectedProducto) { toast.error('Selecciona un producto'); return; }
        await clientesService.addClienteProducto(id, selectedProducto.id, precioNum);
        toast.success('Producto agregado al catálogo');
      }
      setModalOpen(false);
      await reloadCatalogo();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSavingModal(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !deleteItem) return;
    try {
      await clientesService.removeClienteProducto(id, deleteItem.productoId);
      toast.success('Producto eliminado del catálogo');
      setDeleteItem(null);
      await reloadCatalogo();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!cliente) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/clientes')} sx={{ mb: 2 }}>
        Volver a Clientes
      </Button>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">{cliente.razonSocial}</Typography>
          <Typography variant="body2" color="text.secondary">RUC: {cliente.ruc}</Typography>
        </Box>
        {isAdmin && (
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate(`/clientes/${id}/edit`)}>
            Editar Cliente
          </Button>
        )}
      </Box>

      <Paper elevation={2}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Información" />
          <Tab label="Catálogo y Precios" />
        </Tabs>

        {/* Tab: Información */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Table size="small" sx={{ maxWidth: 500 }}>
              <TableBody>
                {[
                  ['Razón Social', cliente.razonSocial],
                  ['CI/RUC', cliente.ruc],
                  ['Dirección', cliente.direccion],
                  ['Ciudad', cliente.ciudad || '-'],
                  ['Teléfono', cliente.telefono || '-'],
                  ['Email', cliente.email || '-'],
                  ['Ubicación', cliente.ubicacion || '-'],
                ].map(([label, value]) => (
                  <TableRow key={label}>
                    <TableCell sx={{ fontWeight: 'bold', width: 150 }}>{label}</TableCell>
                    <TableCell>{value}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell>
                    <Chip label={cliente.activo ? 'Activo' : 'Inactivo'} color={cliente.activo ? 'success' : 'default'} size="small" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Tab: Catálogo y Precios */}
        {tab === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Productos habilitados para este cliente</Typography>
              {isAdmin && (
                <Button variant="contained" startIcon={<AddIcon />} onClick={openAddModal} disabled={productosSinAsignar.length === 0}>
                  Agregar Producto
                </Button>
              )}
            </Box>

            {catalogo.length === 0 ? (
              <Alert severity="info">
                Este cliente no tiene productos configurados.
                {isAdmin ? ' Usa el botón "Agregar Producto" para configurar su catálogo.' : ''}
              </Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Producto</strong></TableCell>
                    <TableCell align="right"><strong>Precio Base</strong></TableCell>
                    <TableCell align="right"><strong>Precio Cliente</strong></TableCell>
                    {isAdmin && <TableCell align="center"><strong>Acciones</strong></TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {catalogo.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{item.producto.nombre}</TableCell>
                      <TableCell align="right">$ {Number(item.producto.precio).toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <strong>$ {Number(item.precio).toFixed(2)}</strong>
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="center">
                          <IconButton size="small" color="primary" onClick={() => openEditModal(item)} title="Editar precio">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteItem(item)} title="Eliminar">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Paper>

      {/* Modal agregar / editar producto */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingItem ? 'Editar Precio' : 'Agregar Producto al Catálogo'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {!editingItem && (
            <Autocomplete
              options={productosSinAsignar}
              getOptionLabel={(p) => p.nombre}
              value={selectedProducto}
              onChange={(_, v) => {
                setSelectedProducto(v);
                if (v) setPrecio(String(v.precio));
              }}
              renderInput={(params) => <TextField {...params} label="Producto" required sx={{ mb: 2 }} />}
              sx={{ mb: 2 }}
            />
          )}
          {editingItem && (
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Producto:</strong> {editingItem.producto.nombre}
            </Typography>
          )}
          <TextField
            fullWidth
            label="Precio para este cliente"
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            inputProps={{ min: 0, step: 0.01 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} disabled={savingModal}>Cancelar</Button>
          <Button onClick={handleSaveModal} variant="contained" disabled={savingModal}>
            {savingModal ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmar eliminación */}
      <Dialog open={Boolean(deleteItem)} onClose={() => setDeleteItem(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar <strong>{deleteItem?.producto.nombre}</strong> del catálogo de este cliente?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteItem(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClienteDetalle;
