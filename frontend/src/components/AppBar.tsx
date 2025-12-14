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
  PersonAdd,
  Dashboard as DashboardIcon,
  Route as RouteIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  ShoppingCart as CartIcon,
  ViewKanban as KanbanIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Person as PersonIcon,
  ArrowDropDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import RoleBadge from './RoleBadge';
import { UserRole } from '../types/auth';

const AppBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [ventasMenuAnchor, setVentasMenuAnchor] = useState<null | HTMLElement>(null);
  const [produccionMenuAnchor, setProduccionMenuAnchor] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logout(); };
  const handleNavigate = (path: string) => { 
    handleClose(); 
    setVentasMenuAnchor(null);
    setProduccionMenuAnchor(null);
    navigate(path); 
  };

  if (!user) return null;

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  const isAdmin = user.rol === UserRole.ADMIN;
  const canManage = isAdmin || user.rol === UserRole.ASISTENTE;
  const canProduccion = isAdmin || user.rol === UserRole.PRODUCCION;

  return (
    <MuiAppBar position="sticky" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          🥖 DeliGourmet
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 1, ml: 4 }}>
          <Button color="inherit" onClick={() => navigate('/dashboard')} startIcon={<DashboardIcon />}>Dashboard</Button>
          
          {/* Ventas Dropdown */}
          {canManage && (
            <>
              <Button 
                color="inherit" 
                onClick={(e) => setVentasMenuAnchor(e.currentTarget)}
                endIcon={<ArrowDropDown />}
                startIcon={<BusinessIcon />}
              >
                Ventas
              </Button>
              <Menu
                anchorEl={ventasMenuAnchor}
                open={Boolean(ventasMenuAnchor)}
                onClose={() => setVentasMenuAnchor(null)}
              >
                {isAdmin && (
                  <MenuItem onClick={() => handleNavigate('/rutas')}>
                    <ListItemIcon><RouteIcon fontSize="small" /></ListItemIcon>
                    Rutas
                  </MenuItem>
                )}
                <MenuItem onClick={() => handleNavigate('/clientes')}>
                  <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
                  Clientes
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/sucursales')}>
                  <ListItemIcon><StoreIcon fontSize="small" /></ListItemIcon>
                  Sucursales
                </MenuItem>
              </Menu>
            </>
          )}
          
          <Button color="inherit" onClick={() => navigate('/pedidos')} startIcon={<CartIcon />}>Pedidos</Button>
          <Button color="inherit" onClick={() => navigate('/tareas')} startIcon={<KanbanIcon />}>Tareas</Button>
          
          {/* Producción Dropdown */}
          {canProduccion && (
            <>
              <Button 
                color="inherit" 
                onClick={(e) => setProduccionMenuAnchor(e.currentTarget)}
                endIcon={<ArrowDropDown />}
                startIcon={<InventoryIcon />}
              >
                Producción
              </Button>
              <Menu
                anchorEl={produccionMenuAnchor}
                open={Boolean(produccionMenuAnchor)}
                onClose={() => setProduccionMenuAnchor(null)}
              >
                {isAdmin && (
                  <MenuItem onClick={() => handleNavigate('/productos')}>
                    <ListItemIcon><InventoryIcon fontSize="small" /></ListItemIcon>
                    Productos
                  </MenuItem>
                )}
                <MenuItem onClick={() => handleNavigate('/materias-primas')}>
                  <ListItemIcon><CategoryIcon fontSize="small" /></ListItemIcon>
                  Materias Primas
                </MenuItem>
              </Menu>
            </>
          )}
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
            {isAdmin && <MenuItem onClick={() => handleNavigate('/rutas')}><ListItemIcon><RouteIcon fontSize="small" /></ListItemIcon>Rutas</MenuItem>}
            {canManage && <MenuItem onClick={() => handleNavigate('/clientes')}><ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>Clientes</MenuItem>}
            {canManage && <MenuItem onClick={() => handleNavigate('/sucursales')}><ListItemIcon><StoreIcon fontSize="small" /></ListItemIcon>Sucursales</MenuItem>}
            <MenuItem onClick={() => handleNavigate('/pedidos')}><ListItemIcon><CartIcon fontSize="small" /></ListItemIcon>Pedidos</MenuItem>
            <MenuItem onClick={() => handleNavigate('/tareas')}><ListItemIcon><KanbanIcon fontSize="small" /></ListItemIcon>Tareas</MenuItem>
            {(isAdmin || user.rol === UserRole.PRODUCCION) && (
              <>
                <MenuItem onClick={() => handleNavigate('/productos')}><ListItemIcon><InventoryIcon fontSize="small" /></ListItemIcon>Productos</MenuItem>
                <MenuItem onClick={() => handleNavigate('/materias-primas')}><ListItemIcon><CategoryIcon fontSize="small" /></ListItemIcon>Materias Primas</MenuItem>
              </>
            )}
            {isAdmin && (
              <>
                <Divider />
                <MenuItem onClick={() => handleNavigate('/usuarios')}><ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>Usuarios</MenuItem>
                <MenuItem onClick={() => handleNavigate('/register')}><ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon>Nuevo Usuario</MenuItem>
              </>
            )}

            <Divider />
            <MenuItem onClick={handleLogout}><ListItemIcon><Logout fontSize="small" color="error" /></ListItemIcon><Typography color="error">Cerrar Sesión</Typography></MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};

export default AppBar;
