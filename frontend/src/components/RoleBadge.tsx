import React from 'react';
import { Chip } from '@mui/material';
import { UserRole } from '../types/auth';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import ConstructionIcon from '@mui/icons-material/Construction';

interface RoleBadgeProps {
  rol: UserRole;
  size?: 'small' | 'medium';
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ rol, size = 'small' }) => {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return {
          label: 'Administrador',
          color: 'primary' as const,
          icon: <AdminPanelSettingsIcon />,
        };
      case UserRole.ASISTENTE:
        return {
          label: 'Asistente',
          color: 'success' as const,
          icon: <PersonIcon />,
        };
      case UserRole.PRODUCCION:
        return {
          label: 'Producción',
          color: 'warning' as const,
          icon: <ConstructionIcon />,
        };
      default:
        return {
          label: role,
          color: 'default' as const,
          icon: <PersonIcon />,
        };
    }
  };

  const config = getRoleConfig(rol);

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      icon={config.icon}
      sx={{ fontWeight: 500 }}
    />
  );
};

export default RoleBadge;
