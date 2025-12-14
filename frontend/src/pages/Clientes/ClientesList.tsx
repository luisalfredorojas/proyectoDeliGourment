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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { clientesService } from '../../services/clientesService';
import { Cliente } from '../../types/entities';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';

const ClientesList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);

  const canEdit = user?.rol === UserRole.ADMIN || user?.rol === UserRole.ASISTENTE;

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClientes(clientes);
    } else {
      const filtered = clientes.filter((cliente) =>
        cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.ruc.includes(searchTerm) ||
        cliente.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClientes(filtered);
    }
  }, [searchTerm, clientes]);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesService.getClientes();
      setClientes(data);
      setFilteredClientes(data);
    } catch (error: any) {
      toast.error('Error al cargar clientes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!clienteToDelete) return;

    try {
      await clientesService.deleteCliente(clienteToDelete.id);
      toast.success('Cliente eliminado exitosamente');
      setDeleteDialogOpen(false);
      setClienteToDelete(null);
      loadClientes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar cliente');
    }
  };

  const openDeleteDialog = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setDeleteDialogOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <div>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Clientes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona los clientes del sistema
            </Typography>
          </div>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/clientes/new')}
            size="large"
          >
            Nuevo Cliente
          </Button>
        )}
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por razón social, CI/RUC o ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredClientes.length === 0 ? (
          <Alert severity="info">
            {searchTerm ? 'No se encontraron clientes con ese criterio' : 'No hay clientes registrados'}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Razón Social</strong></TableCell>
                  <TableCell><strong>CI/RUC</strong></TableCell>
                  <TableCell><strong>Ciudad</strong></TableCell>
                  <TableCell><strong>Teléfono</strong></TableCell>
                  <TableCell align="center"><strong>Sucursales</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  {canEdit && <TableCell align="center"><strong>Acciones</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id} hover>
                    <TableCell>{cliente.razonSocial}</TableCell>
                    <TableCell>{cliente.ruc}</TableCell>
                    <TableCell>{cliente.ciudad || '-'}</TableCell>
                    <TableCell>{cliente.telefono || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={cliente._count?.sucursales || 0}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={cliente.activo ? 'Activo' : 'Inactivo'}
                        size="small"
                        color={cliente.activo ? 'success' : 'default'}
                      />
                    </TableCell>
                    {canEdit && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/clientes/${cliente.id}/edit`)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteDialog(cliente)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el cliente <strong>{clienteToDelete?.razonSocial}</strong>?
          </Typography>
          {clienteToDelete && clienteToDelete._count && clienteToDelete._count.sucursales > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Este cliente tiene {clienteToDelete._count.sucursales} sucursal(es). No se puede eliminar.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={clienteToDelete?._count?.sucursales ? clienteToDelete._count.sucursales > 0 : false}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ClientesList;
