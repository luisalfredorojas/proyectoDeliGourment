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
import {clientesService } from '../../services/clientesService';
import { CreateClienteData, UpdateClienteData } from '../../types/entities';

const clienteSchema = z.object({
  razonSocial: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  ruc: z.string()
    .min(10, 'El CI/RUC debe tener entre 10 y 13 dígitos')
    .max(13, 'El CI/RUC debe tener entre 10 y 13 dígitos')
    .regex(/^\d+$/, 'El CI/RUC debe contener solo números'),
  direccion: z.string().min(5, 'Mínimo 5 caracteres').max(300, 'Máximo 300 caracteres'),
  ciudad: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  ubicacion: z.string().optional(),
  activo: z.boolean().optional(),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

const ClienteForm: React.FC = () => {
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
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      razonSocial: '',
      ruc: '',
      direccion: '',
      ciudad: '',
      telefono: '',
      email: '',
      ubicacion: '',
      activo: true,
    },
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadCliente(id);
    }
  }, [id, isEditMode]);

  const loadCliente = async (clienteId: string) => {
    try {
      setLoadingData(true);
      const cliente = await clientesService.getCliente(clienteId);
      setValue('razonSocial', cliente.razonSocial);
      setValue('ruc', cliente.ruc);
      setValue('direccion', cliente.direccion);
      setValue('ciudad', cliente.ciudad || '');
      setValue('telefono', cliente.telefono || '');
      setValue('email', cliente.email || '');
      setValue('ubicacion', cliente.ubicacion || '');
      setValue('activo', cliente.activo);
    } catch (error: any) {
      toast.error('Error al cargar cliente');
      navigate('/clientes');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: ClienteFormValues) => {
    setLoading(true);
    try {
      if (isEditMode && id) {
        const updateData: UpdateClienteData = data;
        await clientesService.updateCliente(id, updateData);
        toast.success('Cliente actualizado exitosamente');
      } else {
        const createData: CreateClienteData = {
          razonSocial: data.razonSocial,
          ruc: data.ruc,
          direccion: data.direccion,
          ciudad: data.ciudad,
          telefono: data.telefono,
          email: data.email,
          ubicacion: data.ubicacion,
        };
        await clientesService.createCliente(createData);
        toast.success('Cliente creado exitosamente');
      }
      navigate('/clientes');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al guardar cliente';
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
        onClick={() => navigate('/clientes')}
        sx={{ mb: 2 }}
      >
        Volver a Clientes
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          {isEditMode ? 'Editar Cliente' : 'Nuevo Cliente'}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {isEditMode ? 'Modifica los datos del cliente' : 'Completa el formulario para crear un nuevo cliente'}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Razón Social"
                {...register('razonSocial')}
                error={!!errors.razonSocial}
                helperText={errors.razonSocial?.message}
                required
                autoFocus
                placeholder="Ej: Panadería San José S.A.C."
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="CI/RUC"
                {...register('ruc')}
                error={!!errors.ruc}
                helperText={errors.ruc?.message}
                required
                placeholder="1234567890"
                inputProps={{ maxLength: 13 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                {...register('direccion')}
                error={!!errors.direccion}
                helperText={errors.direccion?.message}
                required
                placeholder="Av. Principal 123, Distrito"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ciudad"
                {...register('ciudad')}
                error={!!errors.ciudad}
                helperText={errors.ciudad?.message || 'Opcional'}
                placeholder="Lima"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                {...register('telefono')}
                error={!!errors.telefono}
                helperText={errors.telefono?.message || 'Opcional'}
                placeholder="01-1234567"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message || 'Opcional'}
                placeholder="contacto@cliente.com"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ubicación"
                {...register('ubicacion')}
                error={!!errors.ubicacion}
                helperText={errors.ubicacion?.message || 'Coordenadas GPS o referencia'}
                placeholder="-12.0464, -77.0428"
              />
            </Grid>

            {isEditMode && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...register('activo')}
                      defaultChecked
                    />
                  }
                  label="Cliente activo"
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => navigate('/clientes')}
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
                  {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Cliente'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default ClienteForm;
