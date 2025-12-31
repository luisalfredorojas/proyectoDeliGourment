import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, CircularProgress, Alert, Menu, MenuItem, ListItemIcon, ListItemText,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as ViewIcon, 
  ShoppingCart as CartIcon, 
  Search as SearchIcon, 
  Warning as WarningIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { pedidosService } from '../../services/pedidosService';
import { Pedido } from '../../types/entities';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PedidosList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  
  // Modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const canCreate = user?.rol === UserRole.ASISTENTE || user?.rol === UserRole.ADMIN;
  const canManage = user?.rol === UserRole.ASISTENTE || user?.rol === UserRole.ADMIN;

  useEffect(() => {
    loadPedidos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = pedidos.filter((p) =>
        p.sucursal?.cliente?.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sucursal?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPedidos(filtered);
    } else {
      setFilteredPedidos(pedidos);
    }
  }, [searchTerm, pedidos]);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const data = await pedidosService.getPedidos();
      setPedidos(data);
      setFilteredPedidos(data);
    } catch (error: any) {
      toast.error('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, pedido: Pedido) => {
    setAnchorEl(event.currentTarget);
    setSelectedPedido(pedido);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewModalOpen(true);
    handleMenuClose();
  };

  const handleEdit = () => {
    if (selectedPedido) {
      navigate(`/pedidos/editar/${selectedPedido.id}`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedPedido) return;

    // Validar que la tarea esté en ABIERTO
    if (selectedPedido.tarea && selectedPedido.tarea.estado !== 'ABIERTO') {
      toast.error(`No se puede eliminar este pedido. La tarea está en estado: ${selectedPedido.tarea.estado.replace(/_/g, ' ')}. Solo se pueden eliminar pedidos con tareas en estado ABIERTO.`);
      handleMenuClose();
      return;
    }
    
    if (window.confirm(`¿Está seguro de eliminar el pedido de ${selectedPedido.sucursal?.cliente?.razonSocial}? Esto también eliminará la tarea asociada.`)) {
      try {
        await pedidosService.deletePedido(selectedPedido.id);
        toast.success('Pedido y tarea eliminados correctamente');
        loadPedidos();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al eliminar pedido');
      }
    }
    handleMenuClose();
  };

  const handleViewModalClose = () => {
    setViewModalOpen(false);
    setSelectedPedido(null);
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, 'default' | 'primary' | 'info' | 'warning' | 'success' | 'error' | 'secondary'> = {
      ABIERTO: 'default',
      EN_PROCESO: 'primary',
      EN_ESPERA: 'warning',
      EMBALAJE: 'secondary',
      LOGISTICA: 'warning',
      ENTREGADO: 'success',
      CANCELADO: 'error',
    };
    return colors[estado] || 'default';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CartIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <div>
            <Typography variant="h4" fontWeight="bold">Pedidos</Typography>
            <Typography variant="body2" color="text.secondary">Gestiona los pedidos de las sucursales</Typography>
          </div>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/pedidos/new')} size="large">
            Nuevo Pedido
          </Button>
        )}
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por cliente o sucursal..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredPedidos.length === 0 ? (
          <Alert severity="info">{searchTerm ? 'No se encontraron pedidos' : 'No hay pedidos registrados'}</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Sucursal</strong></TableCell>
                  <TableCell><strong>Ruta</strong></TableCell>
                  <TableCell align="right"><strong>Monto</strong></TableCell>
                  <TableCell align="center"><strong>Fecha Prod.</strong></TableCell>
                  <TableCell align="center"><strong>Estado Tarea</strong></TableCell>
                  {canManage && <TableCell align="center"><strong>Acciones</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPedidos.map((pedido) => (
                  <TableRow key={pedido.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {pedido.sucursal?.cliente?.razonSocial}
                        {pedido.fueraDeHorario && (
                          <Chip icon={<WarningIcon />} label="Fuera horario" size="small" color="warning" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{pedido.sucursal?.nombre}</TableCell>
                    <TableCell>
                      <Chip label={pedido.sucursal?.ruta?.nombre} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right"><strong>$ {Number(pedido.montoTotal).toFixed(2)}</strong></TableCell>
                    <TableCell align="center">
                      {format(new Date(pedido.fechaProduccion), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell align="center">
                      {pedido.tarea ? (
                        <Chip label={pedido.tarea.estado.replace(/_/g, ' ')} size="small" color={getEstadoColor(pedido.tarea.estado)} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell align="center">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, pedido)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Visualizar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onClose={handleViewModalClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" fontWeight="bold">
            Detalle del Pedido
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {selectedPedido && (
            <Grid container spacing={3}>
              {/* Cliente y Sucursal */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Cliente
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {selectedPedido.sucursal?.cliente?.razonSocial}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sucursal: {selectedPedido.sucursal?.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ruta: {selectedPedido.sucursal?.ruta?.nombre}
                  </Typography>
                </Paper>
              </Grid>

              {/* Información del Pedido */}
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Fecha de Producción
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedPedido.fechaProduccion), 'dd MMMM yyyy', { locale: es })}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Monto Total
                  </Typography>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    $ {Number(selectedPedido.montoTotal).toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Productos */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Productos
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Producto</strong></TableCell>
                        <TableCell align="center"><strong>Cantidad</strong></TableCell>
                        <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                        <TableCell align="right"><strong>Subtotal</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPedido.detalles && Array.isArray(selectedPedido.detalles) && selectedPedido.detalles.map((detalle: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell>{detalle.producto}</TableCell>
                          <TableCell align="center">{detalle.cantidad}</TableCell>
                          <TableCell align="right">$ {Number(detalle.precioUnitario).toFixed(2)}</TableCell>
                          <TableCell align="right">$ {(detalle.cantidad * detalle.precioUnitario).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Consignaciones */}
              {selectedPedido.consignaciones && Array.isArray(selectedPedido.consignaciones) && selectedPedido.consignaciones.length > 0 && (
                <Grid item xs={12}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: '#fffbea', borderLeft: 4, borderColor: '#f59e0b' }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" color="#92400e">
                      🔄 Consignaciones (No Producir)
                    </Typography>
                    <Typography variant="body2" color="#92400e" sx={{ mb: 2 }}>
                      Items que se reemplazan, no requieren producción
                    </Typography>
                    {selectedPedido.consignaciones.map((cons: any, idx: number) => (
                      <Typography key={idx} variant="body2" color="#92400e">
                        • {cons.producto}: <strong>{cons.cantidad}</strong>
                      </Typography>
                    ))}
                  </Paper>
                </Grid>
              )}

              {/* Observaciones */}
              {selectedPedido.observaciones && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Observaciones
                    </Typography>
                    <Typography variant="body2">
                      {selectedPedido.observaciones}
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {/* Fuera de Horario */}
              {selectedPedido.fueraDeHorario && (
                <Grid item xs={12}>
                  <Alert severity="warning" icon={<WarningIcon />}>
                    Este pedido fue creado fuera del horario normal (después de 11:30 AM)
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleViewModalClose}>Cerrar</Button>
          {canManage && (
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => {
              handleViewModalClose();
              if (selectedPedido) navigate(`/pedidos/editar/${selectedPedido.id}`);
            }}>
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PedidosList;
