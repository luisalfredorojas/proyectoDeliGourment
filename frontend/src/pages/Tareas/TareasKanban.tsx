import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, CircularProgress, Alert, Button, TextField, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { toast } from 'react-toastify';
import { tareasService } from '../../services/tareasService';
import { rutasService } from '../../services/rutasService';
import { Tarea, TareaEstado, Ruta } from '../../types/entities';
import TareaCard from '../../components/Tareas/TareaCard';
import TareaDetailModal from '../../components/Tareas/TareaDetailModal';
import { ViewKanban as KanbanIcon } from '@mui/icons-material';

// Droppable column wrapper
const DroppableColumn: React.FC<{ children: React.ReactNode; id: string }> = ({ children, id }) => {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
};

const ESTADOS: TareaEstado[] = [
  TareaEstado.ABIERTO,
  TareaEstado.EN_ESPERA,
  TareaEstado.EN_PROCESO,
  TareaEstado.EMBALAJE,
  TareaEstado.LOGISTICA,
  TareaEstado.ENTREGADO,
  TareaEstado.CANCELADO,
];

const ESTADO_LABELS: Record<TareaEstado, string> = {
  [TareaEstado.ABIERTO]: 'Abierto',
  [TareaEstado.EN_PROCESO]: 'En Proceso',
  [TareaEstado.EN_ESPERA]: 'En Espera',
  [TareaEstado.EMBALAJE]: 'Embalaje',
  [TareaEstado.LOGISTICA]: 'Logística',
  [TareaEstado.ENTREGADO]: 'Entregado',
  [TareaEstado.CANCELADO]: 'Cancelado',
};

const ESTADO_COLORS: Record<TareaEstado, string> = {
  [TareaEstado.ABIERTO]: '#9e9e9e',
  [TareaEstado.EN_PROCESO]: '#2196f3',
  [TareaEstado.EN_ESPERA]: '#ff9800',
  [TareaEstado.EMBALAJE]: '#9c27b0',
  [TareaEstado.LOGISTICA]: '#f57c00',
  [TareaEstado.ENTREGADO]: '#4caf50',
  [TareaEstado.CANCELADO]: '#f44336',
};

