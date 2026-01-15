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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportesService, OperationalReportData } from '../../services/reportesService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const OperationalReports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<OperationalReportData | null>(null);
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getOperationalReport({ fechaInicio, fechaFin });
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
    doc.text('Reporte Operativo', 14, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${reportData.periodo.inicio} - ${reportData.periodo.fin}`, 14, 30);
    doc.text(`Total Tareas: ${reportData.totalTareas}`, 14, 38);
    doc.text(`Tareas Canceladas: ${reportData.tareasCanceladas} (${reportData.porcentajeCancelacion.toFixed(2)}%)`, 14, 46);

    autoTable(doc, {
      startY: 54,
      head: [['Estado', 'Cantidad']],
      body: reportData.estados.map((e) => [e.estado, e.cantidad.toString()]),
      theme: 'grid',
    });

    doc.save(`reporte-operativo-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const exportToExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();
    const estadosWs = XLSX.utils.json_to_sheet(reportData.estados);
    XLSX.utils.book_append_sheet(wb, estadosWs, 'Estados');
    const motivosWs = XLSX.utils.json_to_sheet(reportData.motivosCancelacion);
    XLSX.utils.book_append_sheet(wb, motivosWs, 'Motivos Cancelación');
    XLSX.writeFile(wb, `reporte-operativo-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel generado exitosamente');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reportes')} variant="outlined">Volver</Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">Reportes Operativos</Typography>
          <Typography variant="body2" color="text.secondary">Cumplimiento y cancelaciones</Typography>
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
            <Grid item xs={12} sm={4}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.totalTareas}</Typography>
                  <Typography variant="body2">Total Tareas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.tareasCanceladas}</Typography>
                  <Typography variant="body2">Tareas Canceladas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.porcentajeCancelacion.toFixed(1)}%</Typography>
                  <Typography variant="body2">% Cancelación</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="error" startIcon={<PdfIcon />} onClick={exportToPDF}>Exportar PDF</Button>
            <Button variant="contained" color="success" startIcon={<ExcelIcon />} onClick={exportToExcel}>Exportar Excel</Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Tareas por Estado</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie data={reportData.estados} dataKey="cantidad" nameKey="estado" cx="50%" cy="50%" outerRadius={100} label>
                      {reportData.estados.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>Motivos de Cancelación</Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.motivosCancelacion}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="motivo" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cantidad" fill="#f5576c" name="Cantidad" />
                  </BarChart>
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

export default OperationalReports;
