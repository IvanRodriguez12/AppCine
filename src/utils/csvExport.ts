import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Convierte un array de objetos a formato CSV
 */
export const convertToCSV = (data: any[], headers?: string[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Si no se proporcionan headers, usar las keys del primer objeto
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Crear fila de encabezados
  const headerRow = csvHeaders.join(',');
  
  // Crear filas de datos
  const dataRows = data.map(item => {
    return csvHeaders.map(header => {
      const value = item[header];
      
      // Manejar valores nulos o undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Convertir a string y escapar comillas
      const stringValue = String(value).replace(/"/g, '""');
      
      // Si contiene comas, saltos de línea o comillas, encerrar entre comillas
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  // Unir todo con saltos de línea
  return [headerRow, ...dataRows].join('\n');
};

/**
 * Exporta datos a CSV y permite compartir/descargar
 */
export const exportToCSV = async (
  data: any[],
  filename: string,
  headers?: string[]
): Promise<void> => {
  try {
    if (!data || data.length === 0) {
      Alert.alert('Error', 'No hay datos para exportar');
      return;
    }

    // Agregar extensión .csv si no la tiene
    const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    
    // Convertir datos a CSV
    const csvContent = convertToCSV(data, headers);
    
    // Agregar BOM (Byte Order Mark) para que Excel reconozca UTF-8
    const bom = '\uFEFF';
    const csvWithBOM = bom + csvContent;
    
    // Crear archivo temporal
    const fileUri = FileSystem.documentDirectory + csvFilename;
    
    await FileSystem.writeAsStringAsync(fileUri, csvWithBOM, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    
    // Verificar si se puede compartir
    const canShare = await Sharing.isAvailableAsync();
    
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar CSV',
        UTI: 'public.comma-separated-values-text',
      });
    } else {
      Alert.alert(
        'Exportación exitosa',
        `Archivo guardado en: ${fileUri}`,
        [{ text: 'OK' }]
      );
    }
    
    console.log('✅ CSV exportado:', fileUri);
  } catch (error) {
    console.error('❌ Error exportando CSV:', error);
    Alert.alert('Error', 'No se pudo exportar el archivo CSV');
    throw error;
  }
};

/**
 * Formatea métricas completas del dashboard para CSV
 */
export const formatDashboardMetricsForCSV = (metrics: any) => {
  const data = [
    // VENTAS
    { Categoría: 'VENTAS', Métrica: 'Total Hoy', Valor: metrics.ventas?.totalHoy || 0 },
    { Categoría: 'VENTAS', Métrica: 'Total Semana', Valor: metrics.ventas?.totalSemana || 0 },
    { Categoría: 'VENTAS', Métrica: 'Total Mes', Valor: metrics.ventas?.totalMes || 0 },
    { Categoría: 'VENTAS', Métrica: 'Total General', Valor: metrics.ventas?.totalGeneral || 0 },
    { Categoría: 'VENTAS', Métrica: 'Promedio por Orden', Valor: metrics.ventas?.promedioOrden || 0 },
    { Categoría: 'VENTAS', Métrica: 'Orden Más Alta', Valor: metrics.ventas?.ordenMasAlta || 0 },
    
    // ÓRDENES
    { Categoría: 'ÓRDENES', Métrica: 'Total Hoy', Valor: metrics.ordenes?.totalHoy || 0 },
    { Categoría: 'ÓRDENES', Métrica: 'Total Semana', Valor: metrics.ordenes?.totalSemana || 0 },
    { Categoría: 'ÓRDENES', Métrica: 'Total Mes', Valor: metrics.ordenes?.totalMes || 0 },
    { Categoría: 'ÓRDENES', Métrica: 'Pendientes', Valor: metrics.ordenes?.pendientes || 0 },
    { Categoría: 'ÓRDENES', Métrica: 'Canjeadas', Valor: metrics.ordenes?.canjeadas || 0 },
    { Categoría: 'ÓRDENES', Métrica: 'Canceladas', Valor: metrics.ordenes?.canceladas || 0 },
    { Categoría: 'ÓRDENES', Métrica: 'Tasa de Canje (%)', Valor: metrics.ordenes?.tasaCanje || 0 },
    
    // PRODUCTOS
    { Categoría: 'PRODUCTOS', Métrica: 'Total Productos', Valor: metrics.productos?.totalProductos || 0 },
    { Categoría: 'PRODUCTOS', Métrica: 'Productos Activos', Valor: metrics.productos?.productosActivos || 0 },
    { Categoría: 'PRODUCTOS', Métrica: 'Sin Stock', Valor: metrics.productos?.productosSinStock || 0 },
    { Categoría: 'PRODUCTOS', Métrica: 'Más Vendido', Valor: metrics.productos?.productoMasVendido?.nombre || 'N/A' },
    { Categoría: 'PRODUCTOS', Métrica: 'Cantidad Vendida', Valor: metrics.productos?.productoMasVendido?.cantidadVendida || 0 },
    
    // USUARIOS
    { Categoría: 'USUARIOS', Métrica: 'Total Usuarios', Valor: metrics.usuarios?.totalUsuarios || 0 },
    { Categoría: 'USUARIOS', Métrica: 'Nuevos Hoy', Valor: metrics.usuarios?.nuevosHoy || 0 },
    { Categoría: 'USUARIOS', Métrica: 'Nuevos Semana', Valor: metrics.usuarios?.nuevosSemana || 0 },
    { Categoría: 'USUARIOS', Métrica: 'Nuevos Mes', Valor: metrics.usuarios?.nuevosMes || 0 },
    { Categoría: 'USUARIOS', Métrica: 'Con Compras', Valor: metrics.usuarios?.conCompras || 0 },
    
    // COMPARACIÓN
    { Categoría: 'PERÍODO', Métrica: 'Ventas Mes Actual', Valor: metrics.periodos?.comparacionMesAnterior?.ventasActual || 0 },
    { Categoría: 'PERÍODO', Métrica: 'Ventas Mes Anterior', Valor: metrics.periodos?.comparacionMesAnterior?.ventasAnterior || 0 },
    { Categoría: 'PERÍODO', Métrica: 'Crecimiento (%)', Valor: metrics.periodos?.comparacionMesAnterior?.diferenciaPorcentaje || 0 },
  ];
  
  return data;
};

/**
 * Formatea ventas por día para CSV
 */
export const formatVentasPorDiaForCSV = (ventasPorDia: any[]) => {
  return ventasPorDia.map(dia => ({
    'Fecha': dia.fecha,
    'Ventas (ARS)': dia.ventas,
    'Cantidad de Órdenes': dia.ordenes,
  }));
};

/**
 * Formatea productos bajo stock para CSV
 */
export const formatProductosBajoStockForCSV = (productos: any[]) => {
  return productos.map(p => ({
    'ID': p.id,
    'Nombre': p.nombre,
    'Stock Actual': p.stock,
    'Precio': p.precio,
  }));
};

/**
 * Formatea top productos para CSV
 */
export const formatTopProductosForCSV = (productos: any[]) => {
  return productos.map(p => ({
    'ID': p.id,
    'Nombre': p.nombre,
    'Cantidad Vendida': p.cantidadVendida,
    'Ingresos Totales': p.ingresos,
  }));
};