import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import {
  AttachMoney,
  ShoppingCart,
  Assignment,
  Factory,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService, AdminStats } from '../../services/dashboardService';
import StatCard from './StatCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = {
  primary: '#2196f3',
  success: '#4caf50',
  warning: '#ff9800',
  purple: '#9c27b0',
  grey: '#9e9e9e',
};

const TASK_COLORS = {
  ABIERTO: COLORS.grey,
  EN_PROCESO: COLORS.primary,
  EN_ESPERA: COLORS.warning,
  EMBALAJE: COLORS.purple,
  ENTREGADO_LOGISTICA: COLORS.success,
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardService.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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

  if (!stats) {
    return (
      <Container>
        <Typography>Error al cargar estadísticas</Typography>
      </Container>
    );
  }

  // Preparar datos para gráficos
  const tareasPieData = Object.entries(stats.tareasPorEstado)
    .filter(([, value]) => value > 0) // Solo mostrar estados con tareas
    .map(([name, value]) => ({
      name,
      value,
    }));

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ventas Hoy"
            value={`$${stats.ventasHoy.total.toFixed(2)}`}
            icon={<AttachMoney sx={{ fontSize: 32 }} />}
            color={COLORS.success}
            trend={stats.ventasHoy.comparacionAyer}
            subtitle={`${stats.ventasHoy.pedidosCount} pedidos`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pedidos Hoy"
            value={stats.ventasHoy.pedidosCount}
            icon={<ShoppingCart sx={{ fontSize: 32 }} />}
            color={COLORS.primary}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tareas Activas"
            value={Object.values(stats.tareasPorEstado).reduce((a, b) => a + b, 0)}
            icon={<Assignment sx={{ fontSize: 32 }} />}
            color={COLORS.warning}
            subtitle={`${stats.tareasPorEstado.EN_PROCESO} en proceso`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Productos a Producir"
            value={stats.productosAProducir}
            icon={<Factory sx={{ fontSize: 32 }} />}
            color={COLORS.purple}
            subtitle="Items totales"
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Ventas últimos 7 días */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Ventas Últimos 7 Días
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={stats.ventasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Line type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Tareas por Estado */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Tareas por Estado
            </Typography>
            {tareasPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={tareasPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${value}`}
                  >
                    {tareasPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TASK_COLORS[entry.name as keyof typeof TASK_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend 
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        'ABIERTO': 'Abierto',
                        'EN_PROCESO': 'En Proceso',
                        'EN_ESPERA': 'En Espera',
                        'EMBALAJE': 'Embalaje',
                        'ENTREGADO_LOGISTICA': 'Entregado'
                      };
                      return labels[value] || value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80%' }}>
                <Typography variant="body1" color="text.secondary">
                  No hay tareas registradas
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Top Productos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Top 5 Productos
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={stats.topProductos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="producto" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="cantidad" fill={COLORS.primary} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Ventas por Ruta */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>
              Ventas por Ruta
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={stats.ventasPorRuta}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ruta" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Bar dataKey="total" fill={COLORS.success} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Pedidos Recientes */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Pedidos Recientes
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Sucursal</TableCell>
              <TableCell>Ruta</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell>Fecha Producción</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.pedidosRecientes.map((pedido) => (
              <TableRow key={pedido.id}>
                <TableCell>{pedido.sucursal?.cliente?.razonSocial || '-'}</TableCell>
                <TableCell>{pedido.sucursal?.nombre || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={pedido.sucursal?.ruta?.nombre || '-'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <strong>${Number(pedido.montoTotal).toFixed(2)}</strong>
                </TableCell>
                <TableCell>
                  {format(new Date(pedido.fechaProduccion), 'dd MMM yyyy', { locale: es })}
                </TableCell>
                <TableCell>
                  <Chip
                    label={pedido.tarea?.estado || 'Sin tarea'}
                    size="small"
                    color={pedido.tarea?.estado === 'ENTREGADO_LOGISTICA' ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
