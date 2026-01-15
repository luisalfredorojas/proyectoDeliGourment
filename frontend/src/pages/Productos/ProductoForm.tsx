import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Box, Grid, Autocomplete,
  IconButton, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress
} from '@mui/material';
import { Save as SaveIcon, ArrowBack, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { productosService, MateriaPrimaRequerida } from '../../services/productosService';
import { materiasPrimasService, MateriaPrima } from '../../services/materiasPrimasService';

const ProductoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [materiasRequeridas, setMateriasRequeridas] = useState<MateriaPrimaRequerida[]>([]);
  
  const [allMaterias, setAllMaterias] = useState<MateriaPrima[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materiasData, productoData] = await Promise.all([
        materiasPrimasService.getMateriasPrimas(),
        id ? productosService.getProductos().then(list => list.find(p => p.id === id)) : Promise.resolve(null)
      ]);

      setAllMaterias(materiasData);

      if (productoData) {
        setNombre(productoData.nombre);
        setPrecio(Number(productoData.precio));
        setDescripcion(productoData.descripcion || '');
        // Map backend relation structure to frontend state if needed
        // Assuming backend returns nested structure: materiasPrimas: [{ materiaPrimaId, cantidadRequerida, materiaPrima: {...} }]
        if (productoData.materiasPrimas) {
            setMateriasRequeridas(productoData.materiasPrimas);
        }
      }
    } catch (error) {
      toast.error('Error al cargar datos');
      navigate('/productos');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddMateria = () => {
    setMateriasRequeridas([...materiasRequeridas, { materiaPrimaId: '', cantidadRequerida: 0 }]);
  };

  const handleRemoveMateria = (index: number) => {
    setMateriasRequeridas(materiasRequeridas.filter((_, i) => i !== index));
  };

  const handleMateriaChange = (index: number, field: keyof MateriaPrimaRequerida, value: any) => {
    const newMaterias = [...materiasRequeridas];
    newMaterias[index] = { ...newMaterias[index], [field]: value };
    setMateriasRequeridas(newMaterias);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || precio < 0) {
      toast.error('Nombre y precio son obligatorios');
      return;
    }

    // Validate raw materials
    const invalidMaterias = materiasRequeridas.some(m => !m.materiaPrimaId || m.cantidadRequerida <= 0);
    if (invalidMaterias) {
        toast.error('Todas las materias primas deben tener nombre y cantidad > 0');
        return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre,
        precio,
        descripcion,
        materiasPrimas: materiasRequeridas.map(m => ({
          materiaPrimaId: m.materiaPrimaId,
          cantidadRequerida: m.cantidadRequerida
        }))
      };

      if (isEdit && id) {
        await productosService.updateProducto(id, payload);
        toast.success('Producto actualizado');
      } else {
        await productosService.createProducto(payload);
        toast.success('Producto creado');
      }
      navigate('/productos');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/productos')} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Nombre del Producto"
                fullWidth
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Precio ($)"
                type="number"
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
                value={precio}
                onChange={(e) => setPrecio(Number(e.target.value))}
                onFocus={(e) => e.target.select()}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Receta (Materias Primas)
                <Button startIcon={<AddIcon />} onClick={handleAddMateria} size="small">
                  Agregar Insumo
                </Button>
              </Typography>
              
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Materia Prima</TableCell>
                    <TableCell width="150">Cantidad</TableCell>
                    <TableCell width="50"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materiasRequeridas.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          options={allMaterias}
                          getOptionLabel={(option) => `${option.nombre} (${option.unidadMedida})`}
                          value={allMaterias.find(m => m.id === item.materiaPrimaId) || null}
                          onChange={(_, newValue) => handleMateriaChange(index, 'materiaPrimaId', newValue?.id || '')}
                          renderInput={(params) => <TextField {...params} placeholder="Seleccionar insumo" required size="small" />}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={item.cantidadRequerida}
                          onChange={(e) => handleMateriaChange(index, 'cantidadRequerida', Number(e.target.value))}
                          inputProps={{ min: 0, step: 0.01 }}
                          onFocus={(e) => e.target.select()}
                          required
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => handleRemoveMateria(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {materiasRequeridas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ color: 'text.secondary' }}>
                        No hay materias primas asignadas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button variant="outlined" onClick={() => navigate('/productos')}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Producto'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ProductoForm;
