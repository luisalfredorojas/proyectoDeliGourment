import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportesService } from '../../services/reportesService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ProductionReports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getProductionReport({
        fechaInicio,
        fechaFin,
      });
      setReportData(data);
      toast.success('Reporte generado exitosamente');
    } catch (error: any) {
      toast.error('Error al generar reporte');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Reporte de Producción', 14, 20);

    // Period
    doc.setFontSize(12);
    doc.text(`Período: ${reportData.periodo.inicio} - ${reportData.periodo.fin}`, 14, 30);
    doc.text(`Total de Tareas: ${reportData.totalTareas}`, 14, 38);

    // Products table
    autoTable(doc, {
      startY: 45,
      head: [['Producto', 'Cantidad']],
      body: reportData.productos.map((p: any) => [p.nombre, p.cantidad.toString()]),
      theme: 'grid',
    });

    // Routes table
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    autoTable(doc, {
      startY: finalY + 10,
      head: [['Ruta', 'Tareas']],
      body: reportData.rutas.map((r: any) => [r.nombre, r.tareas.toString()]),
      theme: 'grid',
    });

    doc.save(`reporte-produccion-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Products sheet
    const productsWs = XLSX.utils.json_to_sheet(reportData.productos);
    XLSX.utils.book_append_sheet(wb, productsWs, 'Productos');

    // Routes sheet
    const rutasWs = XLSX.utils.json_to_sheet(reportData.rutas);
    XLSX.utils.book_append_sheet(wb, rutasWs, 'Rutas');

    // Save
    XLSX.writeFile(wb, `reporte-produccion-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel generado exitosamente');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/reportes')}
          variant="outlined"
        >
          Volver
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            Reportes de Producción
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visualiza y exporta reportes de producción
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Fecha Inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Fecha Fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={loadReport}
              disabled={loading}
              sx={{ height: 56 }}
            >
              Generar Reporte
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {reportData && (
        <>
          {/* KPIs */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color="primary">
                    {reportData.totalTareas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tareas en Proceso
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" color="secondary">
                    {reportData.productos.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Productos Diferentes
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: '#ff9800' }}>
                    {reportData.rutas.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rutas Activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Export Buttons */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<PdfIcon />}
              onClick={exportToPDF}
            >
              Exportar PDF
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ExcelIcon />}
              onClick={exportToExcel}
            >
              Exportar Excel
            </Button>
          </Box>

          {/* Chart */}
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Productos en Producción
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.productos.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#667eea" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Tables */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Productos
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {reportData.productos.map((producto: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <Typography>{producto.nombre}</Typography>
                      <Typography fontWeight="bold">{producto.cantidad}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Rutas
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {reportData.rutas.map((ruta: any, index: number) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <Typography>{ruta.nombre}</Typography>
                      <Typography fontWeight="bold">{ruta.tareas} tareas</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {!reportData && !loading && (
        <Alert severity="info">
          Selecciona un rango de fechas y haz clic en "Generar Reporte" para ver los datos
        </Alert>
      )}
    </Container>
  );
};

export default ProductionReports;
