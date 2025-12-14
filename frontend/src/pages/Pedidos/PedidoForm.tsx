import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Box, Grid, Autocomplete,
  IconButton, Alert, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack, Save as SaveIcon, Cancel as CancelIcon, Warning as WarningIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { pedidosService } from '../../services/pedidosService';
import { sucursalesService } from '../../services/sucursalesService';
import { productosService, Producto } from '../../services/productosService';
import { Sucursal, DetalleProducto } from '../../types/entities';

const PedidoForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);
  
  // DetalleProducto now includes optional productoId
  const [detalles, setDetalles] = useState<DetalleProducto[]>([{ producto: '', cantidad: 1, precioUnitario: 0 }]);
  const [consignaciones, setConsignaciones] = useState<{ producto: string; cantidad: number }[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    loadData();
    checkTime();
  }, []);

  const loadData = async () => {
    try {
      const [sucursalesData, productosData] = await Promise.all([
        sucursalesService.getSucursales(),
        productosService.getProductos()
      ]);
      setSucursales(sucursalesData);
      setProductos(productosData);
    } catch (error: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoadingData(false);
    }
  };

  const checkTime = () => {
    // If admin, no warning needed as they can order for same day
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol === 'ADMIN') {
        setShowWarning(false);
        return;
    }

    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const isFueraDeHorario = hour > 11 || (hour === 11 && minutes > 30);
    setShowWarning(isFueraDeHorario);
  };

  const handleAddDetalle = () => {
    setDetalles([...detalles, { producto: '', cantidad: 1, precioUnitario: 0 }]);
  };

  const handleRemoveDetalle = (index: number) => {
    if (detalles.length > 1) {
      setDetalles(detalles.filter((_, i) => i !== index));
    }
  };

  const handleDetalleChange = (index: number, field: keyof DetalleProducto, value: any) => {
    const newDetalles = [...detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setDetalles(newDetalles);
  };

  const handleProductSelect = (index: number, producto: Producto | null) => {
    const newDetalles = [...detalles];
    if (producto) {
      newDetalles[index] = {
        ...newDetalles[index],
        producto: producto.nombre,
        precioUnitario: Number(producto.precio),
        productoId: producto.id // We store the ID if the backend supports it, or just use it for selection
      };
    } else {
      newDetalles[index] = {
        ...newDetalles[index],
        producto: '',
        precioUnitario: 0,
        productoId: undefined
      };
    }
    setDetalles(newDetalles);
  };

  const handleAddConsignacion = () => {
    setConsignaciones([...consignaciones, { producto: '', cantidad: 1 }]);
  };

  const handleRemoveConsignacion = (index: number) => {
    setConsignaciones(consignaciones.filter((_, i) => i !== index));
  };

  const handleConsignacionChange = (index: number, field: 'producto' | 'cantidad', value: any) => {
    const newConsignaciones = [...consignaciones];
    newConsignaciones[index] = { ...newConsignaciones[index], [field]: value };
    setConsignaciones(newConsignaciones);
  };

  const calcularMontoTotal = () => {
    return detalles.reduce((total, d) => total + (d.cantidad * d.precioUnitario), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSucursal) {
      toast.error('Debe seleccionar una sucursal');
      return;
    }

    const invalidDetails = detalles.some(d => !d.producto.trim() || d.cantidad <= 0 || d.precioUnitario < 0);
    if (invalidDetails) {
      toast.error('Todos los productos deben tener nombre, cantidad > 0 y precio >= 0');
      return;
    }

    setLoading(true);
    try {
      await pedidosService.createPedido({
        sucursalId: selectedSucursal.id,
        detalles,
        consignaciones: consignaciones.length > 0 ? consignaciones : undefined,
        observaciones: observaciones.trim() || undefined,
      });
      toast.success(showWarning ? 'Pedido creado para mañana' : 'Pedido creado exitosamente');
      navigate('/pedidos');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear pedido');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </Container>
    );
  }

  const montoTotal = calcularMontoTotal();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/pedidos')} sx={{ mb: 2 }}>Volver a Pedidos</Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>Nuevo Pedido</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Crea un pedido para una sucursal. Selecciona los productos del catálogo.
        </Typography>

        {showWarning && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
            ⏰ <strong>Fuera de horario:</strong> Este pedido se programará para producción <strong>mañana</strong> (después de las 11:30 AM)
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={sucursales}
                getOptionLabel={(option) => `${option.cliente?.razonSocial} - ${option.nombre}`}
                value={selectedSucursal}
                onChange={(_, newValue) => setSelectedSucursal(newValue)}
                renderInput={(params) => <TextField {...params} label="Sucursal" required placeholder="Selecciona una sucursal" />}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Productos
                <Button startIcon={<AddIcon />} onClick={handleAddDetalle} size="small">Agregar Producto</Button>
              </Typography>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Producto</strong></TableCell>
                    <TableCell width="120"><strong>Cantidad</strong></TableCell>
                    <TableCell width="150"><strong>Precio Unit.</strong></TableCell>
                    <TableCell width="120"><strong>Subtotal</strong></TableCell>
                    <TableCell width="50"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detalles.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          freeSolo
                          options={productos}
                          getOptionLabel={(option) => typeof option === 'string' ? option : option.nombre}
                          value={productos.find(p => p.nombre === detalle.producto) || detalle.producto}
                          onChange={(_, newValue) => {
                            if (typeof newValue === 'string') {
                                handleDetalleChange(index, 'producto', newValue);
                            } else {
                                handleProductSelect(index, newValue);
                            }
                          }}
                          onInputChange={(_, newInputValue) => {
                              // Allow free text if not selected from list
                              if (!productos.some(p => p.nombre === newInputValue)) {
                                  handleDetalleChange(index, 'producto', newInputValue);
                              }
                          }}
                          renderInput={(params) => (
                            <TextField 
                                {...params} 
                                placeholder="Buscar producto..." 
                                required 
                                size="small"
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={detalle.cantidad}
                          onChange={(e) => handleDetalleChange(index, 'cantidad', Number(e.target.value))}
                          inputProps={{ min: 1 }}
                          onFocus={(e) => e.target.select()}
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={detalle.precioUnitario}
                          onChange={(e) => handleDetalleChange(index, 'precioUnitario', Number(e.target.value))}
                          inputProps={{ min: 0, step: 0.01 }}
                          onFocus={(e) => e.target.select()}
                          required
                        />
                      </TableCell>
                      <TableCell>$ {(detalle.cantidad * detalle.precioUnitario).toFixed(2)}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => handleRemoveDetalle(index)} disabled={detalles.length === 1}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right"><strong>TOTAL:</strong></TableCell>
                    <TableCell><strong>$ {montoTotal.toFixed(2)}</strong></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Grid>

            {/* Consignaciones Section */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3, bgcolor: '#fffbea', borderLeft: 4, borderColor: '#f59e0b' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold" color="#92400e">
                    🔄 Consignaciones (No Producir)
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddConsignacion}
                    sx={{ borderColor: '#f59e0b', color: '#92400e' }}
                  >
                    Agregar Consignación
                  </Button>
                </Box>
                
                {consignaciones.length > 0 ? (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell width={150}>Cantidad</TableCell>
                        <TableCell width={80}>Acción</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consignaciones.map((cons, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Autocomplete<Producto, false, false, true>
                              options={productos}
                              getOptionLabel={(option) => typeof option === 'string' ? option : option.nombre}
                              value={productos.find(p => p.nombre === cons.producto) || null}
                              onChange={(_, value) => handleConsignacionChange(index, 'producto', typeof value === 'string' ? value : value?.nombre || '')}
                              freeSolo
                              onInputChange={(_, newInputValue, reason) => {
                                if (reason === 'input' && !productos.some(p => p.nombre === newInputValue)) {
                                  handleConsignacionChange(index, 'producto', newInputValue);
                                }
                              }}
                              renderInput={(params) => (
                                <TextField {...params} size="small" placeholder="Producto" />
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              fullWidth
                              value={cons.cantidad}
                              onChange={(e) => handleConsignacionChange(index, 'cantidad', parseInt(e.target.value) || 1)}
                              inputProps={{ min: 1 }}
                              onFocus={(e) => e.target.select()}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveConsignacion(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No hay consignaciones. Los items de consignación son productos que se reemplazan y no requieren producción.
                  </Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales sobre el pedido..."
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/pedidos')} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Pedido'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default PedidoForm;
