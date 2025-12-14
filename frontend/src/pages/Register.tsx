import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  MenuItem,
  Grid,
  Alert,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';

// Validation schema
const registerSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirma tu contraseña'),
  rol: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Selecciona un rol válido' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { register: registerUser, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      rol: UserRole.ASISTENTE,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setSuccessMessage('');
    try {
      await registerUser({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        rol: data.rol,
      });
      setSuccessMessage(`Usuario ${data.email} creado exitosamente`);
      reset();
      // Redirect to users list after 2 seconds
      setTimeout(() => {
        navigate('/usuarios');
      }, 2000);
    } catch (error) {
      // Error is handled in AuthContext with toast
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not admin, show access denied (this is also protected by route guard)
  if (user && user.rol !== UserRole.ADMIN) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Acceso Denegado
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            No tienes permisos para acceder a esta página.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
          >
            Volver al Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/usuarios')}
            sx={{ mb: 2 }}
          >
            Volver a Usuarios
          </Button>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Registrar Nuevo Usuario
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Crea una nueva cuenta de usuario para el sistema
          </Typography>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre Completo"
                {...register('nombre')}
                error={!!errors.nombre}
                helperText={errors.nombre?.message}
                autoFocus
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
                autoComplete="email"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Rol"
                {...register('rol')}
                error={!!errors.rol}
                helperText={errors.rol?.message || 'Selecciona el rol del usuario'}
              >
                <MenuItem value={UserRole.ADMIN}>Administrador</MenuItem>
                <MenuItem value={UserRole.ASISTENTE}>Asistente</MenuItem>
                <MenuItem value={UserRole.PRODUCCION}>Producción</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirmar Contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                autoComplete="new-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<PersonAdd />}
                  disabled={isLoading}
                  sx={{ py: 1.5 }}
                >
                  {isLoading ? 'Creando Usuario...' : 'Crear Usuario'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => reset()}
                  disabled={isLoading}
                  sx={{ py: 1.5 }}
                >
                  Limpiar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>

        <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="caption" display="block" color="info.dark" fontWeight="bold">
            ℹ️ Información:
          </Typography>
          <Typography variant="caption" display="block" color="info.dark">
            • La contraseña debe tener al menos 6 caracteres
          </Typography>
          <Typography variant="caption" display="block" color="info.dark">
            • El usuario recibirá las credenciales por email (próximamente)
          </Typography>
          <Typography variant="caption" display="block" color="info.dark">
            • Solo los administradores pueden crear nuevos usuarios
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
