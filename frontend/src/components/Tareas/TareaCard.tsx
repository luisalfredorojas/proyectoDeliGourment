import { Card, CardContent, Typography, Chip, Box, Avatar } from '@mui/material';
import { Comment as CommentIcon, AttachMoney as MoneyIcon, Route as RouteIcon, Store as StoreIcon, DragIndicator as DragIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { Tarea, EstadoProductoEnTarea } from '../../types/entities';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ESTADO_PRODUCTO_COLORS: Record<EstadoProductoEnTarea, string> = {
  [EstadoProductoEnTarea.PENDIENTE]: '#9e9e9e',
  [EstadoProductoEnTarea.EN_PROCESO]: '#2196f3',
  [EstadoProductoEnTarea.LISTO]: '#66bb6a',
  [EstadoProductoEnTarea.EN_LOGISTICA]: '#f57c00',
  [EstadoProductoEnTarea.ENTREGADO]: '#2e7d32',
};

interface TareaCardProps {
  tarea: Tarea;
  onClick: () => void;
}

const TareaCard: React.FC<TareaCardProps> = ({ tarea, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarea.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        bgcolor: tarea.pedido?.esProyeccion ? '#f0f0f0' : tarea.pedido?.soloConsignaciones ? '#fffbea' : 'white',
        borderLeft: tarea.pedido?.esProyeccion ? 4 : tarea.pedido?.soloConsignaciones ? 4 : 0,
        borderColor: tarea.pedido?.esProyeccion ? '#9e9e9e' : tarea.pedido?.soloConsignaciones ? '#f59e0b' : 'transparent',
        '&:hover': { 
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s'
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {/* Drag Handle */}
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' }, display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <DragIcon fontSize="small" />
          </Box>

          {/* Content - clickable */}
          <Box sx={{ flex: 1 }} onClick={onClick}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom noWrap>
              #{tarea.id.slice(-6)} - {tarea.pedido?.sucursal?.cliente?.razonSocial || 'Sin cliente'}
              {tarea.pedido?.esProyeccion && (
                <Chip label="📊 Proyección" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem', bgcolor: '#e0e0e0' }} />
              )}
            </Typography>
            
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom noWrap>
              <StoreIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
              {tarea.pedido?.sucursal?.nombre || 'Sin sucursal'}
            </Typography>

            <Box sx={{ mt: 1, mb: 1 }}>
              <Chip 
                icon={<RouteIcon />}
                label={tarea.pedido?.sucursal?.ruta?.nombre || 'Sin ruta'} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <MoneyIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="body2" fontWeight="bold" color="success.main">
                $ {tarea.pedido?.montoTotal ? Number(tarea.pedido.montoTotal).toFixed(2) : '0.00'}
              </Typography>
            </Box>

            {tarea.asignadoA && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Avatar sx={{ width: 20, height: 20, fontSize: '0.7rem', bgcolor: 'secondary.main' }}>
                  {getInitials(tarea.asignadoA.nombre)}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {tarea.asignadoA.nombre}
                </Typography>
              </Box>
            )}

            {/* Consignaciones */}
            {tarea.pedido?.consignaciones && Array.isArray(tarea.pedido.consignaciones) && tarea.pedido.consignaciones.length > 0 && (
              <Box sx={{ mt: 1, p: 1, bgcolor: '#fffbea', borderRadius: 1, borderLeft: 3, borderColor: '#f59e0b' }}>
                <Typography variant="caption" fontWeight="bold" color="#92400e" display="block">
                  🔄 Consignación (no producir):
                </Typography>
                {tarea.pedido.consignaciones.map((cons: any, idx: number) => (
                  <Typography key={idx} variant="caption" color="#92400e" display="block">
                    • {cons.producto}: {cons.cantidad}
                  </Typography>
                ))}
              </Box>
            )}

            {/* Per-product state indicator */}
            {tarea.productosEstado && tarea.productosEstado.length > 0 && (
              <Box sx={{ mt: 1, p: 1, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Estado productos:
                </Typography>
                {tarea.productosEstado.map((pe, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ESTADO_PRODUCTO_COLORS[pe.estado], flexShrink: 0 }} />
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1 }}>
                      {pe.productoNombre}
                    </Typography>
                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                      x{pe.cantidad}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <CalendarIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(tarea.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {formatDistanceToNow(new Date(tarea.fechaCreacion), { addSuffix: true, locale: es })}
                </Typography>
                {tarea._count && tarea._count.comentarios > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CommentIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {tarea._count.comentarios}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TareaCard;
