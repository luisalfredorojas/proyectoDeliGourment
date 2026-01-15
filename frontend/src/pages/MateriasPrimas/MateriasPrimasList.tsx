import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Box, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ArrowBack,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { materiasPrimasService, MateriaPrima } from '../../services/materiasPrimasService';

const MateriasPrimasList: React.FC = () => {
  const navigate = useNavigate();
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMateria, setCurrentMateria] = useState<Partial<MateriaPrima>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMaterias();
  }, []);

  const loadMaterias = async () => {
    try {
      const data = await materiasPrimasService.getMateriasPrimas();
      setMaterias(data);
    } catch (error) {
      toast.error('Error al cargar materias primas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (materia?: MateriaPrima) => {
    setCurrentMateria(materia || { nombre: '', cantidadDisponible: 0, unidadMedida: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentMateria({});
  };

  const handleSave = async () => {
    if (!currentMateria.nombre || !currentMateria.unidadMedida) {
      toast.warning('Complete todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      if (currentMateria.id) {
        await materiasPrimasService.updateMateriaPrima(currentMateria.id, currentMateria);
        toast.success('Materia prima actualizada');
      } else {
        await materiasPrimasService.createMateriaPrima(currentMateria as MateriaPrima);
        toast.success('Materia prima creada');
      }
      handleCloseDialog();
      loadMaterias();
    } catch (error) {
      toast.error('Error al guardar materia prima');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de eliminar esta materia prima?')) {
      try {
        await materiasPrimasService.deleteMateriaPrima(id);
        toast.success('Materia prima eliminada');
        loadMaterias();
      } catch (error) {
        toast.error('Error al eliminar materia prima');
      }
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/configuraciones')} sx={{ mb: 2 }}>
        Regresar a Configuraciones
      </Button>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Materias Primas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Materia Prima
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Stock Disponible</TableCell>
              <TableCell>Unidad</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materias.map((materia) => (
              <TableRow key={materia.id}>
                <TableCell>{materia.nombre}</TableCell>
                <TableCell>{materia.cantidadDisponible}</TableCell>
                <TableCell>{materia.unidadMedida}</TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => handleOpenDialog(materia)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(materia.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {materias.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No hay materias primas registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentMateria.id ? 'Editar' : 'Nueva'} Materia Prima</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre"
            fullWidth
            value={currentMateria.nombre || ''}
            onChange={(e) => setCurrentMateria({ ...currentMateria, nombre: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Cantidad Disponible"
            type="number"
            fullWidth
            value={currentMateria.cantidadDisponible}
            onChange={(e) => setCurrentMateria({ ...currentMateria, cantidadDisponible: Number(e.target.value) })}
            onFocus={(e) => e.target.select()}
          />
          <TextField
            margin="dense"
            label="Unidad de Medida"
            fullWidth
            placeholder="Ej: kg, litros, unidades"
            value={currentMateria.unidadMedida || ''}
            onChange={(e) => setCurrentMateria({ ...currentMateria, unidadMedida: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MateriasPrimasList;
