import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Alert, LinearProgress, Tabs, Tab,
  Checkbox, FormControlLabel, Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon, CheckCircle as CheckIcon, Cancel as CancelIcon,
  AutoAwesome as AutoIcon, CompareArrows as CompareIcon,
  ArrowBack as BackIcon, CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
  proyeccionesService,
  Proyeccion,
  ProyeccionDetalle,
  ResumenCuadre,
} from '../../services/proyeccionesService';
import { productosService, Producto } from '../../services/productosService';

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  BORRADOR: { label: 'Borrador', color: '#9e9e9e' },
  PENDIENTE: { label: 'Pendiente', color: '#2196f3' },
  EN_PRODUCCION: { label: 'En Producción', color: '#ff9800' },
  CUADRADA: { label: 'Cuadrada', color: '#4caf50' },
  CANCELADA: { label: 'Cancelada', color: '#f44336' },
};

const ORIGEN_LABELS: Record<string, string> = {
  MANUAL: '✍️ Manual',
  AUTOMATICA: '🤖 Automática',
};

const ProyeccionesPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [proyecciones, setProyecciones] = useState<Proyeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);

  // Create dialog
  const [openCrear, setOpenCrear] = useState(false);
  const [fechaProduccion, setFechaProduccion] = useState('');
  const [detalles, setDetalles] = useState<ProyeccionDetalle[]>([{ producto: '', cantidad: 0 }]);
  const [observaciones, setObservaciones] = useState('');
  const [sugerenciaLoading, setSugerenciaLoading] = useState(false);

  // Cuadre dialog
  const [openCuadre, setOpenCuadre] = useState(false);
  const [cuadreProyeccion, setCuadreProyeccion] = useState<Proyeccion | null>(null);
  const [resumenCuadre, setResumenCuadre] = useState<ResumenCuadre | null>(null);
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([]);
  const [cuadreLoading, setCuadreLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, prods] = await Promise.all([
        proyeccionesService.getProyecciones(),
        productosService.getProductos(),
      ]);
      setProyecciones(data);
      setProductosDisponibles(prods);
    } catch (error) {
      toast.error('Error al cargar proyecciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async () => {
    if (!fechaProduccion || detalles.filter(d => d.producto && d.cantidad > 0).length === 0) {
      toast.warning('Ingrese fecha y al menos un producto');
      return;
    }
    try {
      await proyeccionesService.crear({
        fechaProduccion,
        detalles: detalles.filter(d => d.producto && d.cantidad > 0),
        observaciones: observaciones || undefined,
      });
      toast.success('Proyección creada');
      setOpenCrear(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear');
    }
  };

  const resetForm = () => {
    setFechaProduccion('');
    setDetalles([{ producto: '', cantidad: 0 }]);
    setObservaciones('');
  };

  const handleCargarSugerencia = async () => {
    if (!fechaProduccion) { toast.warning('Seleccione una fecha'); return; }
    setSugerenciaLoading(true);
    try {
      const sug = await proyeccionesService.getSugerencia(fechaProduccion);
      if (sug && sug.detalles.length > 0) {
        setDetalles(sug.detalles);
        toast.success(`Sugerencia cargada: ${sug.totalPedidosAnalizados} pedidos analizados`);
      } else {
        toast.info('No hay datos históricos suficientes para esta fecha');
      }
    } catch (error) {
      toast.error('Error al obtener sugerencia');
    } finally {
      setSugerenciaLoading(false);
    }
  };

  const handleConfirmar = async (id: string) => {
    try {
      await proyeccionesService.confirmar(id);
      toast.success('Proyección confirmada y tarea creada en Kanban');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al confirmar');
    }
  };

  const handleCancelar = async (id: string) => {
    try {
      await proyeccionesService.cambiarEstado(id, 'CANCELADA');
      toast.success('Proyección cancelada');
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar');
    }
  };

  const handleOpenCuadre = async (proy: Proyeccion) => {
    setCuadreProyeccion(proy);
    setCuadreLoading(true);
    setOpenCuadre(true);
    try {
      const resumen = await proyeccionesService.getResumenCuadre(proy.id);
      setResumenCuadre(resumen);
    } catch (error) {
      toast.error('Error al cargar resumen de cuadre');
    } finally {
      setCuadreLoading(false);
    }
  };

  const handleCuadrar = async () => {
    if (!cuadreProyeccion || selectedPedidos.length === 0) {
      toast.warning('Seleccione al menos un pedido');
      return;
    }
    try {
      await proyeccionesService.cuadrar(cuadreProyeccion.id, selectedPedidos);
      toast.success('Proyección cuadrada exitosamente');
      setOpenCuadre(false);
      setResumenCuadre(null);
      setSelectedPedidos([]);
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cuadrar');
    }
  };

  const filteredProyecciones = proyecciones.filter(p => {
    if (tab === 0) return true;
    if (tab === 1) return p.estado === 'BORRADOR';
    if (tab === 2) return p.estado === 'PENDIENTE' || p.estado === 'EN_PRODUCCION';
    if (tab === 3) return p.estado === 'CUADRADA';
    return true;
  });

  if (loading) return <Box sx={{ p: 3 }}><LinearProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard')}><BackIcon /></IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">📊 Proyecciones</Typography>
            <Typography variant="body2" color="text.secondary">
              Planificación de producción y reconciliación
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCrear(true)}>
          Nueva Proyección
        </Button>
      </Box>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(ESTADO_LABELS).map(([key, val]) => {
          const count = proyecciones.filter(p => p.estado === key).length;
          return (
            <Grid item xs={6} md={2.4} key={key}>
              <Paper sx={{ p: 1.5, textAlign: 'center', borderTop: 3, borderColor: val.color }}>
                <Typography variant="h5" fontWeight="bold" color={val.color}>{count}</Typography>
                <Typography variant="caption">{val.label}</Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Todas (${proyecciones.length})`} />
        <Tab label={`Borradores (${proyecciones.filter(p => p.estado === 'BORRADOR').length})`} />
        <Tab label={`Activas (${proyecciones.filter(p => ['PENDIENTE', 'EN_PRODUCCION'].includes(p.estado)).length})`} />
        <Tab label={`Cuadradas (${proyecciones.filter(p => p.estado === 'CUADRADA').length})`} />
      </Tabs>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Fecha Producción</strong></TableCell>
              <TableCell align="center"><strong>Origen</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell><strong>Productos</strong></TableCell>
              <TableCell><strong>Creado por</strong></TableCell>
              <TableCell align="center"><strong>Cuadres</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProyecciones.map((proy) => {
              const detalles = (proy.detalles || []) as ProyeccionDetalle[];
              const estadoInfo = ESTADO_LABELS[proy.estado] || { label: proy.estado, color: '#999' };
              return (
                <TableRow key={proy.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" fontWeight="bold">
                        {new Date(proy.fechaProduccion).toLocaleDateString('es-EC', {
                          weekday: 'short', day: '2-digit', month: 'short',
                        })}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption">{ORIGEN_LABELS[proy.origen]}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={estadoInfo.label}
                      size="small"
                      sx={{ bgcolor: estadoInfo.color + '20', color: estadoInfo.color, fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {detalles.slice(0, 3).map((d, i) => (
                        <Chip key={i} label={`${d.producto} x${d.cantidad}`} size="small" variant="outlined" />
                      ))}
                      {detalles.length > 3 && (
                        <Chip label={`+${detalles.length - 3} más`} size="small" color="default" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{proy.creadoPor?.nombre || '—'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={proy._count?.cuadres || 0} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {proy.estado === 'BORRADOR' && (
                        <>
                          <Button size="small" variant="contained" color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleConfirmar(proy.id)}
                            sx={{ fontSize: '0.7rem', py: 0.3 }}
                          >
                            Confirmar
                          </Button>
                          <IconButton size="small" color="error" onClick={() => handleCancelar(proy.id)}>
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                      {(proy.estado === 'PENDIENTE' || proy.estado === 'EN_PRODUCCION') && (
                        <Button size="small" variant="outlined" color="primary"
                          startIcon={<CompareIcon />}
                          onClick={() => handleOpenCuadre(proy)}
                          sx={{ fontSize: '0.7rem', py: 0.3 }}
                        >
                          Cuadrar
                        </Button>
                      )}
                      {proy.estado === 'CUADRADA' && (
                        <Chip label="✅ Cuadrada" size="small" color="success" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProyecciones.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No hay proyecciones
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={openCrear} onClose={() => setOpenCrear(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Proyección de Producción</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="Fecha de Producción"
                type="date"
                value={fechaProduccion}
                onChange={(e) => setFechaProduccion(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <Button
                variant="outlined"
                startIcon={<AutoIcon />}
                onClick={handleCargarSugerencia}
                disabled={sugerenciaLoading || !fechaProduccion}
                sx={{ whiteSpace: 'nowrap', minWidth: 180 }}
              >
                {sugerenciaLoading ? 'Analizando...' : 'Cargar Sugerencia'}
              </Button>
            </Box>

            <Typography variant="subtitle2" fontWeight="bold">Productos:</Typography>
            {detalles.map((d, idx) => (
              <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Autocomplete
                  options={productosDisponibles.map(p => p.nombre)}
                  value={d.producto || null}
                  onChange={(_, newValue) => {
                    const copy = [...detalles];
                    copy[idx] = { ...copy[idx], producto: newValue || '' };
                    setDetalles(copy);
                  }}
                  renderInput={(params) => <TextField {...params} label="Producto" size="small" />}
                  sx={{ flex: 1 }}
                  size="small"
                  freeSolo
                />
                <TextField
                  label="Cantidad"
                  type="number"
                  value={d.cantidad}
                  onChange={(e) => {
                    const copy = [...detalles];
                    copy[idx] = { ...copy[idx], cantidad: Number(e.target.value) };
                    setDetalles(copy);
                  }}
                  sx={{ width: 120 }}
                  size="small"
                  inputProps={{ min: 0 }}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => setDetalles(detalles.filter((_, i) => i !== idx))}
                  disabled={detalles.length <= 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setDetalles([...detalles, { producto: '', cantidad: 0 }])}
            >
              Agregar producto
            </Button>

            <TextField
              label="Observaciones (opcional)"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              multiline rows={2} fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCrear(false); resetForm(); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrear}>Crear Proyección</Button>
        </DialogActions>
      </Dialog>

      {/* Cuadre Dialog */}
      <Dialog open={openCuadre} onClose={() => { setOpenCuadre(false); setResumenCuadre(null); setSelectedPedidos([]); }} maxWidth="lg" fullWidth>
        <DialogTitle>
          Cuadrar Proyección — {cuadreProyeccion && new Date(cuadreProyeccion.fechaProduccion).toLocaleDateString('es-EC')}
        </DialogTitle>
        <DialogContent>
          {cuadreLoading ? <LinearProgress /> : resumenCuadre && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {/* Comparison table */}
              <Typography variant="subtitle2" fontWeight="bold">
                📊 Comparación Proyectado vs Real ({resumenCuadre.totalPedidosDelDia} pedidos del día)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Producto</strong></TableCell>
                      <TableCell align="center"><strong>Proyectado</strong></TableCell>
                      <TableCell align="center"><strong>Real</strong></TableCell>
                      <TableCell align="center"><strong>Diferencia</strong></TableCell>
                      <TableCell align="center"><strong>%</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resumenCuadre.comparacion.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell><strong>{c.producto}</strong></TableCell>
                        <TableCell align="center">{c.cantidadProyectada}</TableCell>
                        <TableCell align="center">{c.cantidadReal}</TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={c.diferencia >= 0 ? 'success.main' : 'error.main'}
                          >
                            {c.diferencia >= 0 ? '+' : ''}{c.diferencia}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${c.porcentaje}%`}
                            size="small"
                            color={c.porcentaje >= 80 && c.porcentaje <= 120 ? 'success' : c.porcentaje < 50 ? 'error' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Select pedidos to associate */}
              <Typography variant="subtitle2" fontWeight="bold">
                📋 Seleccionar pedidos a asociar:
              </Typography>
              {resumenCuadre.pedidosDisponibles.length > 0 ? (
                <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto', p: 1 }}>
                  {resumenCuadre.pedidosDisponibles.map((p) => (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          checked={selectedPedidos.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPedidos([...selectedPedidos, p.id]);
                            } else {
                              setSelectedPedidos(selectedPedidos.filter(id => id !== p.id));
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {p.cliente} — {p.sucursal} — ${Number(p.montoTotal).toFixed(2)}
                        </Typography>
                      }
                      sx={{ display: 'block', borderBottom: '1px solid #eee', py: 0.5 }}
                    />
                  ))}
                </Paper>
              ) : (
                <Alert severity="info">No hay pedidos para el día de esta proyección</Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCuadre(false); setResumenCuadre(null); setSelectedPedidos([]); }}>
            Cerrar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleCuadrar}
            disabled={selectedPedidos.length === 0}
            startIcon={<CheckIcon />}
          >
            Cuadrar ({selectedPedidos.length} pedidos)
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProyeccionesPage;
