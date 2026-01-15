import React, { useState } from 'react';
import {
  Container, Typography, Box, Paper, Grid, Card, CardContent,
  Button, CircularProgress, Alert, TextField,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon, TableChart as ExcelIcon,
  Refresh as RefreshIcon, ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportesService, DeliveryReportData } from '../../services/reportesService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const DeliveryReports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<DeliveryReportData | null>(null);
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getDeliveryReport({ fechaInicio, fechaFin });
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
    doc.setFontSize(18);
    doc.text('Reporte de Entregas', 14, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${reportData.periodo.inicio} - ${reportData.periodo.fin}`, 14, 30);
    doc.text(`Total Entregas: ${reportData.totalEntregas}`, 14, 38);

    autoTable(doc, {
      startY: 46,
      head: [['Ruta', 'Entregas']],
      body: reportData.rutas.map((r) => [r.nombre, r.entregas.toString()]),
      theme: 'grid',
    });

    doc.save(`reporte-entregas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const exportToExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();
    const rutasWs = XLSX.utils.json_to_sheet(reportData.rutas);
    XLSX.utils.book_append_sheet(wb, rutasWs, 'Entregas por Ruta');
    XLSX.writeFile(wb, `reporte-entregas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel generado exitosamente');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reportes')} variant="outlined">Volver</Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">Reportes de Entregas</Typography>
          <Typography variant="body2" color="text.secondary">Análisis de entregas por ruta y estado</Typography>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Filtros</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Fecha Inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Fecha Fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button fullWidth variant="contained" startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />} onClick={loadReport} disabled={loading} sx={{ height: 56 }}>Generar Reporte</Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.totalEntregas}</Typography>
                  <Typography variant="body2">Total Entregas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.rutas.length}</Typography>
                  <Typography variant="body2">Rutas Activas</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="error" startIcon={<PdfIcon />} onClick={exportToPDF}>Exportar PDF</Button>
            <Button variant="contained" color="success" startIcon={<ExcelIcon />} onClick={exportToExcel}>Exportar Excel</Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Entregas por Ruta</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.rutas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="entregas" fill="#ff9800" name="Entregas" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Estados</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={reportData.estados} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" outerRadius={100} label>
                      {reportData.estados.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}

      {!reportData && !loading && (
        <Alert severity="info">Selecciona un rango de fechas y haz clic en "Generar Reporte" para ver los datos</Alert>
      )}
    </Container>
  );
};

export default DeliveryReports;
