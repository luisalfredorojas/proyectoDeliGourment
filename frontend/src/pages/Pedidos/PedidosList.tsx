import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, TextField, InputAdornment, CircularProgress, Alert,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, ShoppingCart as CartIcon, Search as SearchIcon, Warning as WarningIcon } from '@mui/icons-material';
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

  const canCreate = user?.rol === UserRole.ASISTENTE || user?.rol === UserRole.ADMIN;

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

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, 'default' | 'primary' | 'info' | 'warning' | 'success'> = {
      ABIERTO: 'default',
      EN_PROCESO: 'primary',
      EN_ESPERA: 'warning',
      EMBALAJE: 'info',
      ENTREGADO_LOGISTICA: 'success',
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
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
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
                    <TableCell align="center">
                      <IconButton size="small" color="info" onClick={() => navigate(`/pedidos/${pedido.id}`)}>
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default PedidosList;
