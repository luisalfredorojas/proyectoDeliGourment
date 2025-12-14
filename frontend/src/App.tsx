import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AppBar from './components/AppBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import RutasList from './pages/Rutas/RutasList';
import RutaForm from './pages/Rutas/RutaForm';
import ClientesList from './pages/Clientes/ClientesList';
import ClienteForm from './pages/Clientes/ClienteForm';
import SucursalesList from './pages/Sucursales/SucursalesList';
import SucursalForm from './pages/Sucursales/SucursalForm';
import PedidosList from './pages/Pedidos/PedidosList';
import PedidoForm from './pages/Pedidos/PedidoForm';
import MateriasPrimasList from './pages/MateriasPrimas/MateriasPrimasList';
import ProductosList from './pages/Productos/ProductosList';
import ProductoForm from './pages/Productos/ProductoForm';
import TareasKanban from './pages/Tareas/TareasKanban';
import UsersList from './pages/Users/UsersList';

import { UserRole } from './types/auth';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {isAuthenticated && <AppBar />}
      
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        {/* Rutas */}
        <Route path="/rutas" element={<ProtectedRoute><RutasList /></ProtectedRoute>} />
        <Route path="/rutas/new" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><RutaForm /></ProtectedRoute>} />
        <Route path="/rutas/:id/edit" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><RutaForm /></ProtectedRoute>} />

        {/* Clientes */}
        <Route path="/clientes" element={<ProtectedRoute><ClientesList /></ProtectedRoute>} />
        <Route path="/clientes/new" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASISTENTE]}><ClienteForm /></ProtectedRoute>} />
        <Route path="/clientes/:id/edit" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASISTENTE]}><ClienteForm /></ProtectedRoute>} />

        {/* Sucursales */}
        <Route path="/sucursales" element={<ProtectedRoute><SucursalesList /></ProtectedRoute>} />
        <Route path="/sucursales/new" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASISTENTE]}><SucursalForm /></ProtectedRoute>} />
        <Route path="/sucursales/:id/edit" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.ASISTENTE]}><SucursalForm /></ProtectedRoute>} />

        {/* Materias Primas */}
        <Route path="/materias-primas" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCCION]}>
            <MateriasPrimasList />
          </ProtectedRoute>
        } />

        {/* Productos */}
        <Route path="/productos" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCCION]}>
            <ProductosList />
          </ProtectedRoute>
        } />
        <Route path="/productos/nuevo" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCCION]}>
            <ProductoForm />
          </ProtectedRoute>
        } />
        <Route path="/productos/editar/:id" element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PRODUCCION]}>
            <ProductoForm />
          </ProtectedRoute>
        } />

        {/* Pedidos */}
        <Route path="/pedidos" element={<ProtectedRoute><PedidosList /></ProtectedRoute>} />
        <Route path="/pedidos/new" element={<ProtectedRoute allowedRoles={[UserRole.ASISTENTE, UserRole.ADMIN]}><PedidoForm /></ProtectedRoute>} />

        {/* Tareas */}
        <Route path="/tareas" element={<ProtectedRoute><TareasKanban /></ProtectedRoute>} />

        {/* Users */}
        <Route path="/usuarios" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><UsersList /></ProtectedRoute>} />
        <Route path="/register" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><Register /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  );
}

export default App;
