import React from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  Route as RouteIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/auth';

interface ConfigCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
  color: string;
}

const ConfiguracionesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  const configCards: ConfigCard[] = [
    // Ventas & Clientes
    {
      title: 'Rutas',
      description: 'Gestión de rutas de distribución',
      icon: <RouteIcon sx={{ fontSize: 48 }} />,
      path: '/rutas',
      roles: [UserRole.ADMIN],
      color: '#2196f3',
    },
    {
      title: 'Clientes',
      description: 'Administración de clientes',
      icon: <BusinessIcon sx={{ fontSize: 48 }} />,
      path: '/clientes',
      roles: [UserRole.ADMIN, UserRole.ASISTENTE],
      color: '#4caf50',
    },
    {
      title: 'Sucursales',
      description: 'Gestión de sucursales de clientes',
      icon: <StoreIcon sx={{ fontSize: 48 }} />,
      path: '/sucursales',
      roles: [UserRole.ADMIN, UserRole.ASISTENTE],
      color: '#ff9800',
    },
    // Producción
    {
      title: 'Productos',
      description: 'Catálogo de productos',
      icon: <InventoryIcon sx={{ fontSize: 48 }} />,
      path: '/productos',
      roles: [UserRole.ADMIN, UserRole.PRODUCCION],
      color: '#9c27b0',
    },
    {
      title: 'Materias Primas',
      description: 'Gestión de materias primas',
      icon: <CategoryIcon sx={{ fontSize: 48 }} />,
      path: '/materias-primas',
      roles: [UserRole.ADMIN, UserRole.ASISTENTE, UserRole.PRODUCCION],
      color: '#f44336',
    },
    // Sistema
    {
      title: 'Usuarios',
      description: 'Administración de usuarios del sistema',
      icon: <PersonIcon sx={{ fontSize: 48 }} />,
      path: '/usuarios',
      roles: [UserRole.ADMIN],
      color: '#607d8b',
    },
  ];

  // Filter cards based on user role
  const availableCards = configCards.filter((card) =>
    card.roles.includes(user.rol)
  );

  const renderSection = (title: string, cards: ConfigCard[]) => {
    if (cards.length === 0) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold" color="text.secondary">
          {title}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {cards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.path}>
              <Card 
                elevation={2}
                sx={{
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    elevation: 8,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardActionArea 
                  onClick={() => navigate(card.path)}
                  sx={{ height: '100%', p: 2 }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          color: card.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {card.icon}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {card.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {card.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const ventasCards = availableCards.filter((c) =>
    ['/rutas', '/clientes', '/sucursales'].includes(c.path)
  );
  const produccionCards = availableCards.filter((c) =>
    ['/productos', '/materias-primas'].includes(c.path)
  );
  const sistemaCards = availableCards.filter((c) =>
    ['/usuarios'].includes(c.path)
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Configuraciones
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Administra los módulos del sistema según tu rol de usuario
      </Typography>

      {renderSection('Ventas & Clientes', ventasCards)}
      {renderSection('Producción', produccionCards)}
      {renderSection('Sistema', sistemaCards)}
    </Container>
  );
};

export default ConfiguracionesPage;
