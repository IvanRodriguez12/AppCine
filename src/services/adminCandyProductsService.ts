/**
 * services/adminCandyProductsService.ts
 * Servicio para gestión de productos de Candy Shop (Admin)
 */

import apiClient, { handleApiResponse, handleApiError } from '@/api/client';
import { ApiResponse } from '@/types';

export type CandyCategoria = 'bebida' | 'comida' | 'otros';
export type CandyTipo = 'promocion' | 'bebida' | 'comida' | 'otros';
export type CandyTamanio = 'chico' | 'mediano' | 'grande';

export interface CandyProduct {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CandyCategoria;
  tipo: CandyTipo;
  precios: {
    chico: number;
    mediano: number;
    grande: number;
  };
  stock: number;
  activo: boolean;
  imagen?: string;
  imageKey?: string;
  creadoEn: string | Date;
  actualizadoEn: string | Date;
}

export interface ProductStats {
  total: number;
  activos: number;
  inactivos: number;
  sinStock: number;
  bajoStock: number;
  porCategoria: {
    bebida: number;
    comida: number;
    otros: number;
  };
  porTipo: {
    promocion: number;
    bebida: number;
    comida: number;
    otros: number;
  };
}

export interface StockAudit {
  id: string;
  productId: string;
  productName: string;
  stockAnterior: number;
  stockNuevo: number;
  diferencia: number;
  razon: string;
  adminId: string;
  action: string;
  updatedAt: string | Date;
}

export interface FiltrosProductos {
  activo?: boolean;
  sinStock?: boolean;
}

export interface AjustarStockResponse {
  message: string;
  productId: string;
  productName: string;
  stockAnterior: number;
  stockNuevo: number;
  diferencia: number;
}

export interface BulkStockItem {
  id: string;
  stock: number;
}

class AdminCandyProductsService {
  private baseUrl = '/admin/candy-products';

