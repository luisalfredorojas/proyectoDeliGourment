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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportesService, ConsignmentReportData } from '../../services/reportesService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ConsignmentReports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ConsignmentReportData | null>(null);
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getConsignmentReport({ fechaInicio, fechaFin });
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
    doc.text('Reporte de Consignaciones', 14, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${reportData.periodo.inicio} - ${reportData.periodo.fin}`, 14, 30);
    doc.text(`Total Consignaciones: ${reportData.totalConsignaciones}`, 14, 38);

    autoTable(doc, {
      startY: 46,
      head: [['Producto', 'Cantidad']],
      body: reportData.productos.map((p) => [p.nombre, p.cantidad.toString()]),
      theme: 'grid',
    });

    doc.save(`reporte-consignaciones-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const exportToExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();
    const productosWs = XLSX.utils.json_to_sheet(reportData.productos);
    XLSX.utils.book_append_sheet(wb, productosWs, 'Consignaciones');
    XLSX.writeFile(wb, `reporte-consignaciones-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel generado exitosamente');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reportes')} variant="outlined">Volver</Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">Reportes de Consignaciones</Typography>
          <Typography variant="body2" color="text.secondary">Productos en consignación</Typography>
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
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.totalConsignaciones}</Typography>
                  <Typography variant="body2">Total Productos en Consignación</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.totalPedidosConConsignacion}</Typography>
                  <Typography variant="body2">Pedidos con Consignación</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="error" startIcon={<PdfIcon />} onClick={exportToPDF}>Exportar PDF</Button>
            <Button variant="contained" color="success" startIcon={<ExcelIcon />} onClick={exportToExcel}>Exportar Excel</Button>
          </Box>

          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Productos en Consignación</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={reportData.productos.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#f59e0b" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </>
      )}

      {!reportData && !loading && (
        <Alert severity="info">Selecciona un rango de fechas y haz clic en "Generar Reporte" para ver los datos</Alert>
      )}
    </Container>
  );
};

export default ConsignmentReports;
