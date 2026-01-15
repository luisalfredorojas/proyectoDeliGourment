import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { rutasService } from '../../services/rutasService';
import { CreateRutaData, UpdateRutaData } from '../../types/entities';

// Validation schema
const rutaSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().optional(),
  activa: z.boolean().optional(),
});

type RutaFormValues = z.infer<typeof rutaSchema>;

const RutaForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEditMode);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RutaFormValues>({
    resolver: zodResolver(rutaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      activa: true,
    },
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadRuta(id);
    }
  }, [id, isEditMode]);

  const loadRuta = async (rutaId: string) => {
    try {
      setLoadingData(true);
      const ruta = await rutasService.getRuta(rutaId);
      setValue('nombre', ruta.nombre);
      setValue('descripcion', ruta.descripcion || '');
      setValue('activa', ruta.activa);
    } catch (error: any) {
      toast.error('Error al cargar ruta');
      navigate('/rutas');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: RutaFormValues) => {
    setLoading(true);
    try {
      if (isEditMode && id) {
        const updateData: UpdateRutaData = data;
        await rutasService.updateRuta(id, updateData);
        toast.success('Ruta actualizada exitosamente');
      } else {
        const createData: CreateRutaData = {
          nombre: data.nombre,
          descripcion: data.descripcion,
        };
        await rutasService.createRuta(createData);
        toast.success('Ruta creada exitosamente');
      }
      navigate('/rutas');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al guardar ruta';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/rutas')}
        sx={{ mb: 2 }}
      >
        Volver a Rutas
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          {isEditMode ? 'Editar Ruta' : 'Nueva Ruta'}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {isEditMode ? 'Modifica los datos de la ruta' : 'Completa el formulario para crear una nueva ruta'}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre de la Ruta"
                {...register('nombre')}
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
                required
                autoFocus
                placeholder="Ej: Ruta Norte"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                {...register('descripcion')}
                error={!!errors.descripcion}
                helperText={errors.descripcion?.message || 'Opcional'}
                multiline
                rows={3}
                placeholder="Describe la zona o características de esta ruta"
              />
            </Grid>

            {isEditMode && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...register('activa')}
                      defaultChecked
                    />
                  }
                  label="Ruta activa"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/rutas')}
                  disabled={loading}
                >
                  Cancelar
</Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Ruta'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default RutaForm;
