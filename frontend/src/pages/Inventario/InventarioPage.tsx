import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Alert, LinearProgress, Tabs, Tab,
} from '@mui/material';
import {
  Add as AddIcon, TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon, SwapHoriz as SwapIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';
import {
  inventarioService,
  MateriaPrimaInventario,
  MovimientoInventario,
  AlertaStockBajo,
  RegistrarMovimientoData,
  StockProducto,
} from '../../services/inventarioService';
import { productosService, Producto } from '../../services/productosService';

const TIPO_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ENTRADA: { label: 'Entrada', color: '#4caf50', icon: <TrendingUpIcon fontSize="small" /> },
  SALIDA: { label: 'Salida', color: '#f44336', icon: <TrendingDownIcon fontSize="small" /> },
  AJUSTE: { label: 'Ajuste', color: '#ff9800', icon: <SwapIcon fontSize="small" /> },
};

const MOTIVO_LABELS: Record<string, string> = {
  COMPRA: 'Compra',
  PRODUCCION: 'Producción',
  MERMA: 'Merma',
  AJUSTE_MANUAL: 'Ajuste manual',
  DEVOLUCION: 'Devolución',
};

const InventarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === UserRole.ADMIN;
  const [tab, setTab] = useState(0);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrimaInventario[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [movPage, setMovPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [alertas, setAlertas] = useState<AlertaStockBajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMovimiento, setOpenMovimiento] = useState(false);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);
  const [stockProductos, setStockProductos] = useState<StockProducto[]>([]);
  const [movForm, setMovForm] = useState<RegistrarMovimientoData>({
    materiaPrimaId: '',
    productoId: '',
    tipo: 'ENTRADA',
    motivo: 'COMPRA',
    cantidad: 0,
    referencia: '',
    observaciones: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadMovimientos = async (page: number) => {
    try {
      const data = await inventarioService.getAllMovimientos(51, page * 50);
      setHasNextPage(data.length > 50);
      setMovimientos(data.slice(0, 50));
    } catch {
      toast.error('Error al cargar movimientos');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [mpData, movData, alertData, prodsData, stockData] = await Promise.all([
        inventarioService.getMateriasPrimas(),
        inventarioService.getAllMovimientos(51, 0),
        inventarioService.getAlertas(),
        productosService.getProductos(),
        inventarioService.getStockProductos(),
      ]);
      setMateriasPrimas(mpData);
      setHasNextPage(movData.length > 50);
      setMovimientos(movData.slice(0, 50));
      setMovPage(0);
      setAlertas(alertData);
      setProductosDisponibles(prodsData);
      setStockProductos(stockData);
    } catch (error: any) {
      toast.error('Error al cargar datos de inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarMovimiento = async () => {
    if ((!movForm.materiaPrimaId && !movForm.productoId) || movForm.cantidad <= 0) {
      toast.warning('Seleccione un producto o materia prima y cantidad');
      return;
    }
    try {
      const dataToSend: any = { ...movForm };
      if (!dataToSend.materiaPrimaId) delete dataToSend.materiaPrimaId;
      if (!dataToSend.productoId) delete dataToSend.productoId;
      await inventarioService.registrarMovimiento(dataToSend);
      toast.success('Movimiento registrado');
      setOpenMovimiento(false);
      setMovForm({
        materiaPrimaId: '', productoId: '', tipo: 'ENTRADA', motivo: 'COMPRA',
        cantidad: 0, referencia: '', observaciones: '',
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar movimiento');
    }
  };

  const getStockColor = (mp: MateriaPrimaInventario) => {
    if (mp.stockMinimo > 0 && mp.cantidadDisponible <= mp.stockMinimo) return '#f44336';
    if (mp.stockMinimo > 0 && mp.cantidadDisponible <= mp.stockMinimo * 1.5) return '#ff9800';
    return '#4caf50';
  };

  const getStockPercent = (mp: MateriaPrimaInventario) => {
    if (mp.stockMinimo <= 0) return 100;
    return Math.min(100, Math.round((mp.cantidadDisponible / (mp.stockMinimo * 2)) * 100));
  };

  if (loading) return <Box sx={{ p: 3 }}><LinearProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/dashboard')}>
            <BackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              📦 Inventario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de stock de materias primas
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenMovimiento(true)}
          sx={{ bgcolor: '#1976d2' }}
        >
          Registrar Movimiento
        </Button>
      </Box>

      {/* Product Stock Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stockProductos.map((prod) => (
          <Grid item xs={12} sm={6} md={3} key={prod.id}>
            <Paper sx={{
              textAlign: 'center',
              borderLeft: 4,
              borderColor: prod.stockDisponible > 0 ? '#4caf50' : '#f44336',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
                  {prod.nombre}
                </Typography>
                <Typography variant="h4" fontWeight="bold" color={prod.stockDisponible > 0 ? 'success.main' : 'error'}>
                  {prod.stockDisponible}
                </Typography>
              </Box>
              {(prod.mermaTotal ?? 0) > 0 && (
                <Box sx={{ bgcolor: '#fef3c7', borderTop: '2px solid #f59e0b', px: 2, py: 0.75 }}>
                  <Typography variant="caption" fontWeight="bold" sx={{ color: '#92400e' }}>
                    Merma: {prod.mermaTotal}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Alerts */}
      {alertas.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>⚠️ Stock Bajo:</strong>{' '}
          {alertas.map(a => `${a.nombre} (${a.cantidadDisponible} ${a.unidadMedida})`).join(', ')}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Productos (${stockProductos.length})`} />
        <Tab label={`Materias Primas (${materiasPrimas.length})`} />
        <Tab label={`Movimientos (${movimientos.length}${hasNextPage ? '+' : ''})`} />
      </Tabs>

      {/* Tab 1: Materias Primas */}
      {tab === 1 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell align="center"><strong>Stock</strong></TableCell>
                <TableCell align="center"><strong>Mínimo</strong></TableCell>
                <TableCell align="center"><strong>Nivel</strong></TableCell>
                <TableCell align="center"><strong>Unidad</strong></TableCell>
                <TableCell align="center"><strong>Proveedor</strong></TableCell>
                {isAdmin && <TableCell align="center"><strong>Costo Unit.</strong></TableCell>}
                <TableCell align="center"><strong>Movimientos</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materiasPrimas.map((mp) => (
                <TableRow key={mp.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{mp.nombre}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold" color={getStockColor(mp)}>
                      {mp.cantidadDisponible}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {mp.stockMinimo > 0 ? mp.stockMinimo : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    <LinearProgress
                      variant="determinate"
                      value={getStockPercent(mp)}
                      sx={{
                        height: 8, borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': { bgcolor: getStockColor(mp) },
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={mp.unidadMedida} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption">{mp.proveedor || '—'}</Typography>
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Typography variant="caption">
                        {mp.costoUnitario ? `$${Number(mp.costoUnitario).toFixed(2)}` : '—'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Chip label={mp._count?.movimientos || 0} size="small" color="primary" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
              {materiasPrimas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 8 : 7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay materias primas registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab 2: Movimientos */}
      {tab === 2 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Materia Prima</strong></TableCell>
                <TableCell align="center"><strong>Tipo</strong></TableCell>
                <TableCell align="center"><strong>Motivo</strong></TableCell>
                <TableCell align="center"><strong>Cantidad</strong></TableCell>
                <TableCell align="center"><strong>Stock Result.</strong></TableCell>
                <TableCell><strong>Referencia</strong></TableCell>
                <TableCell><strong>Usuario</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.map((mov) => {
                const tipoInfo = TIPO_LABELS[mov.tipo] || { label: mov.tipo, color: '#999', icon: null };
                const chipColor = mov.motivo === 'MERMA' ? '#f59e0b' : tipoInfo.color;
                return (
                  <TableRow key={mov.id} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(mov.fecha).toLocaleString('es-EC', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {mov.materiaPrima?.nombre || mov.producto?.nombre || '—'}
                      </Typography>
                      {mov.productoId && (
                        <Chip label="Producto" size="small" sx={{ ml: 0.5, height: 16, fontSize: '0.6rem' }} color="primary" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={tipoInfo.icon as any}
                        label={tipoInfo.label}
                        size="small"
                        sx={{ bgcolor: chipColor + '20', color: chipColor, fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption">{MOTIVO_LABELS[mov.motivo] || mov.motivo}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={mov.cantidad >= 0 ? 'success.main' : 'error.main'}
                      >
                        {mov.cantidad >= 0 ? '+' : ''}{mov.cantidad} {mov.materiaPrima?.unidadMedida || ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{mov.stockResultante}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {mov.referencia || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{mov.usuario?.nombre || '—'}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {movimientos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay movimientos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={movPage === 0}
            onClick={async () => {
              const newPage = movPage - 1;
              setMovPage(newPage);
              await loadMovimientos(newPage);
            }}
          >
            ← Anterior
          </Button>
          <Typography variant="body2" color="text.secondary">
            Página {movPage + 1}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            disabled={!hasNextPage}
            onClick={async () => {
              const newPage = movPage + 1;
              setMovPage(newPage);
              await loadMovimientos(newPage);
            }}
          >
            Siguiente →
          </Button>
        </Box>
      )}

      {/* Tab 0: Stock de Productos */}
      {tab === 0 && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Producto</strong></TableCell>
                <TableCell align="center"><strong>Stock Disponible</strong></TableCell>
                <TableCell align="center"><strong>Merma</strong></TableCell>
                {isAdmin && <TableCell align="center"><strong>Precio</strong></TableCell>}
                <TableCell align="center"><strong>Movimientos</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stockProductos.map((prod) => (
                <TableRow key={prod.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">{prod.nombre}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={prod.stockDisponible}
                      size="small"
                      color={prod.stockDisponible > 0 ? 'success' : 'default'}
                      sx={{ fontWeight: 'bold', minWidth: 60 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {(prod.mermaTotal ?? 0) > 0 ? (
                      <Chip
                        label={prod.mermaTotal}
                        size="small"
                        sx={{
                          fontWeight: 'bold',
                          minWidth: 60,
                          bgcolor: '#fef3c7',
                          color: '#92400e',
                          border: '1px solid #f59e0b',
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="center">
                      <Typography variant="caption">
                        ${Number(prod.precio).toFixed(2)}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="center">
                    <Chip label={prod._count?.movimientosInventario || 0} size="small" color="primary" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
              {stockProductos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No hay productos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* New Movement Dialog */}
      <Dialog open={openMovimiento} onClose={() => setOpenMovimiento(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Movimiento de Inventario</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Materia Prima</InputLabel>
              <Select
                value={movForm.materiaPrimaId || ''}
                label="Materia Prima"
                onChange={(e) => setMovForm({ ...movForm, materiaPrimaId: e.target.value, productoId: '' })}
              >
                <MenuItem value=""><em>— Ninguna —</em></MenuItem>
                {materiasPrimas.map((mp) => (
                  <MenuItem key={mp.id} value={mp.id}>
                    {mp.nombre} ({mp.cantidadDisponible} {mp.unidadMedida})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Producto</InputLabel>
              <Select
                value={movForm.productoId || ''}
                label="Producto"
                onChange={(e) => setMovForm({ ...movForm, productoId: e.target.value, materiaPrimaId: '' })}
              >
                <MenuItem value=""><em>— Ninguno —</em></MenuItem>
                {productosDisponibles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre}{isAdmin ? ` ($${Number(p.precio).toFixed(2)})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={movForm.tipo}
                    label="Tipo"
                    onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value as any })}
                  >
                    <MenuItem value="ENTRADA">📥 Entrada</MenuItem>
                    <MenuItem value="SALIDA">📤 Salida</MenuItem>
                    <MenuItem value="AJUSTE">🔄 Ajuste</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Motivo</InputLabel>
                  <Select
                    value={movForm.motivo}
                    label="Motivo"
                    onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value as any })}
                  >
                    <MenuItem value="COMPRA">Compra</MenuItem>
                    <MenuItem value="MERMA">Merma</MenuItem>
                    <MenuItem value="AJUSTE_MANUAL">Ajuste manual</MenuItem>
                    <MenuItem value="DEVOLUCION">Devolución</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Cantidad"
              type="number"
              value={movForm.cantidad}
              onChange={(e) => setMovForm({ ...movForm, cantidad: Number(e.target.value) })}
              inputProps={{ min: 0.01, step: 0.01 }}
              fullWidth
            />

            <TextField
              label="Referencia (opcional)"
              value={movForm.referencia}
              onChange={(e) => setMovForm({ ...movForm, referencia: e.target.value })}
              fullWidth
              placeholder="Ej: Proveedor X, Factura #123"
            />

            <TextField
              label="Observaciones (opcional)"
              value={movForm.observaciones}
              onChange={(e) => setMovForm({ ...movForm, observaciones: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMovimiento(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleRegistrarMovimiento}
            disabled={(!movForm.materiaPrimaId && !movForm.productoId) || movForm.cantidad <= 0}
          >
            Registrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventarioPage;
