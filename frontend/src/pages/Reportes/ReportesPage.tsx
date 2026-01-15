import React from 'react';
import { Container, Typography, Box, Grid, Paper, Card, CardContent, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';

const ReportesPage: React.FC = () => {
  const navigate = useNavigate();

  const reportCategories = [
    {
      title: 'Reportes de Producción',
      description: 'Producción diaria, semanal y eficiencia',
      icon: <AssessmentIcon sx={{ fontSize: 60 }} />,
      color: '#667eea',
      path: '/reportes/produccion',
    },
    {
      title: 'Reportes de Ventas',
      description: 'Ventas por período, cliente y producto',
      icon: <TrendingUpIcon sx={{ fontSize: 60 }} />,
      color: '#4caf50',
      path: '/reportes/ventas',
    },
    {
      title: 'Reportes de Entregas',
      description: 'Entregas por ruta e historial',
      icon: <LocalShippingIcon sx={{ fontSize: 60 }} />,
      color: '#ff9800',
      path: '/reportes/entregas',
    },
    {
      title: 'Reportes de Consignaciones',
      description: 'Productos en consignación',
      icon: <InventoryIcon sx={{ fontSize: 60 }} />,
      color: '#f59e0b',
      path: '/reportes/consignaciones',
    },
    {
      title: 'Reportes Operativos',
      description: 'Cumplimiento y cancelaciones',
      icon: <BarChartIcon sx={{ fontSize: 60 }} />,
      color: '#9c27b0',
      path: '/reportes/operativos',
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📊 Módulo de Reportes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Genera y exporta reportes detallados de producción, ventas y operaciones
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {reportCategories.map((category, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              elevation={3}
              sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(category.path)}
                sx={{ height: '100%', p: 3 }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        bgcolor: category.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mb: 2,
                      }}
                    >
                      {category.icon}
                    </Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {category.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper elevation={2} sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          ℹ️ Información
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • Todos los reportes pueden ser exportados a PDF y Excel
          <br />
          • Utiliza los filtros para personalizar tus reportes
          <br />
          • Los datos se actualizan en tiempo real
        </Typography>
      </Paper>
    </Container>
  );
};

export default ReportesPage;
