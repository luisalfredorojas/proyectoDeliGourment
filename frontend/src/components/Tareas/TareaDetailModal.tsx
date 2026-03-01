import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Chip, Grid, Paper,
  TextField, Button, Select, MenuItem, FormControl, InputLabel, Divider, Avatar, DialogActions,
} from '@mui/material';
import { Close as CloseIcon, History as HistoryIcon, Send as SendIcon, AttachMoney as MoneyIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { tareasService } from '../../services/tareasService';
import { Tarea, TareaEstado, TipoComentario, EstadoProductoEnTarea, TareaProductoEstado } from '../../types/entities';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';

const ESTADO_LABELS: Record<TareaEstado, string> = {
  [TareaEstado.ABIERTO]: 'Abierto',
  [TareaEstado.EN_PROCESO]: 'En Proceso',
  [TareaEstado.EN_ESPERA]: 'En Espera',
  [TareaEstado.EMBALAJE]: 'Embalaje',
  [TareaEstado.LOGISTICA]: 'Logística',
  [TareaEstado.ENTREGADO]: 'Entregado',
  [TareaEstado.CANCELADO]: 'Cancelado',
};

interface TareaDetailModalProps {
  open: boolean;
  tarea: Tarea;
  onClose: () => void;
}

const TareaDetailModal: React.FC<TareaDetailModalProps> = ({ open, tarea: initialTarea, onClose }) => {
  const { user } = useAuth();
  const [tarea, setTarea] = useState(initialTarea);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [tipoComentario, setTipoComentario] = useState<TipoComentario>(TipoComentario.GENERAL);
  const [loading, setLoading] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [fullHistory, setFullHistory] = useState<any[]>([]);

  const isAdmin = user?.rol === UserRole.ADMIN;
  const canCancel = (user?.rol === UserRole.ADMIN || user?.rol === UserRole.ASISTENTE)
    && tarea.estado !== TareaEstado.CANCELADO
    && tarea.estado !== TareaEstado.ENTREGADO;

  const ESTADO_PRODUCTO_LABELS: Record<EstadoProductoEnTarea, string> = {
    [EstadoProductoEnTarea.PENDIENTE]: 'Pendiente',
    [EstadoProductoEnTarea.EN_PROCESO]: 'En Proceso',
    [EstadoProductoEnTarea.LISTO]: 'Listo',
    [EstadoProductoEnTarea.EN_LOGISTICA]: 'En Logística',
    [EstadoProductoEnTarea.ENTREGADO]: 'Entregado',
  };

  const ESTADO_PRODUCTO_COLORS: Record<EstadoProductoEnTarea, string> = {
    [EstadoProductoEnTarea.PENDIENTE]: '#9e9e9e',
    [EstadoProductoEnTarea.EN_PROCESO]: '#2196f3',
    [EstadoProductoEnTarea.LISTO]: '#66bb6a',
    [EstadoProductoEnTarea.EN_LOGISTICA]: '#f57c00',
    [EstadoProductoEnTarea.ENTREGADO]: '#2e7d32',
  };

  useEffect(() => {
    if (open) {
      loadTareaFull();
    }
  }, [open]);

  const loadTareaFull = async () => {
    try {
      const data = await tareasService.getTarea(tarea.id);
      setTarea(data);
    } catch (error: any) {
      toast.error('Error al cargar tarea');
    }
  };

  const handleCancelarTarea = async () => {
    if (!window.confirm('¿Está seguro de cancelar esta tarea? Esta acción cambiará el estado a CANCELADO.')) {
      return;
    }

    try {
      const tareaActualizada = await tareasService.cancelarTarea(tarea.id);
      toast.success('Tarea cancelada exitosamente');
      setTarea(tareaActualizada);
      setTimeout(onClose, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar tarea');
    }
  };

  const handleAddComentario = async () => {
    if (!nuevoComentario.trim()) return;

    setLoading(true);
    try {
      await tareasService.addComentario(tarea.id, {
        comentario: nuevoComentario,
        tipo: tipoComentario,
      });
      toast.success('Comentario agregado');
      setNuevoComentario('');
      setTipoComentario(TipoComentario.GENERAL);
      await loadTareaFull();
    } catch (error: any) {
      toast.error('Error al agregar comentario');
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (nuevoEstado: TareaEstado) => {
    if (nuevoEstado === tarea.estado) return;

    setLoading(true);
    try {
      await tareasService.cambiarEstado(tarea.id, { nuevoEstado });
      toast.success(`Estado cambiado a ${ESTADO_LABELS[nuevoEstado]}`);
      await loadTareaFull();
      onClose(); // Close modal and refresh Kanban
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoProductoChange = async (productoNombre: string, nuevoEstado: EstadoProductoEnTarea) => {
    try {
      await tareasService.cambiarEstadoProducto(tarea.id, { productoNombre, nuevoEstado });
      toast.success(`${productoNombre}: ${ESTADO_PRODUCTO_LABELS[nuevoEstado]}`);
      await loadTareaFull();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado del producto');
    }
  };

  const handleCambiarTodosProductos = async (nuevoEstado: EstadoProductoEnTarea) => {
    try {
      await tareasService.cambiarEstadoTodosProductos(tarea.id, nuevoEstado);
      toast.success(`Todos los productos: ${ESTADO_PRODUCTO_LABELS[nuevoEstado]}`);
      await loadTareaFull();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado de productos');
    }
  };

  const handleViewFullHistory = async () => {
    try {
      const history = await tareasService.getHistorial(tarea.id);
      setFullHistory(history);
      setShowFullHistory(true);
    } catch (error: any) {
      toast.error('Error al cargar historial');
    }
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const renderTimeline = () => {
    const events: any[] = [];
    
    if (tarea.historialEstados) {
      tarea.historialEstados.forEach(h => events.push({ tipo: 'historial', data: h, fecha: h.fecha }));
    }
    if (tarea.comentarios) {
      tarea.comentarios.forEach(c => events.push({ tipo: 'comentario', data: c, fecha: c.fecha }));
    }

    events.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    return events.slice(0, 5).map((event, index) => (
      <Box key={index} sx={{ mb: 2, display: 'flex', gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: event.tipo === 'comentario' ? 'primary.main' : 'secondary.main', fontSize: '0.8rem' }}>
          {event.data.usuario ? getInitials(event.data.usuario.nombre) : '?'}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: event.tipo === 'comentario' ? 'background.paper' : 'grey.50' }}>
            {event.tipo === 'historial' ? (
              <Box>
                <Typography variant="caption" fontWeight="bold">{event.data.usuario?.nombre || 'Usuario'}</Typography>
                <Typography variant="body2">
                  cambió estado: <Chip label={event.data.estadoAnterior || 'Nuevo'} size="small" /> → <Chip label={event.data.estadoNuevo} size="small" color="primary" />
                </Typography>
                {event.data.comentario && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>"{event.data.comentario}"</Typography>}
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" fontWeight="bold">{event.data.usuario?.nombre || 'Usuario'}</Typography>
                  <Chip label={event.data.tipo} size="small" color={event.data.tipo === 'PROBLEMA' ? 'error' : event.data.tipo === 'ESPERA' ? 'warning' : 'default'} />
                </Box>
                <Typography variant="body2">{event.data.comentario}</Typography>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {formatDistanceToNow(new Date(event.fecha), { addSuffix: true, locale: es })}
            </Typography>
          </Paper>                </Box>
      </Box>
    ));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Tarea #{tarea.id.slice(-6)}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" startIcon={<HistoryIcon />} onClick={handleViewFullHistory}>Historial Completo</Button>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Estado Actual</Typography>
              <Chip label={ESTADO_LABELS[tarea.estado]} color="primary" />
              
              {/* State editing - only if not ENTREGADO */}
              {tarea.estado !== TareaEstado.ENTREGADO && (
                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Cambiar Estado</InputLabel>
                    <Select
                      value={tarea.estado}
                      label="Cambiar Estado"
                      onChange={(e) => handleEstadoChange(e.target.value as TareaEstado)}
                    >
                      <MenuItem value={TareaEstado.ABIERTO}>Abierto</MenuItem>
                      <MenuItem value={TareaEstado.EN_PROCESO}>En Proceso</MenuItem>
                      <MenuItem value={TareaEstado.EN_ESPERA}>En Espera</MenuItem>
                      <MenuItem value={TareaEstado.EMBALAJE}>Embalaje</MenuItem>
                      <MenuItem value={TareaEstado.LOGISTICA}>Logística</MenuItem>
                      <MenuItem value={TareaEstado.ENTREGADO}>Entregado</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
              
              {tarea.asignadoA && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Asignado a</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem' }}>{getInitials(tarea.asignadoA.nombre)}</Avatar>
                    <Typography variant="body2">{tarea.asignadoA.nombre}</Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Pedido</Typography>
              <Typography variant="body2"fontWeight="bold">{tarea.pedido?.sucursal?.cliente?.razonSocial}</Typography>
              <Typography variant="caption" display="block">{tarea.pedido?.sucursal?.nombre}</Typography>
              <Typography variant="caption" color="primary.main">Ruta: {tarea.pedido?.sucursal?.ruta?.nombre}</Typography>
              <Divider sx={{ my: 1 }} />
              {isAdmin && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="h6" color="success.main">$ {tarea.pedido?.montoTotal ? Number(tarea.pedido.montoTotal).toFixed(2) : '0.00'}</Typography>
              </Box>
              )}
            </Paper>
          </Grid>

          {/* Productos del Pedido - con estado individual */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  📦 Productos a Producir
                </Typography>
                {tarea.productosEstado && tarea.productosEstado.length > 0 && tarea.estado !== TareaEstado.ENTREGADO && (
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Cambiar todos</InputLabel>
                    <Select
                      label="Cambiar todos"
                      value=""
                      onChange={(e) => handleCambiarTodosProductos(e.target.value as EstadoProductoEnTarea)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      {Object.values(EstadoProductoEnTarea).map((estado) => (
                        <MenuItem key={estado} value={estado} sx={{ fontSize: '0.8rem' }}>
                          {ESTADO_PRODUCTO_LABELS[estado]}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
              {tarea.productosEstado && tarea.productosEstado.length > 0 ? (
                <Box>
                  {tarea.productosEstado.map((pe: TareaProductoEstado) => (
                    <Box
                      key={pe.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        px: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                        borderRadius: 1,
                        '&:hover': { bgcolor: 'grey.50' },
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {pe.productoNombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cantidad: {pe.cantidad}
                        </Typography>
                      </Box>
                      {tarea.estado !== TareaEstado.ENTREGADO ? (
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <Select
                            value={pe.estado}
                            onChange={(e) => handleEstadoProductoChange(pe.productoNombre, e.target.value as EstadoProductoEnTarea)}
                            sx={{
                              fontSize: '0.75rem',
                              bgcolor: ESTADO_PRODUCTO_COLORS[pe.estado] + '20',
                              '& .MuiSelect-select': { py: 0.5 },
                            }}
                          >
                            {Object.values(EstadoProductoEnTarea).map((estado) => (
                              <MenuItem key={estado} value={estado} sx={{ fontSize: '0.8rem' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ESTADO_PRODUCTO_COLORS[estado] }} />
                                  {ESTADO_PRODUCTO_LABELS[estado]}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={ESTADO_PRODUCTO_LABELS[pe.estado]}
                          size="small"
                          sx={{ bgcolor: ESTADO_PRODUCTO_COLORS[pe.estado] + '30', color: ESTADO_PRODUCTO_COLORS[pe.estado], fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              ) : tarea.pedido?.detalles && tarea.pedido.detalles.length > 0 ? (
                <Box>
                  {tarea.pedido.detalles.map((detalle: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2">{detalle.producto}</Typography>
                      <Typography variant="body2" fontWeight="bold">x{detalle.cantidad}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">Sin productos</Typography>
              )}
            </Paper>
          </Grid>

          {/* Consignaciones */}
          {tarea.pedido?.consignaciones && Array.isArray(tarea.pedido.consignaciones) && tarea.pedido.consignaciones.length > 0 && (
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 2, bgcolor: '#fffbea', borderLeft: 4, borderColor: '#f59e0b' }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="#92400e">
                  🔄 Consignaciones (No Producir)
                </Typography>
                <Typography variant="caption" color="#92400e" sx={{ mb: 1, display: 'block' }}>
                  Items que se reemplazan, no requieren producción:
                </Typography>
                <Box>
                  {tarea.pedido.consignaciones.map((cons: any, idx: number) => (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" color="#92400e">{cons.producto}</Typography>
                      <Typography variant="body2" fontWeight="bold" color="#92400e">x{cons.cantidad}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Actividad (Últimos 5 eventos)</Typography>
            {renderTimeline()}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>Agregar Comentario</Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe un comentario..."
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select value={tipoComentario} onChange={(e) => setTipoComentario(e.target.value as TipoComentario)}>
                  <MenuItem value={TipoComentario.GENERAL}>General</MenuItem>
                  <MenuItem value={TipoComentario.ESPERA}>Espera</MenuItem>
                  <MenuItem value={TipoComentario.PROBLEMA}>Problema</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<SendIcon />} onClick={handleAddComentario} disabled={loading || !nuevoComentario.trim()}>
                Enviar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Full History Modal */}
      <Dialog open={showFullHistory} onClose={() => setShowFullHistory(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Historial Completo</DialogTitle>
        <DialogContent dividers>
          {fullHistory.map((event, index) => (
            <Box key={index} sx={{ mb: 2, display: 'flex', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: event.tipo === 'comentario' ? 'primary.main' : 'secondary.main', fontSize: '0.8rem' }}>
                {event.usuario ? getInitials(event.usuario.nombre) : '?'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  {event.tipo === 'historial' ? (
                    <Box>
                      <Typography variant="caption" fontWeight="bold">{event.usuario?.nombre}</Typography>
                      <Typography variant="body2">Cambió estado: {event.data.estadoAnterior || 'Nuevo'} → {event.data.estadoNuevo}</Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="caption" fontWeight="bold">{event.usuario?.nombre}</Typography>
                      <Typography variant="body2">{event.data.comentario}</Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(event.fecha), { addSuffix: true, locale: es })}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))}
        </DialogContent>
      </Dialog>

      <DialogActions>
        {canCancel && (
          <Button
            onClick={handleCancelarTarea}
            color="error"
            startIcon={<CancelIcon />}
            sx={{ mr: 'auto' }}
          >
            Cancelar Tarea
          </Button>
        )}
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TareaDetailModal;
