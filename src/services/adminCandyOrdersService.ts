import apiClient, { handleApiError, handleApiResponse } from '../api/client';
import { ApiResponse } from '../types';

// ==================== INTERFACES ====================

export type CandyPaymentStatus = 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
export type CandyRedeemStatus = 'PENDIENTE' | 'CANJEADO';

export interface CandyOrderItem {
  productId: string;
  nombre: string;
  tamanio: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface CandyOrder {
  id: string;
  userId: string;
  items: CandyOrderItem[];
  subtotal: number;
  descuento: number;
  feeServicio: number;
  total: number;
  paymentMethod: 'mercadopago' | 'efectivo';
  paymentStatus: CandyPaymentStatus;
  paymentId?: string;
  redeemCode: string;
  redeemStatus: CandyRedeemStatus;
  redeemedAt?: string | null;
  createdAt: string;
  canceledAt?: string;
  cancellationReason?: string;
}

export interface CandyOrderDetalle extends CandyOrder {
  usuario: {
    uid: string;
    displayName: string;
    email: string;
    phone?: string;
  } | null;
  productosDetalle: Array<CandyOrderItem & { stockActual: number | string }>;
}

export interface FiltrosOrdenes {
  paymentStatus?: CandyPaymentStatus;
  redeemStatus?: CandyRedeemStatus;
  userId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  limit?: number;
  startAfter?: string;
}

export interface OrdenesResponse {
  ordenes: CandyOrder[];
  count: number;
  hasMore: boolean;
  nextPageToken: string | null;
}

export interface EstadisticasOrdenes {
  total: number;
  pagadas: number;
  pendientes: number;
  canceladas: number;
  canjeadas: number;
  porCanjear: number;
  hoy: number;
  semana: number;
  mes: number;
  ventasTotales: number;
}

// ==================== SERVICIO ====================

class AdminCandyOrdersService {
  private readonly BASE_PATH = '/admin/candy-orders';

  /**
   * Obtiene todas las órdenes con filtros
   */
  async getOrdenes(filtros?: FiltrosOrdenes): Promise<ApiResponse<OrdenesResponse>> {
    try {
      const response = await apiClient.get(this.BASE_PATH, { params: filtros });
      return handleApiResponse<OrdenesResponse>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene estadísticas de órdenes
   */
  async getEstadisticas(): Promise<ApiResponse<EstadisticasOrdenes>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/stats`);
      return handleApiResponse<EstadisticasOrdenes>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Busca orden por código de canje
   */
  async buscarPorCodigo(codigo: string): Promise<ApiResponse<{ orden: CandyOrder }>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/search/${codigo}`);
      return handleApiResponse<{ orden: CandyOrder }>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Obtiene detalles completos de una orden
   */
  async getDetalleOrden(id: string): Promise<ApiResponse<{ orden: CandyOrderDetalle }>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/${id}`);
      return handleApiResponse<{ orden: CandyOrderDetalle }>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Cambia el estado de canje
   */
  async cambiarEstadoCanje(
    id: string,
    redeemStatus: CandyRedeemStatus
  ): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`${this.BASE_PATH}/${id}/redeem-status`, {
        redeemStatus,
      });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Cambia el estado de pago
   */
  async cambiarEstadoPago(
    id: string,
    paymentStatus: CandyPaymentStatus
  ): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`${this.BASE_PATH}/${id}/payment-status`, {
        paymentStatus,
      });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Cancela una orden
   */
  async cancelarOrden(id: string, razon?: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`${this.BASE_PATH}/${id}/cancel`, { razon });
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Fuerza el canje de una orden (casos especiales)
   */
  async forzarCanje(id: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`${this.BASE_PATH}/${id}/force-redeem`);
      return handleApiResponse(response);
    } catch (error) {
      return handleApiError(error);
    }
  }
}

export default new AdminCandyOrdersService();