const TareasKanban: React.FC = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekLabel, setWeekLabel] = useState<string>('');
  const [activeTarea, setActiveTarea] = useState<Tarea | null>(null);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterRuta, setFilterRuta] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    loadData();
  }, [filterRuta]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tareasData, rutasData] = await Promise.all([
        tareasService.getTareas({ rutaId: filterRuta || undefined }),
        rutasService.getRutas(),
      ]);
      
      // Helper: Get Monday of a given week
      const getMonday = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
      };
      
      // Get start of work week (Monday), considering Friday 11:30am rule
      const getWorkWeekStart = (): Date => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sunday, 5=Friday
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        // If Friday after 11:30am, "current week" becomes next week
        if (dayOfWeek === 5 && (hours > 11 || (hours === 11 && minutes >= 30))) {
          const nextMonday = getMonday(now);
          nextMonday.setDate(nextMonday.getDate() + 7);
          return nextMonday;
        }
        
        return getMonday(now);
      };
      
      // Filter tasks: only show tasks from current work week
      const mondayOfWeek = getWorkWeekStart();
      const nextMonday = new Date(mondayOfWeek);
      nextMonday.setDate(nextMonday.getDate() + 7);
      
      const filteredTareas = tareasData.filter((tarea) => {
        if (!tarea.pedido) return false;
        const fechaProduccion = new Date(tarea.pedido.fechaProduccion);
        // Must be >= Monday of current week and < Monday of next week
        return fechaProduccion >= mondayOfWeek && fechaProduccion < nextMonday;
      });
      
      // Generate week label
      const day = mondayOfWeek.getDate();
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const month = months[mondayOfWeek.getMonth()];
      setWeekLabel(`Semana del ${day} de ${month}`);
      
      setTareas(filteredTareas);
      setRutas(rutasData);
    } catch (error: any) {
      toast.error('Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  const getTareasByEstado = (estado: TareaEstado) => {
    return tareas.filter(t => t.estado === estado);
  };

  const getProductionSummary = () => {
    const tareasEnProceso = tareas.filter(t => t.estado === TareaEstado.EN_PROCESO);
    
    // Group products by name and sum quantities
    const productMap = new Map<string, number>();
    const consignmentMap = new Map<string, number>();
    
    tareasEnProceso.forEach(tarea => {
      // Sum production products
      tarea.pedido?.detalles?.forEach(detalle => {
        const productName = detalle.producto || 'Sin nombre';
        const currentQty = productMap.get(productName) || 0;
        productMap.set(productName, currentQty + (detalle.cantidad || 0));
      });
      
      // Sum consignment products
      if (tarea.pedido?.consignaciones) {
        try {
          const consignaciones = Array.isArray(tarea.pedido.consignaciones) 
            ? tarea.pedido.consignaciones 
            : JSON.parse(tarea.pedido.consignaciones as any);
          
          consignaciones.forEach((consig: any) => {
            const productName = consig.producto || 'Sin nombre';
            const currentQty = consignmentMap.get(productName) || 0;
            consignmentMap.set(productName, currentQty + (consig.cantidad || 0));
          });
        } catch (error) {
          console.error('Error parsing consignaciones:', error);
        }
      }
    });
    
    // Convert to array and sort by quantity descending
    const products = Array.from(productMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
    
    const consignments = Array.from(consignmentMap.entries())
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
    
    return {
      products,
      consignments,
      totalTareas: tareasEnProceso.length,
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const tarea = tareas.find(t => t.id === event.active.id);
    setActiveTarea(tarea || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTarea(null);

    console.log('🎯 Drag End:', { activeId: active.id, overId: over?.id, overData: over?.data });

    if (!over) return;

    const tareaId = active.id as string;
    
    // Get the estado - it might be over.id directly (dropped on column) or from the container (dropped on another task)
    let nuevoEstado: TareaEstado | undefined;
    
    // Check if we dropped directly on a column (droppable)
    if (ESTADOS.includes(over.id as TareaEstado)) {
      nuevoEstado = over.id as TareaEstado;
    } else {
      // We dropped on a task, find which column that task is in
      const targetTarea = tareas.find(t => t.id === over.id);
      if (targetTarea) {
        nuevoEstado = targetTarea.estado;
      }
    }

    if (!nuevoEstado) return;

    // No permitir arrastrar a CANCELADO
    if (nuevoEstado === TareaEstado.CANCELADO) {
      toast.warning('No se puede cambiar a CANCELADO mediante drag & drop. Use el botón "Cancelar Tarea" en el detalle.');
      return;
    }

    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea || tarea.estado === nuevoEstado) return;

    console.log('✅ Attempting state change:', { tareaId, from: tarea.estado, to: nuevoEstado });

    // Optimistic update
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: nuevoEstado } : t));

    try {
      await tareasService.cambiarEstado(tareaId, { nuevoEstado });
      toast.success(`Tarea movida a ${ESTADO_LABELS[nuevoEstado]}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al cambiar estado';
      toast.error(errorMessage);
      // Revert on error
      setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: tarea.estado } : t));
    }
  };

  const handleTareaClick = (tarea: Tarea) => {
    setSelectedTarea(tarea);
    setDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setDetailModalOpen(false);
    setSelectedTarea(null);
    loadData(); // Refresh to get updates
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
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <KanbanIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <div>
            <Typography variant="h4" fontWeight="bold">Tablero de Tareas</Typography>
            <Typography variant="body2" color="text.secondary">
              {weekLabel} · Arrastra las tarjetas para cambiar su estado · {tareas.length} tareas
            </Typography>
          </div>
        </Box>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel size="small">Filtrar por Ruta</InputLabel>
          <Select size="small" value={filterRuta} onChange={(e) => setFilterRuta(e.target.value)} label="Filtrar por Ruta">
            <MenuItem value="">Todas las rutas</MenuItem>
            {rutas.map(r => <MenuItem key={r.id} value={r.id}>{r.nombre}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Production Summary */}
      {(() => {
        const summary = getProductionSummary();
        return summary.products.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Paper elevation={2} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Resumen de Producción - {summary.totalTareas} {summary.totalTareas === 1 ? 'tarea' : 'tareas'} en proceso
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                {summary.products.map((product, index) => (
                  <Paper
                    key={index}
                    elevation={3}
                    sx={{
                      minWidth: 200,
                      p: 2.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {product.cantidad}
                    </Typography>
                    <Typography variant="body2" align="center" sx={{ opacity: 0.9 }}>
                      {product.nombre}
                    </Typography>
                  </Paper>
                ))}
                {/* Consignment Products */}
                {summary.consignments && summary.consignments.length > 0 && summary.consignments.map((consignment, index) => (
                  <Paper
                    key={`consig-${index}`}
                    elevation={3}
                    sx={{
                      minWidth: 200,
                      p: 2.5,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                      border: '2px solid #fbbf24',
                    }}
                  >
                    <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {consignment.cantidad}
                    </Typography>
                    <Typography variant="body2" align="center" sx={{ opacity: 0.9 }}>
                      {consignment.nombre}
                    </Typography>
                    <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.8, fontWeight: 'bold' }}>
                      🔄 CONSIGNACIÓN
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Box>
        ) : null;
      })()}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {ESTADOS.map(estado => {
            const tareasPorEstado = getTareasByEstado(estado);
            return (
              <DroppableColumn key={estado} id={estado}>
                <Paper
                  sx={{
                    minWidth: 300,
                    maxWidth: 300,
                    bgcolor: 'grey.50',
                    borderTop: 3,
                    borderColor: ESTADO_COLORS[estado],
                  }}
                >
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
                    <Typography variant="h6" fontSize="1rem" fontWeight="bold">
                      {ESTADO_LABELS[estado]}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tareasPorEstado.length} {tareasPorEstado.length === 1 ? 'tarea' : 'tareas'}
                    </Typography>
                  </Box>

                  <SortableContext id={estado} items={tareasPorEstado.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <Box sx={{ p: 2, minHeight: 600, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                      {tareasPorEstado.length === 0 ? (
                        <Alert severity="info" sx={{ mt: 2 }}>Sin tareas</Alert>
                      ) : (
                        tareasPorEstado.map(tarea => (
                          <div key={tarea.id} id={tarea.id}>
                            <TareaCard tarea={tarea} onClick={() => handleTareaClick(tarea)} />
                          </div>
                        ))
                      )}
                    </Box>
                  </SortableContext>
                </Paper>
              </DroppableColumn>
            );
          })}
        </Box>

        <DragOverlay>
          {activeTarea && <TareaCard tarea={activeTarea} onClick={() => {}} />}
        </DragOverlay>
      </DndContext>

      {selectedTarea && (
        <TareaDetailModal
          open={detailModalOpen}
          tarea={selectedTarea}
          onClose={handleModalClose}
        />
      )}
    </Container>
  );
};

export default TareasKanban;
