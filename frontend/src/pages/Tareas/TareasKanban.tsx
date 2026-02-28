import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, CircularProgress, Alert, MenuItem, Select, FormControl, InputLabel, IconButton, Button, Tooltip } from '@mui/material';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { toast } from 'react-toastify';
import { tareasService } from '../../services/tareasService';
import { rutasService } from '../../services/rutasService';
import { Tarea, TareaEstado, Ruta } from '../../types/entities';
import TareaCard from '../../components/Tareas/TareaCard';
import TareaDetailModal from '../../components/Tareas/TareaDetailModal';
import { ViewKanban as KanbanIcon, ChevronLeft, ChevronRight } from '@mui/icons-material';

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
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual, -1 = anterior, +1 = siguiente
  const [activeTarea, setActiveTarea] = useState<Tarea | null>(null);
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterRuta, setFilterRuta] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    loadData();
  }, [filterRuta, weekOffset]);

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

      // Get start of selected week (applying weekOffset in weeks from current)
      const mondayOfWeek = getMonday(new Date());
      mondayOfWeek.setDate(mondayOfWeek.getDate() + weekOffset * 7);
      const nextMonday = new Date(mondayOfWeek);
      nextMonday.setDate(nextMonday.getDate() + 7);
      
      const filteredTareas = tareasData.filter((tarea) => {
        if (!tarea.pedido) return false;
        const fechaProduccion = new Date(tarea.pedido.fechaProduccion);
        // Must be >= Monday of current week and < Monday of next week
        return fechaProduccion >= mondayOfWeek && fechaProduccion < nextMonday;
      });
      
      // Generate week label (Monday to Sunday)
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const sunday = new Date(nextMonday);
      sunday.setDate(sunday.getDate() - 1);
      const startLabel = `${mondayOfWeek.getDate()} ${months[mondayOfWeek.getMonth()]}`;
      const endLabel = `${sunday.getDate()} ${months[sunday.getMonth()]}`;
      setWeekLabel(`Semana del ${startLabel} al ${endLabel}`);
      
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

    const clientMap = new Map<string, number>();
    const consignmentMap = new Map<string, number>();
    const projectionMap = new Map<string, number>();

    tareasEnProceso.forEach(tarea => {
      if (tarea.pedido?.esProyeccion) {
        // Proyección: sumar detalles en grupo "Producir"
        tarea.pedido?.detalles?.forEach(detalle => {
          const name = detalle.producto || 'Sin nombre';
          projectionMap.set(name, (projectionMap.get(name) || 0) + (detalle.cantidad || 0));
        });
      } else {
        // Pedido de cliente: sumar detalles en grupo "Entregar"
        tarea.pedido?.detalles?.forEach(detalle => {
          const name = detalle.producto || 'Sin nombre';
          clientMap.set(name, (clientMap.get(name) || 0) + (detalle.cantidad || 0));
        });

        // Consignaciones del pedido
        if (tarea.pedido?.consignaciones) {
          try {
            const consignaciones = Array.isArray(tarea.pedido.consignaciones)
              ? tarea.pedido.consignaciones
              : JSON.parse(tarea.pedido.consignaciones as any);
            consignaciones.forEach((consig: any) => {
              const name = consig.producto || 'Sin nombre';
              consignmentMap.set(name, (consignmentMap.get(name) || 0) + (consig.cantidad || 0));
            });
          } catch (error) {
            console.error('Error parsing consignaciones:', error);
          }
        }
      }
    });

    const toArray = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

    return {
      clientProducts: toArray(clientMap),
      consignments: toArray(consignmentMap),
      projectionProducts: toArray(projectionMap),
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Tooltip title="Semana anterior">
                <IconButton size="small" onClick={() => setWeekOffset(w => w - 1)}>
                  <ChevronLeft fontSize="small" />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 200, textAlign: 'center' }}>
                {weekLabel}
              </Typography>
              <Tooltip title="Semana siguiente">
                <IconButton size="small" onClick={() => setWeekOffset(w => w + 1)}>
                  <ChevronRight fontSize="small" />
                </IconButton>
              </Tooltip>
              {weekOffset !== 0 && (
                <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => setWeekOffset(0)}>
                  Hoy
                </Button>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                · {tareas.length} tareas
              </Typography>
            </Box>
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
        const hasAny = summary.clientProducts.length > 0 || summary.consignments.length > 0 || summary.projectionProducts.length > 0;
        if (!hasAny) return null;

        const ProductCard = ({ nombre, cantidad, bg, border }: { nombre: string; cantidad: number; bg: string; border?: string }) => (
          <Paper
            elevation={3}
            sx={{
              width: 160,
              p: 2,
              background: bg,
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              ...(border && { border }),
            }}
          >
            <Typography variant="h3" fontWeight="bold" sx={{ mb: 0.5 }}>
              {cantidad}
            </Typography>
            <Typography variant="body2" align="center" sx={{ opacity: 0.9, lineHeight: 1.2 }}>
              {nombre}
            </Typography>
          </Paper>
        );

        const SummaryRow = ({ title, items, bg, border }: { title: string; items: { nombre: string; cantidad: number }[]; bg: string; border?: string }) => {
          if (items.length === 0) return null;
          return (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
                {title}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {items.map((item, i) => (
                  <ProductCard key={i} nombre={item.nombre} cantidad={item.cantidad} bg={bg} border={border} />
                ))}
              </Box>
            </Box>
          );
        };

        return (
          <Box sx={{ mb: 3 }}>
            <Paper elevation={2} sx={{ p: 2.5, bgcolor: '#f5f5f5' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Resumen de Producción · {summary.totalTareas} {summary.totalTareas === 1 ? 'tarea' : 'tareas'} en proceso
              </Typography>
              <SummaryRow
                title="Entregar"
                items={summary.clientProducts}
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              />
              <SummaryRow
                title="Consignación"
                items={summary.consignments}
                bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                border="2px solid #fbbf24"
              />
              <SummaryRow
                title="Producir"
                items={summary.projectionProducts}
                bg="linear-gradient(135deg, #757575 0%, #424242 100%)"
              />
            </Paper>
          </Box>
        );
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
