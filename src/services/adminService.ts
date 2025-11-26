import apiClient, { handleApiError, handleApiResponse } from '../api/client';
import { ApiResponse } from '../types';

// ==================== INTERFACES (coinciden con backend) ====================

export interface VentasMetrics {
  totalHoy: number;
  totalSemana: number;
  totalMes: number;
  totalGeneral: number;
  promedioOrden: number;
  ordenMasAlta: number;
}

export interface OrdenesMetrics {
  totalHoy: number;
  totalSemana: number;
  totalMes: number;
  totalGeneral: number;
  pendientes: number;
  canjeadas: number;
  canceladas: number;
  tasaCanje: number;
}

export interface ProductosMetrics {
  totalProductos: number;
  productosActivos: number;
  productosSinStock: number;
  productoMasVendido: {
    nombre: string;
    cantidadVendida: number;
  } | null;
}

export interface UsuariosMetrics {
  totalUsuarios: number;
  nuevosHoy: number;
  nuevosSemana: number;
  nuevosMes: number;
  conCompras: number;
}

export interface PeriodosMetrics {
  ultimosDias: Array<{
    fecha: string;
    ventas: number;
    ordenes: number;
  }>;
  comparacionMesAnterior: {
    ventasActual: number;
    ventasAnterior: number;
    diferenciaPorcentaje: number;
  };
}

export interface DashboardMetrics {
  ventas: VentasMetrics;
  ordenes: OrdenesMetrics;
  productos: ProductosMetrics;
  usuarios: UsuariosMetrics;
  periodos: PeriodosMetrics;
}

export interface ProductoBajoStock {
  id: string;
  nombre: string;
  stock: number;
  precio: number;
  activo: boolean;
}

export interface ProductoTopVendido {
  productId: string;
  nombre: string;
  cantidad: number;
  ingresos: number;
}

export interface VentasPorPeriodo {
  totalVentas: number;
  totalOrdenes: number;
  promedioOrden: number;
  ventasPorDia: Array<{
    fecha: string;
    ventas: number;
    ordenes: number;
  }>;
}

// ==================== SERVICIO ====================

class AdminService {
  private readonly BASE_PATH = '/admin/dashboard';

  /**
   * Obtiene todas las métricas del dashboard
   */
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    try {
      const response = await apiClient.get(this.BASE_PATH);
      return handleApiResponse<DashboardMetrics>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene resumen ejecutivo rápido
   */
  async getResumenRapido(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/resumen-rapido`);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene ventas por período
   */
  async getVentasPorPeriodo(
    fechaInicio: string,
    fechaFin: string
  ): Promise<ApiResponse<VentasPorPeriodo>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/ventas`, {
        params: { fechaInicio, fechaFin }
      });
      return handleApiResponse<VentasPorPeriodo>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene productos con bajo stock
   */
  async getProductosBajoStock(
    umbral: number = 10
  ): Promise<ApiResponse<ProductoBajoStock[]>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/productos/bajo-stock`, {
        params: { umbral }
      });
      return handleApiResponse<ProductoBajoStock[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene top productos vendidos
   */
  async getTopProductosVendidos(
    limit: number = 10
  ): Promise<ApiResponse<ProductoTopVendido[]>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/productos/top-vendidos`, {
        params: { limit }
      });
      return handleApiResponse<ProductoTopVendido[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }
}

export default new AdminService();