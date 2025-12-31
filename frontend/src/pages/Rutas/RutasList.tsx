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
  Route as RouteIcon,
  ArrowBack,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { rutasService } from '../../services/rutasService';
import { Ruta } from '../../types/entities';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';

const RutasList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [filteredRutas, setFilteredRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rutaToDelete, setRutaToDelete] = useState<Ruta | null>(null);

  const isAdmin = user?.rol === UserRole.ADMIN;

  useEffect(() => {
    loadRutas();
  }, []);

  useEffect(() => {
    // Filter rutas by search term
    if (searchTerm.trim() === '') {
      setFilteredRutas(rutas);
    } else {
      const filtered = rutas.filter((ruta) =>
        ruta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ruta.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRutas(filtered);
    }
  }, [searchTerm, rutas]);

  const loadRutas = async () => {
    try {
      setLoading(true);
      const data = await rutasService.getRutas();
      setRutas(data);
      setFilteredRutas(data);
    } catch (error: any) {
      toast.error('Error al cargar rutas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!rutaToDelete) return;

    try {
      await rutasService.deleteRuta(rutaToDelete.id);
      toast.success('Ruta eliminada exitosamente');
      setDeleteDialogOpen(false);
      setRutaToDelete(null);
      loadRutas();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar ruta');
    }
  };

  const openDeleteDialog = (ruta: Ruta) => {
    setRutaToDelete(ruta);
    setDeleteDialogOpen(true);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/configuraciones')} sx={{ mb: 2 }}>
        Regresar a Configuraciones
      </Button>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <RouteIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <div>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Rutas de Entrega
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona las rutas de distribución
            </Typography>
          </div>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/rutas/new')}
            size="large"
          >
            Nueva Ruta
          </Button>
        )}
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar ruta..."
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
        ) : filteredRutas.length === 0 ? (
          <Alert severity="info">
            {searchTerm ? 'No se encontraron rutas con ese criterio' : 'No hay rutas registradas'}
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                  <TableCell align="center"><strong>Sucursales</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  {isAdmin && <TableCell align="center"><strong>Acciones</strong></TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRutas.map((ruta) => (
                  <TableRow key={ruta.id} hover>
                    <TableCell>{ruta.nombre}</TableCell>
                    <TableCell>{ruta.descripcion || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={ruta._count?.sucursales || 0}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={ruta.activa ? 'Activa' : 'Inactiva'}
                        size="small"
                        color={ruta.activa ? 'success' : 'default'}
                      />
                    </TableCell>
                    {isAdmin && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/rutas/${ruta.id}/edit`)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteDialog(ruta)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la ruta <strong>{rutaToDelete?.nombre}</strong>?
          </Typography>
          {rutaToDelete && rutaToDelete._count && rutaToDelete._count.sucursales > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Esta ruta tiene {rutaToDelete._count.sucursales} sucursal(es) asignada(s).
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RutasList;
