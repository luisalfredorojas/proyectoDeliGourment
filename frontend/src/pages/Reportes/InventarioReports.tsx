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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { reportesService, InventarioReportData } from '../../services/reportesService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const InventarioReports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<InventarioReportData | null>(null);
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getInventarioReport({ fechaInicio, fechaFin });
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
    doc.text('Reporte de Inventario', 14, 20);
    doc.setFontSize(12);
    doc.text(`Período: ${reportData.periodo.inicio} - ${reportData.periodo.fin}`, 14, 30);

    let y = 38;

    doc.setFontSize(14);
    doc.text(`Entregados — ${reportData.totalEntregados} unidades`, 14, y);
    y += 6;
    if (reportData.entregados.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Producto', 'Cantidad']],
        body: reportData.entregados.map((p) => [p.nombre, p.cantidad.toString()]),
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.setFontSize(14);
    doc.text(`Consignación — ${reportData.totalConsignaciones} unidades`, 14, y);
    y += 6;
    if (reportData.consignaciones.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Producto', 'Cantidad']],
        body: reportData.consignaciones.map((p) => [p.nombre, p.cantidad.toString()]),
        theme: 'grid',
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.setFontSize(14);
    doc.text(`Proyectados — ${reportData.totalProyectados} unidades`, 14, y);
    y += 6;
    if (reportData.proyectados.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Producto', 'Cantidad']],
        body: reportData.proyectados.map((p) => [p.nombre, p.cantidad.toString()]),
        theme: 'grid',
      });
    }

    doc.save(`reporte-inventario-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const exportToExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.entregados), 'Entregados');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.consignaciones), 'Consignacion');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reportData.proyectados), 'Proyectados');

    XLSX.writeFile(wb, `reporte-inventario-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel generado exitosamente');
  };

  const SectionChart = ({
    title,
    data,
    color,
    emptyMsg,
  }: {
    title: string;
    data: { nombre: string; cantidad: number }[];
    color: string;
    emptyMsg: string;
  }) => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      {data.length === 0 ? (
        <Alert severity="info">{emptyMsg}</Alert>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.slice(0, 10)} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" angle={-35} textAnchor="end" interval={0} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill={color} name="Cantidad" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reportes')} variant="outlined">
          Volver
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" fontWeight="bold">Reporte de Inventario</Typography>
          <Typography variant="body2" color="text.secondary">
            Productos entregados, en consignación y proyectados
          </Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Filtros</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth label="Fecha Inicio" type="date"
              value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth label="Fecha Fin" type="date"
              value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={loadReport} disabled={loading} sx={{ height: 56 }}
            >
              Generar Reporte
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {reportData && (
        <>
          {/* KPI Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.totalEntregados}</Typography>
                  <Typography variant="body2">Unidades Entregadas</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {reportData.entregados.length} producto(s) distintos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.totalConsignaciones}</Typography>
                  <Typography variant="body2">Unidades en Consignación</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {reportData.consignaciones.length} producto(s) distintos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #757575 0%, #424242 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h3" fontWeight="bold">{reportData.totalProyectados}</Typography>
                  <Typography variant="body2">Unidades Proyectadas</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {reportData.proyectados.length} producto(s) distintos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Export buttons */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="error" startIcon={<PdfIcon />} onClick={exportToPDF}>
              Exportar PDF
            </Button>
            <Button variant="contained" color="success" startIcon={<ExcelIcon />} onClick={exportToExcel}>
              Exportar Excel
            </Button>
          </Box>

          {/* Charts */}
          <SectionChart
            title="Entregados — Pedidos de clientes"
            data={reportData.entregados}
            color="#764ba2"
            emptyMsg="Sin productos entregados en este período"
          />
          <SectionChart
            title="Consignación"
            data={reportData.consignaciones}
            color="#f59e0b"
            emptyMsg="Sin productos en consignación en este período"
          />
          <SectionChart
            title="Proyectados — Producción por proyección"
            data={reportData.proyectados}
            color="#757575"
            emptyMsg="Sin productos proyectados en este período"
          />
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

export default InventarioReports;
