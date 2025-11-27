// src/services/adminTicketsService.ts
import apiClient, { handleApiError } from '../api/client';
import { ApiResponse } from '../types';

// Estados de ticket permitidos
export type TicketEstado = 'confirmado' | 'pendiente' | 'cancelado';

// Modelo que usaremos en el front para admin
export interface AdminTicket {
  id: string;
  userId: string;
  showtimeId: string;
  asientos: string[];
  total: number;
  metodoPago: string;
  estado: TicketEstado;
  createdAt: string;          // ya formateado a string ISO
  qrCodeUrl?: string | null;
  token?: string;
}

export interface TicketFilters {
  userId?: string;
  showtimeId?: string;
  estado?: TicketEstado;
  metodoPago?: string;
  fechaInicio?: string; // ISO (YYYY-MM-DD)
  fechaFin?: string;    // ISO (YYYY-MM-DD)
  limit?: number;
  startAfter?: string;
}

export interface TicketsPagination {
  count: number;
  hasMore: boolean;
  lastDocId: string | null;
}

export interface TicketsResponse {
  tickets: AdminTicket[];
  filtros?: Record<string, any>;
  pagination?: TicketsPagination | null;
}

export interface TicketStats {
  total: number;
  confirmados: number;
  pendientes: number;
  cancelados: number;
  porMetodoPago: Record<string, number>;
  asientosTotales: number;
  ingresosTotales: number;
  ingresosPorMetodo: Record<string, number>;
  ticketPromedio: number;
}

export interface TicketDetalleResponse {
  ticket: AdminTicket;
  showtime: any | null;
  user: any | null;
}

// Helpers internos
const formatTimestamp = (timestamp: any): string => {
  if (!timestamp) return '';
  if (typeof timestamp === 'string') return timestamp;

  try {
    if (timestamp.toDate) {
      // Firestore Timestamp
      return timestamp.toDate().toISOString();
    }
    if (timestamp._seconds) {
      // Timestamp serializado
      return new Date(timestamp._seconds * 1000).toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
  } catch {
    // ignore
  }

  return '';
};

const mapBackendTicketToAdminTicket = (backendTicket: any): AdminTicket => {
  return {
    id: backendTicket.id || backendTicket.ticketId || '',
    userId: backendTicket.userId,
    showtimeId: backendTicket.showtimeId,
    asientos: backendTicket.asientos || [],
    total: backendTicket.total || 0,
    metodoPago: backendTicket.metodoPago || backendTicket.paymentMethod || 'desconocido',
    estado: backendTicket.estado as TicketEstado,
    createdAt: formatTimestamp(backendTicket.createdAt),
    qrCodeUrl: backendTicket.qrCodeUrl || null,
    token: backendTicket.token,
  };
};

class AdminTicketsService {
  private readonly BASE_PATH = '/admin/tickets';

  /**
   * Lista tickets con filtros + paginación
   * (adaptado a la respuesta del backend: { message, filtros, data, pagination })
   */
  async getTickets(filtros?: TicketFilters): Promise<ApiResponse<TicketsResponse>> {
    try {
      const response = await apiClient.get(this.BASE_PATH, { params: filtros });
      const body: any = response.data || {};

      const backendTickets: any[] = body.data || [];
      const tickets: AdminTicket[] = backendTickets.map(mapBackendTicketToAdminTicket);

      const result: TicketsResponse = {
        tickets,
        filtros: body.filtros || {},
        pagination: body.pagination || null,
      };

      return {
        success: true,
        data: result,
        message: body.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Estadísticas generales de tickets
   * GET /admin/tickets/stats  -> { message, data: stats }
   */
  async getStats(): Promise<ApiResponse<TicketStats>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/stats`);
      const body: any = response.data || {};
      const stats: TicketStats = body.data || body; // por si viene sin "data"

      return {
        success: true,
        data: stats,
        message: body.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Detalle completo de ticket
   * GET /admin/tickets/:id -> { message, ticket, showtime, user }
   */
  async getDetalleTicket(id: string): Promise<ApiResponse<TicketDetalleResponse>> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/${id}`);
      const body: any = response.data || {};

      if (!body.ticket) {
        return {
          success: false,
          error: 'Respuesta inválida del servidor (ticket ausente)',
        };
      }

      const ticket = mapBackendTicketToAdminTicket(body.ticket);

      return {
        success: true,
        data: {
          ticket,
          showtime: body.showtime || null,
          user: body.user || null,
        },
        message: body.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Cambiar estado del ticket
   * PUT /admin/tickets/:id/status { estado }
   */
  async cambiarEstado(id: string, estado: TicketEstado): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`${this.BASE_PATH}/${id}/status`, { estado });
      return {
        success: true,
        data: response.data,
        message: response.data?.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Cancelar ticket y liberar asientos
   * POST /admin/tickets/:id/cancel { razon? }
   */
  async cancelarTicket(id: string, razon?: string): Promise<ApiResponse> {
    try {
      const response = await apiClient.post(`${this.BASE_PATH}/${id}/cancel`, { razon });
      return {
        success: true,
        data: response.data,
        message: response.data?.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }

  /**
   * Reenviar QR
   * POST /admin/tickets/:id/resend-qr
   */
  async reenviarQr(id: string): Promise<ApiResponse<{ qrCodeUrl?: string | null }>> {
    try {
      const response = await apiClient.post(`${this.BASE_PATH}/${id}/resend-qr`);
      const body: any = response.data || {};
      return {
        success: true,
        data: {
          qrCodeUrl: body.qrCodeUrl || null,
        },
        message: body.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  }
}

const adminTicketsService = new AdminTicketsService();
export default adminTicketsService;