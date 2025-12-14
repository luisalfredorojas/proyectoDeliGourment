import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { sucursalesService } from '../../services/sucursalesService';
import { clientesService } from '../../services/clientesService';
import { rutasService } from '../../services/rutasService';
import { Sucursal, Cliente, Ruta } from '../../types/entities';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';

const SucursalesList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filteredSucursales, setFilteredSucursales] = useState<Sucursal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterRuta, setFilterRuta] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sucursalToDelete, setSucursalToDelete] = useState<Sucursal | null>(null);

  const canEdit = user?.rol === UserRole.ADMIN || user?.rol === UserRole.ASISTENTE;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = sucursales;

    if (searchTerm.trim()) {
      filtered = filtered.filter((s) =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cliente?.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCliente) {
      filtered = filtered.filter((s) => s.clienteId === filterCliente);
    }

    if (filterRuta) {
      filtered = filtered.filter((s) => s.rutaId === filterRuta);
    }

    setFilteredSucursales(filtered);
  }, [searchTerm, filterCliente, filterRuta, sucursales]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sucursalesData, clientesData, rutasData] = await Promise.all([
        sucursalesService.getSucursales(),
        clientesService.getClientes(),
        rutasService.getRutas(),
      ]);
      setSucursales(sucursalesData);
      setClientes(clientesData);
      setRutas(rutasData);
      setFilteredSucursales(sucursalesData);
    } catch (error: any) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!sucursalToDelete) return;

    try {
      await sucursalesService.deleteSucursal(sucursalToDelete.id);
      toast.success('Sucursal eliminada exitosamente');
      setDeleteDialogOpen(false);
      setSucursalToDelete(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar sucursal');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StoreIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <div>
            <Typography variant="h4" fontWeight="bold">Sucursales</Typography>
            <Typography variant="body2" color="text.secondary">Gestiona las sucursales de clientes</Typography>
          </div>
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/sucursales/new')} size="large">
            Nueva Sucursal
          </Button>
        )}
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Buscar sucursal o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel size="small">Cliente</InputLabel>
            <Select size="small" value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)} label="Cliente">
              <MenuItem value="">Todos</MenuItem>
              {clientes.map((c) => <MenuItem key={c.id} value={c.id}>{c.razonSocial}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel size="small">Ruta</InputLabel>
            <Select size="small" value={filterRuta} onChange={(e) => setFilterRuta(e.target.value)} label="Ruta">
              <MenuItem value="">Todas</MenuItem>
              {rutas.map((r) => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : filteredSucursales.length === 0 ? (
          <Alert severity="info">No se encontraron sucursales</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Cliente</strong></TableCell>
                  <TableCell><strong>Ruta</strong></TableCell>
                  <TableCell><strong>Dirección</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  {canEdit && <TableCell align="center"><strong>Acciones</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSucursales.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.nombre}</TableCell>
                    <TableCell>{s.cliente?.razonSocial}</TableCell>
                    <TableCell><Chip label={s.ruta?.nombre} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell>{s.direccion || '-'}</TableCell>
                    <TableCell align="center"><Chip label={s.activa ? 'Activa' : 'Inactiva'} size="small" color={s.activa ? 'success' : 'default'} /></TableCell>
                    {canEdit && (
                      <TableCell align="center">
                        <IconButton size="small" color="primary" onClick={() => navigate(`/sucursales/${s.id}/edit`)}><EditIcon /></IconButton>
                        <IconButton size="small" color="error" onClick={() => { setSucursalToDelete(s); setDeleteDialogOpen(true); }}><DeleteIcon /></IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>¿Eliminar sucursal <strong>{sucursalToDelete?.nombre}</strong>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SucursalesList;
