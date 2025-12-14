import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types/auth';
import AdminDashboard from '../components/Dashboard/AdminDashboard';
import OperativesDashboard from '../components/Dashboard/OperativesDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Admin sees full dashboard
  if (user?.rol === UserRole.ADMIN) {
    return <AdminDashboard />;
  }

  // Asistente and Produccion see simplified dashboard
  return <OperativesDashboard />;
};

export default Dashboard;
