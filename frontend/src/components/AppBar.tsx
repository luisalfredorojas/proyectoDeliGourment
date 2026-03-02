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
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  Logout,
  Dashboard as DashboardIcon,
  ShoppingCart as CartIcon,
  ViewKanban as KanbanIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Menu as MenuIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RoleBadge from './RoleBadge';
import { UserRole } from '../types/auth';

const AppBar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    setMobileOpen(false);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" />, show: true },
    { label: 'Pedidos', path: '/pedidos', icon: <CartIcon fontSize="small" />, show: true },
    { label: 'Tareas', path: '/tareas', icon: <KanbanIcon fontSize="small" />, show: true },
    { label: 'Reportes', path: '/reportes', icon: <AssessmentIcon fontSize="small" />, show: canManage },
    { label: 'Inventario', path: '/inventario', icon: <InventoryIcon fontSize="small" />, show: user.rol === UserRole.ADMIN || user.rol === UserRole.ASISTENTE },
  ];

  const mobileDrawer = (
    <Drawer
      anchor="left"
      open={mobileOpen}
      onClose={() => setMobileOpen(false)}
      PaperProps={{ sx: { width: 260 } }}
    >
      <Box sx={{ px: 2, py: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" fontWeight="bold">🥖 DeliGourmet</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.85 }}>{user.nombre}</Typography>
        <Box sx={{ mt: 1 }}><RoleBadge rol={user.rol} size="small" /></Box>
      </Box>
      <Divider />
      <List>
        {navItems.filter(item => item.show).map(item => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton onClick={() => handleNavigate(item.path)}>
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
        {canManage && (
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/configuraciones')}>
              <ListItemIcon sx={{ minWidth: 36 }}><SettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Configuraciones" />
            </ListItemButton>
          </ListItem>
        )}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon sx={{ minWidth: 36 }}><Logout fontSize="small" color="error" /></ListItemIcon>
            <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ color: 'error' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );

  return (
    <>
      <MuiAppBar position="sticky" elevation={2}>
        <Toolbar>
          {/* Hamburger button - solo en móvil */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            🥖 DeliGourmet
          </Typography>

          {/* Nav buttons - solo en desktop */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1, ml: 4 }}>
            <Button color="inherit" onClick={() => navigate('/dashboard')} startIcon={<DashboardIcon />}>Dashboard</Button>
            <Button color="inherit" onClick={() => navigate('/pedidos')} startIcon={<CartIcon />}>Pedidos</Button>
            <Button color="inherit" onClick={() => navigate('/tareas')} startIcon={<KanbanIcon />}>Tareas</Button>
            {canManage && <Button color="inherit" onClick={() => navigate('/reportes')} startIcon={<AssessmentIcon />}>Reportes</Button>}
            {(user.rol === UserRole.ADMIN || user.rol === UserRole.ASISTENTE) && <Button color="inherit" onClick={() => navigate('/inventario')}>📦 Inventario</Button>}
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }} />

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

      {mobileDrawer}
    </>
  );
};

export default AppBar;