  /**
   * GET /admin/candy-products
   * Obtener todos los productos con filtros opcionales
   */
  async getProductos(filtros?: FiltrosProductos): Promise<
    ApiResponse<{
      productos: CandyProduct[];
      count: number;
      message?: string;
    }>
  > {
    try {
      console.log('🍬 [AdminCandyProductsService] Obteniendo productos con filtros:', filtros);

      const params = new URLSearchParams();
      if (filtros?.activo !== undefined) {
        params.append('activo', String(filtros.activo));
      }
      if (filtros?.sinStock) {
        params.append('sinStock', 'true');
      }

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      console.log('📡 Request URL:', endpoint);

      const response = await apiClient.get(endpoint);
      
      console.log('✅ [AdminCandyProductsService] Response completo:', JSON.stringify(response.data, null, 2));

      // El backend retorna: { message, count, productos }
      return {
        success: true,
        data: {
          productos: response.data.productos || [],
          count: response.data.count || 0,
          message: response.data.message,
        },
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error obteniendo productos:', error);
      return handleApiError(error);
    }
  }

  /**
   * GET /admin/candy-products/stats
   * Obtener estadísticas de productos
   */
  async getStats(): Promise<ApiResponse<{ data: ProductStats; message?: string }>> {
    try {
      console.log('📊 [AdminCandyProductsService] Obteniendo estadísticas...');

      const response = await apiClient.get(`${this.baseUrl}/stats`);
      
      console.log('✅ [AdminCandyProductsService] Stats recibidas:', JSON.stringify(response.data, null, 2));

      // El backend retorna: { message, data: { total, activos, ... } }
      return {
        success: true,
        data: {
          data: response.data.data || response.data,
          message: response.data.message,
        },
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error obteniendo stats:', error);
      return handleApiError(error);
    }
  }

  /**
   * GET /admin/candy-products/bajo-stock
   * Obtener productos con bajo stock
   */
  async getProductosBajoStock(umbral: number = 10): Promise<
    ApiResponse<{
      productos: CandyProduct[];
      umbral: number;
      count: number;
    }>
  > {
    try {
      console.log(`📦 [AdminCandyProductsService] Obteniendo productos con stock <= ${umbral}...`);

      const response = await apiClient.get(`${this.baseUrl}/bajo-stock?umbral=${umbral}`);

      return {
        success: true,
        data: {
          productos: response.data.productos || [],
          umbral: response.data.umbral || umbral,
          count: response.data.count || 0,
        },
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error obteniendo bajo stock:', error);
      return handleApiError(error);
    }
  }

  /**
   * Obtener detalle de un producto específico
   * Como el backend no tiene endpoint /admin/candy-products/:id,
   * obtenemos todos y filtramos por ID
   */
  async getProducto(id: string): Promise<ApiResponse<CandyProduct>> {
    try {
      console.log(`🔍 [AdminCandyProductsService] Buscando producto: ${id}`);

      const result = await this.getProductos();

      if (result.success && result.data) {
        const producto = result.data.productos.find((p) => p.id === id);
        
        if (producto) {
          console.log('✅ [AdminCandyProductsService] Producto encontrado:', producto.nombre);
          return { 
            success: true, 
            data: producto 
          };
        } else {
          console.warn('⚠️ [AdminCandyProductsService] Producto no encontrado');
          return { 
            success: false, 
            error: 'Producto no encontrado' 
          };
        }
      }

      return { 
        success: false, 
        error: result.error || 'Error al buscar producto' 
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error buscando producto:', error);
      return handleApiError(error);
    }
  }

  /**
   * PUT /admin/candy-products/:id/activate
   * Activar o desactivar producto
   */
  async cambiarEstadoActivo(
    id: string,
    activo: boolean
  ): Promise<
    ApiResponse<{
      message?: string;
      productId: string;
      nuevoEstado: boolean;
    }>
  > {
    try {
      console.log(`🔄 [AdminCandyProductsService] Cambiando estado de ${id} a ${activo ? 'ACTIVO' : 'INACTIVO'}`);

      const response = await apiClient.put(`${this.baseUrl}/${id}/activate`, {
        activo,
      });

      return {
        success: true,
        data: {
          message: response.data.message,
          productId: response.data.productId || id,
          nuevoEstado: response.data.nuevoEstado ?? activo,
        },
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error cambiando estado:', error);
      return handleApiError(error);
    }
  }

  /**
   * PUT /admin/candy-products/:id/stock
   * Ajustar stock de un producto
   */
  async ajustarStock(
    id: string,
    stock: number,
    razon?: string
  ): Promise<
    ApiResponse<{
      message?: string;
      productId: string;
      productName: string;
      stockAnterior: number;
      stockNuevo: number;
      diferencia: number;
    }>
  > {
    try {
      console.log(`📦 [AdminCandyProductsService] Ajustando stock de ${id} a ${stock}`);

      const response = await apiClient.put(`${this.baseUrl}/${id}/stock`, {
        stock,
        razon: razon || 'Ajuste manual desde app',
      });

      return {
        success: true,
        data: {
          message: response.data.message,
          productId: response.data.productId || id,
          productName: response.data.productName || '',
          stockAnterior: response.data.stockAnterior || 0,
          stockNuevo: response.data.stockNuevo || stock,
          diferencia: response.data.diferencia || 0,
        },
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error ajustando stock:', error);
      return handleApiError(error);
    }
  }

  /**
   * POST /admin/candy-products/bulk-stock
   * Ajustar stock de múltiples productos
   */
  async ajustarStockMasivo(
    productos: Array<{ id: string; stock: number }>,
    razon?: string
  ): Promise<
    ApiResponse<{
      message?: string;
      count: number;
      resultados: Array<{
        id: string;
        nombre: string;
        stockAnterior: number;
        stockNuevo: number;
        diferencia: number;
      }>;
    }>
  > {
    try {
      console.log(`📦 [AdminCandyProductsService] Ajuste masivo de ${productos.length} productos`);

      const response = await apiClient.post(`${this.baseUrl}/bulk-stock`, {
        productos,
        razon: razon || 'Ajuste masivo desde app',
      });

      return {
        success: true,
        data: {
          message: response.data.message,
          count: response.data.count || productos.length,
          resultados: response.data.resultados || [],
        },
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error en ajuste masivo:', error);
      return handleApiError(error);
    }
  }

  /**
   * GET /admin/candy-products/:id/audit
   * Obtener historial de cambios de stock
   */
  async getAuditoria(
    productId: string,
    limit: number = 50
  ): Promise<
    ApiResponse<{
      message?: string;
      productId: string;
      count: number;
      historial: StockAudit[];
    }>
  > {
    try {
      console.log(`📊 [AdminCandyProductsService] Obteniendo auditoría de ${productId}`);

      const response = await apiClient.get(`${this.baseUrl}/${productId}/audit?limit=${limit}`);

      return {
        success: true,
        data: {
          message: response.data.message,
          productId: response.data.productId || productId,
          count: response.data.count || 0,
          historial: response.data.historial || [],
        },
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error obteniendo auditoría:', error);
      return handleApiError(error);
    }
  }

  /**
   * DELETE /admin/candy-products/:id/hard-delete
   * Eliminar producto permanentemente
   */
  async eliminarProducto(id: string): Promise<
    ApiResponse<{
      message?: string;
      productId: string;
      productName: string;
      warning?: string;
    }>
  > {
    try {
      console.log(`🗑️ [AdminCandyProductsService] Eliminando producto: ${id}`);

      const response = await apiClient.delete(`${this.baseUrl}/${id}/hard-delete`, {
        data: {
          confirmar: 'SI_ELIMINAR_PERMANENTEMENTE',
        },
      });

      return {
        success: true,
        data: {
          message: response.data.message,
          productId: response.data.productId || id,
          productName: response.data.productName || '',
          warning: response.data.warning,
        },
      };
    } catch (error: any) {
      console.error('❌ [AdminCandyProductsService] Error eliminando producto:', error);
      return handleApiError(error);
    }
  }
}

export default new AdminCandyProductsService();