import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
  Autocomplete,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon, ArrowBack } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { sucursalesService } from '../../services/sucursalesService';
import { clientesService } from '../../services/clientesService';
import { rutasService } from '../../services/rutasService';
import { Cliente, Ruta, CreateSucursalData, UpdateSucursalData } from '../../types/entities';

const sucursalSchema = z.object({
  clienteId: z.string().min(1, 'El cliente es requerido'),
  rutaId: z.string().min(1, 'La ruta es requerida'),
  nombre: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  activa: z.boolean().optional(),
});

type SucursalFormValues = z.infer<typeof sucursalSchema>;

const SucursalForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<SucursalFormValues>({
    resolver: zodResolver(sucursalSchema),
    defaultValues: { nombre: '', direccion: '', telefono: '', activa: true, clienteId: '', rutaId: '' },
  });

  const selectedClienteId = watch('clienteId');
  const selectedRutaId = watch('rutaId');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [clientesData, rutasData] = await Promise.all([
        clientesService.getClientes(),
        rutasService.getRutas(),
      ]);
      setClientes(clientesData);
      setRutas(rutasData);

      if (isEditMode && id) {
        const sucursal = await sucursalesService.getSucursal(id);
        setValue('clienteId', sucursal.clienteId);
        setValue('rutaId', sucursal.rutaId);
        setValue('nombre', sucursal.nombre);
        setValue('direccion', sucursal.direccion || '');
        setValue('telefono', sucursal.telefono || '');
        setValue('activa', sucursal.activa);
      }
    } catch (error: any) {
      toast.error('Error al cargar datos');
      if (isEditMode) navigate('/sucursales');
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: SucursalFormValues) => {
    setLoading(true);
    try {
      if (isEditMode && id) {
        const updateData: UpdateSucursalData = data;
        await sucursalesService.updateSucursal(id, updateData);
        toast.success('Sucursal actualizada exitosamente');
      } else {
        const createData: CreateSucursalData = {
          clienteId: data.clienteId,
          rutaId: data.rutaId,
          nombre: data.nombre,
          direccion: data.direccion,
          telefono: data.telefono,
        };
        await sucursalesService.createSucursal(createData);
        toast.success('Sucursal creada exitosamente');
      }
      navigate('/sucursales');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar sucursal');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </Container>
    );
  }

  const selectedCliente = clientes.find((c) => c.id === selectedClienteId);
  const selectedRuta = rutas.find((r) => r.id === selectedRutaId);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/sucursales')} sx={{ mb: 2 }}>Volver a Sucursales</Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {isEditMode ? 'Editar Sucursal' : 'Nueva Sucursal'}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {isEditMode ? 'Modifica los datos de la sucursal' : 'Completa el formulario para crear una nueva sucursal'}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Controller
                name="clienteId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={clientes}
                    getOptionLabel={(option) => option.razonSocial}
                    value={selectedCliente || null}
                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Cliente"
                        required
                        error={!!errors.clienteId}
                        helperText={errors.clienteId?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="rutaId"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={rutas}
                    getOptionLabel={(option) => option.nombre}
                    value={selectedRuta || null}
                    onChange={(_, newValue) => field.onChange(newValue?.id || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Ruta"
                        required
                        error={!!errors.rutaId}
                        helperText={errors.rutaId?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField fullWidth label="Nombre de la Sucursal" {...register('nombre')} error={!!errors.nombre} helperText={errors.nombre?.message} required autoFocus placeholder="Ej: Sucursal Centro" />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Dirección" {...register('direccion')} error={!!errors.direccion} helperText={errors.direccion?.message || 'Opcional'} placeholder="Calle Los Olivos 456" />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Teléfono" {...register('telefono')} error={!!errors.telefono} helperText={errors.telefono?.message || 'Opcional'} placeholder="01-9876543" />
            </Grid>

            {isEditMode && (
              <Grid item xs={12}>
                <FormControlLabel control={<Checkbox {...register('activa')} defaultChecked />} label="Sucursal activa" />
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => navigate('/sucursales')} disabled={loading}>Cancelar</Button>
                <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}>
                  {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Sucursal'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default SucursalForm;
