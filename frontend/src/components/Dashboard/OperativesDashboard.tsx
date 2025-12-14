import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Chip,
  Divider,
} from '@mui/material';
import { Store as StoreIcon, Route as RouteIcon, AttachMoney as MoneyIcon, Person as PersonIcon } from '@mui/icons-material';
import { dashboardService, TareasOperativas } from '../../services/dashboardService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const OperativesDashboard: React.FC = () => {
  const [tareas, setTareas] = useState<TareasOperativas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTareas();
  }, []);

  const loadTareas = async () => {
    try {
      const data = await dashboardService.getTareasOperativas();
      setTareas(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tareas) {
    return (
      <Container>
        <Typography>Error al cargar tareas</Typography>
      </Container>
    );
  }

  const renderTarea = (tarea: any) => (
    <Paper
      key={tarea.id}
      elevation={1}
      sx={{
        p: 2,
        mb: 2,
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="caption" color="text.secondary">
            #{tarea.id.slice(-6)}
          </Typography>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {tarea.pedido?.sucursal?.cliente?.razonSocial || 'Sin cliente'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <StoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {tarea.pedido?.sucursal?.nombre || 'Sin sucursal'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <RouteIcon sx={{ fontSize: 16 }} />
            <Chip
              label={tarea.pedido?.sucursal?.ruta?.nombre || 'Sin ruta'}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <MoneyIcon sx={{ fontSize: 20, color: 'success.main' }} />
            <Typography variant="h6" color="success.main" fontWeight="bold">
              ${tarea.pedido?.montoTotal ? Number(tarea.pedido.montoTotal).toFixed(2) : '0.00'}
            </Typography>
          </Box>

          {tarea.asignadoA && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Asignado a: <strong>{tarea.asignadoA.nombre}</strong>
              </Typography>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Creado {formatDistanceToNow(new Date(tarea.fechaCreacion), { addSuffix: true, locale: es })}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Productos:
          </Typography>
          {tarea.pedido?.detalles && Array.isArray(tarea.pedido.detalles) && (
            <Box>
              {tarea.pedido.detalles.map((det: any, idx: number) => (
                <Typography key={idx} variant="body2">
                  • {det.producto}: <strong>{det.cantidad}</strong>
                </Typography>
              ))}
            </Box>
          )}

          {/* Consignaciones */}
          {tarea.pedido?.consignaciones && Array.isArray(tarea.pedido.consignaciones) && tarea.pedido.consignaciones.length > 0 && (
            <Box sx={{ mt: 1, p: 1, bgcolor: '#fffbea', borderRadius: 1, borderLeft: 3, borderColor: '#f59e0b' }}>
              <Typography variant="caption" fontWeight="bold" color="#92400e" display="block">
                🔄 Consignación (no producir):
              </Typography>
              {tarea.pedido.consignaciones.map((cons: any, idx: number) => (
                <Typography key={idx} variant="caption" color="#92400e" display="block">
                  • {cons.producto}: {cons.cantidad}
                </Typography>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Mis Tareas
      </Typography>

      {/* Tareas Pendientes */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="text.secondary">
          📋 Pendientes ({tareas.tareasPendientes.length})
        </Typography>
        {tareas.tareasPendientes.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
            No hay tareas pendientes
          </Typography>
        ) : (
          tareas.tareasPendientes.map(renderTarea)
        )}
      </Paper>

      {/* Tareas En Proceso */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.main">
          ⚙️ En Proceso ({tareas.tareasEnProceso.length})
        </Typography>
        {tareas.tareasEnProceso.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ py: 2 }}>
            No hay tareas en proceso
          </Typography>
        ) : (
          tareas.tareasEnProceso.map(renderTarea)
        )}
      </Paper>
    </Container>
  );
};

export default OperativesDashboard;
