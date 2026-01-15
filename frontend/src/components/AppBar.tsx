import React, { useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Divider,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  Logout,
  Dashboard as DashboardIcon,
  ShoppingCart as CartIcon,
  ViewKanban as KanbanIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RoleBadge from './RoleBadge';
import { UserRole } from '../types/auth';

const AppBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!user) return null;

  const canManage = user.rol === UserRole.ADMIN || user.rol === UserRole.ASISTENTE;

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <MuiAppBar position="sticky" elevation={2}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          🥖 DeliGourmet
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1, ml: 4 }}>
          <Button color="inherit" onClick={() => navigate('/dashboard')} startIcon={<DashboardIcon />}>Dashboard</Button>
          <Button color="inherit" onClick={() => navigate('/pedidos')} startIcon={<CartIcon />}>Pedidos</Button>
          <Button color="inherit" onClick={() => navigate('/tareas')} startIcon={<KanbanIcon />}>Tareas</Button>
          {canManage && <Button color="inherit" onClick={() => navigate('/reportes')} startIcon={<AssessmentIcon />}>Reportes</Button>}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}><RoleBadge rol={user.rol} /></Box>
          <IconButton onClick={handleMenu} color="inherit" size="large">
            <Avatar sx={{ bgcolor: 'secondary.main', width: 40, height: 40, fontSize: '1rem' }}>{getInitials(user.nombre)}</Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} PaperProps={{ elevation: 4, sx: { mt: 1.5, minWidth: 220 } }} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight="bold">{user.nombre}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">{user.email}</Typography>
              <Box sx={{ mt: 1 }}><RoleBadge rol={user.rol} size="small" /></Box>
            </Box>

            <Divider />
            <MenuItem onClick={() => handleNavigate('/dashboard')}><ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>Dashboard</MenuItem>
            {canManage && <MenuItem onClick={() => handleNavigate('/configuraciones')}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>Configuraciones</MenuItem>}

            <Divider />
            <MenuItem onClick={handleLogout}><ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon><Typography color="error">Cerrar Sesión</Typography></MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
