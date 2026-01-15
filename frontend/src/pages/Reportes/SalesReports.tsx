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
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { reportesService, SalesReportData } from '../../services/reportesService';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const SalesReports: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<SalesReportData | null>(null);
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await reportesService.getSalesReport({
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
    doc.text('Reporte de Ventas', 14, 20);

    // Summary
    doc.setFontSize(12);
    doc.text(`Período: ${reportData.periodo.inicio} - ${reportData.periodo.fin}`, 14, 30);
    doc.text(`Total Ventas: $${reportData.totalVentas.toFixed(2)}`, 14, 38);
    doc.text(`Total Pedidos: ${reportData.totalPedidos}`, 14, 46);
    doc.text(`Promedio por Pedido: $${reportData.promedioVenta.toFixed(2)}`, 14, 54);

    // Top Clientes
    autoTable(doc, {
      startY: 62,
      head: [['Cliente', 'Total', 'Pedidos']],
      body: reportData.topClientes.map((c) => [
        c.nombre,
        `$${c.total.toFixed(2)}`,
        c.pedidos.toString(),
      ]),
      theme: 'grid',
    });

    // Top Productos
    const finalY = (doc as any).lastAutoTable.finalY || 62;
    autoTable(doc, {
      startY: finalY + 10,
      head: [['Producto', 'Cantidad', 'Ingresos']],
      body: reportData.topProductos.map((p) => [
        p.nombre,
        p.cantidad.toString(),
        `$${p.ingresos.toFixed(2)}`,
      ]),
      theme: 'grid',
    });

    doc.save(`reporte-ventas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF generado exitosamente');
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Reporte de Ventas'],
      [''],
      ['Período', `${reportData.periodo.inicio} - ${reportData.periodo.fin}`],
      ['Total Ventas', reportData.totalVentas],
      ['Total Pedidos', reportData.totalPedidos],
      ['Promedio por Pedido', reportData.promedioVenta],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

    // Daily sales sheet
    const dailyWs = XLSX.utils.json_to_sheet(reportData.ventasDiarias);
    XLSX.utils.book_append_sheet(wb, dailyWs, 'Ventas Diarias');

    // Top clients sheet
    const clientsWs = XLSX.utils.json_to_sheet(reportData.topClientes);
    XLSX.utils.book_append_sheet(wb, clientsWs, 'Top Clientes');

    // Top products sheet
    const productsWs = XLSX.utils.json_to_sheet(reportData.topProductos);
    XLSX.utils.book_append_sheet(wb, productsWs, 'Top Productos');

    XLSX.writeFile(wb, `reporte-ventas-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel generado exitosamente');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
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
            Reportes de Ventas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análisis de ventas por período, cliente y producto
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
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingUpIcon sx={{ fontSize: 50 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {formatCurrency(reportData.totalVentas)}
                      </Typography>
                      <Typography variant="body2">
                        Total Ventas
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="bold">
                    {reportData.totalPedidos}
                  </Typography>
                  <Typography variant="body2">
                    Total Pedidos
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(reportData.promedioVenta)}
                  </Typography>
                  <Typography variant="body2">
                    Promedio por Pedido
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

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Daily Sales Line Chart */}
            <Grid item xs={12} lg={8}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Ventas Diarias
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={reportData.ventasDiarias}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#667eea" strokeWidth={3} name="Ventas" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Top Clients Pie Chart */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top 5 Clientes
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={reportData.topClientes.slice(0, 5)}
                      dataKey="total"
                      nameKey="nombre"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.nombre}: ${formatCurrency(entry.total)}`}
                    >
                      {reportData.topClientes.slice(0, 5).map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Top Products Bar Chart */}
            <Grid item xs={12}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top Productos por Ingresos
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reportData.topProductos.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={120} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="ingresos" fill="#4caf50" name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* Tables */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top Clientes
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {reportData.topClientes.map((cliente, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderBottom: '1px solid #eee',
                        '&:hover': { bgcolor: '#f5f5f5' },
                      }}
                    >
                      <Box>
                        <Typography fontWeight="bold">{cliente.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {cliente.pedidos} pedidos
                        </Typography>
                      </Box>
                      <Typography fontWeight="bold" color="success.main">
                        {formatCurrency(cliente.total)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top Productos
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {reportData.topProductos.map((producto, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderBottom: '1px solid #eee',
                        '&:hover': { bgcolor: '#f5f5f5' },
                      }}
                    >
                      <Box>
                        <Typography fontWeight="bold">{producto.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {producto.cantidad} unidades
                        </Typography>
                      </Box>
                      <Typography fontWeight="bold" color="success.main">
                        {formatCurrency(producto.ingresos)}
                      </Typography>
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

export default SalesReports;
