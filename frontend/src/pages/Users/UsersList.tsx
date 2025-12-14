import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Select, FormControl, InputLabel, Switch,
} from '@mui/material';
import { Edit as EditIcon, People as PeopleIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { usersService, User, UpdateUserDto } from '../../services/usersService';
import { UserRole } from '../../types/auth';

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserDto>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (error: any) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      nombre: user.nombre,
      rol: user.rol,
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setEditForm({});
  };

  const handleEditSave = async () => {
    if (!selectedUser) return;

    try {
      await usersService.updateUser(selectedUser.id, editForm);
      toast.success('Usuario actualizado correctamente');
      handleEditClose();
      await loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await usersService.toggleActive(user.id);
      toast.success(`Usuario ${user.activo ? 'desactivado' : 'activado'} correctamente`);
      await loadUsers();
    } catch (error: any) {
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const getRoleBadgeColor = (rol: string): 'success' | 'info' | 'warning' => {
    switch (rol) {
      case 'ADMIN': return 'success';
      case 'ASISTENTE': return 'info';
      case 'PRODUCCION': return 'warning';
      default: return 'info';
    }
  };

  const getRoleLabel = (rol: string): string => {
    switch (rol) {
      case 'ADMIN': return 'Administrador';
      case 'ASISTENTE': return 'Asistente';
      case 'PRODUCCION': return 'Producción';
      default: return rol;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        <div>
          <Typography variant="h4" fontWeight="bold">Gestión de Usuarios</Typography>
          <Typography variant="body2" color="text.secondary">Administra los usuarios del sistema</Typography>
        </div>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        {users.length === 0 ? (
          <Alert severity="info">No hay usuarios registrados</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Rol</strong></TableCell>
                  <TableCell align="center"><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.nombre}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip label={getRoleLabel(user.rol)} size="small" color={getRoleBadgeColor(user.rol)} />
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={user.activo}
                        onChange={() => handleToggleActive(user)}
                        color="success"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={() => handleEditClick(user)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={editForm.nombre || ''}
              onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select
                value={editForm.rol || ''}
                label="Rol"
                onChange={(e) => setEditForm({ ...editForm, rol: e.target.value as any })}
              >
                <MenuItem value={UserRole.ADMIN}>Administrador</MenuItem>
                <MenuItem value={UserRole.ASISTENTE}>Asistente</MenuItem>
                <MenuItem value={UserRole.PRODUCCION}>Producción</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancelar</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsersList;
