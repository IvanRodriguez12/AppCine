// services/adminCouponService.ts - VERSIÓN COMPLETA CORREGIDA
import apiClient, { handleApiResponse, handleApiError } from '../api/client';
import { ADMIN_ENDPOINTS } from '../api/endpoints';
import { Coupon, CouponScope, CouponMode } from '../types/coupon';

export interface FiltrosCuponesAdmin {
  scope?: CouponScope;
  mode?: CouponMode;
  active?: boolean;
  premiumOnly?: boolean;
  limit?: number;
  startAfter?: string;
}

export interface EstadisticasCupones {
  total: number;
  activos: number;
  inactivos: number;
  porScope: Record<CouponScope, number>;
  porModo: Record<CouponMode, number>;
  premiumOnly: number;
  expirados: number;
  proximosAExpirar: number;
}

export interface CreateCouponData {
  code: string;
  scope: CouponScope;
  mode: CouponMode;
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  premiumOnly?: boolean;
  minAmount?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
}

export interface UpdateCouponData {
  scope?: CouponScope;
  mode?: CouponMode;
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  premiumOnly?: boolean;
  minAmount?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
  active?: boolean;
}

export interface BulkCreateData {
  prefix: string;
  quantity: number;
  scope: CouponScope;
  mode: CouponMode;
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  premiumOnly?: boolean;
  minAmount?: number;
  maxDiscount?: number;
  validFrom?: string;
  validTo?: string;
}

export interface CouponListResponse {
  message: string;
  filtros: FiltrosCuponesAdmin;
  data: Coupon[];
  pagination: {
    count: number;
    hasMore: boolean;
    lastDocId: string | null;
  };
}

export interface CouponStatsResponse {
  message: string;
  data: EstadisticasCupones;
}

export interface CouponDetailResponse {
  message: string;
  coupon: Coupon;
}

export interface CreateCouponResponse {
  message: string;
  couponId: string;
  code: string;
}

export interface BulkCreateResponse {
  message: string;
  prefix: string;
  quantity: number;
  codes: string[];
}

/**
 * Función helper mejorada para manejar respuestas
 */
const handleApiResponseSafe = <T = any>(response: any): T => {
  console.log('🔍 handleApiResponseSafe - Response:', {
    status: response.status,
    data: response.data
  });

  if (!response) {
    throw new Error('No se recibió respuesta del servidor');
  }

  // Si la respuesta ya es el array de datos que necesitamos
  if (Array.isArray(response.data)) {
    return {
      success: true,
      data: response.data
    } as any;
  }

  // Si la respuesta tiene estructura { success, data, error }
  if (response.data && typeof response.data === 'object') {
    if (response.data.success === false) {
      throw new Error(response.data.error || 'Error en la operación');
    }
    return response.data;
  }

  // Si no hay data pero la respuesta fue exitosa
  if (response.status >= 200 && response.status < 300) {
    return {
      success: true,
      data: response.data
    } as any;
  }

  throw new Error('Estructura de respuesta no reconocida');
};

/**
 * Convierte un cupón del backend al formato frontend
 */
const convertBackendCouponToFrontend = (backendCoupon: any): Coupon => {
  const convertTimestampToISO = (timestamp: any): string => {
    if (!timestamp) return '';
    if (timestamp.toDate) {
      return timestamp.toDate().toISOString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toISOString();
    }
    return '';
  };

  return {
    id: backendCoupon.id || backendCoupon.couponId || '',
    code: backendCoupon.code || '',
    scope: backendCoupon.scope || 'both',
    mode: backendCoupon.mode || 'fixed',
    value: backendCoupon.value || 0,
    buyQuantity: backendCoupon.buyQuantity || 0,
    payQuantity: backendCoupon.payQuantity || 0,
    premiumOnly: backendCoupon.premiumOnly ?? false,
    minAmount: backendCoupon.minAmount || 0,
    maxDiscount: backendCoupon.maxDiscount || 0,
    active: backendCoupon.active ?? true,
    createdAt: convertTimestampToISO(backendCoupon.createdAt),
    validFrom: convertTimestampToISO(backendCoupon.validFrom),
    validTo: convertTimestampToISO(backendCoupon.validTo),
  };
};

class AdminCouponService {
  /**
   * Obtiene todos los cupones con filtros - CORREGIDO
   */
  async obtenerTodosLosCupones(filtros: FiltrosCuponesAdmin = {}): Promise<CouponListResponse> {
    try {
      console.log('🔄 Iniciando obtención de cupones con filtros:', filtros);
      
      const response = await apiClient.get(ADMIN_ENDPOINTS.COUPONS, { params: filtros });
      console.log('✅ Respuesta completa recibida:', {
        status: response.status,
        data: response.data
      });

      // 🔍 DEBUG: Analizar estructura completa
      console.log('🔍 DEBUG - Estructura de respuesta:');
      console.log('1. response.data:', response.data);
      console.log('2. Tipo de response.data:', typeof response.data);
      console.log('3. Es array?:', Array.isArray(response.data));
      
      if (response.data && typeof response.data === 'object') {
        console.log('4. Keys de response.data:', Object.keys(response.data));
        
        // Buscar arrays anidados
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            console.log(`5. Array encontrado en key "${key}":`, response.data[key].length, 'elementos');
          }
        }
      }

      let cuponesData: any[] = [];
      let message = 'Cupones cargados';
      let pagination = {
        count: 0,
        hasMore: false,
        lastDocId: null
      };

      // 🔧 CORRECCIÓN: Manejar múltiples estructuras posibles
      if (Array.isArray(response.data)) {
        // Caso 1: La respuesta ES el array de cupones
        cuponesData = response.data;
        message = `Se encontraron ${cuponesData.length} cupones`;
      }
      else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Caso 2: Los cupones están en data.data (estructura común)
        cuponesData = response.data.data;
        message = response.data.message || `Se encontraron ${cuponesData.length} cupones`;
        pagination = response.data.pagination || pagination;
      }
      else if (response.data && response.data.cupones && Array.isArray(response.data.cupones)) {
        // Caso 3: Los cupones están en data.cupones
        cuponesData = response.data.cupones;
        message = response.data.message || `Se encontraron ${cuponesData.length} cupones`;
        pagination = response.data.pagination || pagination;
      }
      else if (response.data && Array.isArray(response.data.items)) {
        // Caso 4: Los cupones están en data.items
        cuponesData = response.data.items;
        message = response.data.message || `Se encontraron ${cuponesData.length} cupones`;
        pagination = response.data.pagination || pagination;
      }
      else if (response.data && response.data.data && response.data.data.cupones && Array.isArray(response.data.data.cupones)) {
        // Caso 5: Estructura anidada data.data.cupones
        cuponesData = response.data.data.cupones;
        message = response.data.message || `Se encontraron ${cuponesData.length} cupones`;
        pagination = response.data.data.pagination || pagination;
      }
      else {
        console.warn('⚠️ Estructura de respuesta no reconocida, intentando extraer arrays...');
        
        // Buscar cualquier array en la respuesta
        const findArrays = (obj: any): any[] => {
          if (Array.isArray(obj)) return obj;
          if (obj && typeof obj === 'object') {
            for (const key in obj) {
              const result = findArrays(obj[key]);
              if (result.length > 0) return result;
            }
          }
          return [];
        };
        
        cuponesData = findArrays(response.data);
        if (cuponesData.length > 0) {
          console.log(`✅ Se encontraron ${cuponesData.length} cupones en estructura anidada`);
          message = `Se encontraron ${cuponesData.length} cupones`;
        } else {
          message = 'No se encontraron cupones en la respuesta';
        }
      }

      console.log('📦 Datos procesados:', {
        message,
        dataLength: cuponesData.length,
        isArray: Array.isArray(cuponesData),
        firstItem: cuponesData[0]
      });
      
      // Convertir los cupones
      const cuponesConvertidos: Coupon[] = cuponesData
        .filter(item => item && (item.id || item.code)) // Filtrar items válidos
        .map(convertBackendCouponToFrontend);
    
      console.log(`✅ ${cuponesConvertidos.length} cupones convertidos exitosamente`);
      
      const result: CouponListResponse = {
        message,
        filtros,
        data: cuponesConvertidos,
        pagination
      };
      
      console.log('🎯 Resultado final:', {
        message: result.message,
        cuponesCount: result.data.length,
        pagination: result.pagination
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Error en obtenerTodosLosCupones:', error);
      // Retornar estructura con array vacío en caso de error
      return {
        message: 'Error al cargar cupones: ' + (error as any).message,
        filtros: filtros,
        data: [],
        pagination: {
          count: 0,
          hasMore: false,
          lastDocId: null
        }
      };
    }
  }

  /**
   * Obtiene estadísticas de cupones - CORREGIDO
   */
  async obtenerEstadisticasCupones(): Promise<EstadisticasCupones> {
    try {
      console.log('📊 Solicitando estadísticas de cupones...');
      const response = await apiClient.get(`${ADMIN_ENDPOINTS.COUPONS}/stats`);
      
      console.log('📈 Respuesta de estadísticas:', response.data);

      // Manejar diferentes estructuras de respuesta
      let statsData: any = response.data;
      
      if (response.data && response.data.data) {
        statsData = response.data.data;
      }

      console.log('📊 Stats data procesado:', statsData);

      // Validar y retornar estadísticas
      if (statsData && typeof statsData === 'object') {
        const estadisticas: EstadisticasCupones = {
          total: statsData.total || 0,
          activos: statsData.activos || 0,
          inactivos: statsData.inactivos || 0,
          porScope: statsData.porScope || { tickets: 0, candyshop: 0, both: 0 },
          porModo: statsData.porModo || { fixed: 0, percent: 0, '2x1': 0, '3x2': 0 },
          premiumOnly: statsData.premiumOnly || 0,
          expirados: statsData.expirados || 0,
          proximosAExpirar: statsData.proximosAExpirar || 0
        };
        
        console.log('✅ Estadísticas válidas encontradas:', estadisticas);
        return estadisticas;
      } else {
        console.warn('⚠️ Estructura de estadísticas inesperada, retornando valores por defecto');
        return {
          total: 0,
          activos: 0,
          inactivos: 0,
          porScope: { tickets: 0, candyshop: 0, both: 0 },
          porModo: { fixed: 0, percent: 0, '2x1': 0, '3x2': 0 },
          premiumOnly: 0,
          expirados: 0,
          proximosAExpirar: 0
        };
      }
      
    } catch (error) {
      console.error('❌ Error en obtenerEstadisticasCupones:', error);
      return {
        total: 0,
        activos: 0,
        inactivos: 0,
        porScope: { tickets: 0, candyshop: 0, both: 0 },
        porModo: { fixed: 0, percent: 0, '2x1': 0, '3x2': 0 },
        premiumOnly: 0,
        expirados: 0,
        proximosAExpirar: 0
      };
    }
  }

  /**
   * Busca cupón por código - CORREGIDO
   */
  async buscarCuponPorCodigo(codigo: string): Promise<Coupon> {
    try {
      const response = await apiClient.get(`${ADMIN_ENDPOINTS.COUPONS}/search/${encodeURIComponent(codigo)}`);
      const data = handleApiResponseSafe<CouponDetailResponse>(response);
      
      console.log('🔍 Datos de búsqueda:', data);
      
      // Manejar tanto data.coupon como data directamente
      const couponData = data.coupon || data;
      
      if (!couponData) {
        throw new Error('Cupón no encontrado en la respuesta');
      }
      
      console.log('✅ Cupón encontrado:', couponData.code);
      return convertBackendCouponToFrontend(couponData);
    } catch (error) {
      console.error('❌ Error en buscarCuponPorCodigo:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Obtiene detalles de un cupón - CORREGIDO
   */
  async obtenerDetalleCupon(cuponId: string): Promise<Coupon> {
    try {
      const response = await apiClient.get(`${ADMIN_ENDPOINTS.COUPONS}/${cuponId}`);
      const data = handleApiResponseSafe<CouponDetailResponse>(response);
      
      console.log('📄 Datos de detalle:', data);
      
      // Manejar tanto data.coupon como data directamente
      const couponData = data.coupon || data;
      
      if (!couponData) {
        throw new Error('Cupón no encontrado en la respuesta');
      }
      
      console.log('✅ Detalles del cupón cargados:', couponData.code);
      return convertBackendCouponToFrontend(couponData);
    } catch (error) {
      console.error('❌ Error en obtenerDetalleCupon:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Crea un nuevo cupón
   */
  async crearCupon(cuponData: CreateCouponData): Promise<CreateCouponResponse> {
    try {
      console.log('🆕 Creando cupón:', cuponData);
      const response = await apiClient.post(ADMIN_ENDPOINTS.COUPONS, cuponData);
      const result = handleApiResponseSafe<CreateCouponResponse>(response);
      console.log('✅ Cupón creado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en crearCupon:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Crea múltiples cupones
   */
  async crearCuponesBulk(bulkData: BulkCreateData): Promise<BulkCreateResponse> {
    try {
      console.log('🎯 Creando cupones en bulk:', bulkData);
      const response = await apiClient.post(`${ADMIN_ENDPOINTS.COUPONS}/bulk`, bulkData);
      const result = handleApiResponseSafe<BulkCreateResponse>(response);
      console.log('✅ Cupones bulk creados exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en crearCuponesBulk:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Actualiza un cupón existente
   */
  async actualizarCupon(cuponId: string, updates: Partial<UpdateCouponData>): Promise<{ message: string; couponId: string; updates: any }> {
    try {
      console.log('✏️ Actualizando cupón:', cuponId, updates);
      const response = await apiClient.put(`${ADMIN_ENDPOINTS.COUPONS}/${cuponId}`, updates);
      const result = handleApiResponseSafe(response);
      console.log('✅ Cupón actualizado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en actualizarCupon:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Activa/desactiva un cupón
   */
  async toggleActivarCupon(cuponId: string): Promise<{ message: string; couponId: string; active: boolean }> {
    try {
      console.log('🔄 Cambiando estado del cupón:', cuponId);
      const response = await apiClient.put(`${ADMIN_ENDPOINTS.COUPONS}/${cuponId}/toggle`);
      const result = handleApiResponseSafe(response);
      console.log('✅ Estado del cupón cambiado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en toggleActivarCupon:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Elimina un cupón
   */
  async eliminarCupon(cuponId: string, hardDelete: boolean = false): Promise<{ message: string; couponId: string }> {
    try {
      console.log('🗑️ Eliminando cupón:', cuponId, 'hardDelete:', hardDelete);
      const response = await apiClient.delete(`${ADMIN_ENDPOINTS.COUPONS}/${cuponId}?hardDelete=${hardDelete}`);
      const result = handleApiResponseSafe(response);
      console.log('✅ Cupón eliminado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en eliminarCupon:', error);
      throw handleApiError(error);
    }
  }

  /**
   * Obtiene historial de uso de un cupón
   */
  async obtenerHistorialUso(cuponId: string): Promise<any> {
    try {
      console.log('📊 Obteniendo historial de uso:', cuponId);
      const response = await apiClient.get(`${ADMIN_ENDPOINTS.COUPONS}/${cuponId}/usage`);
      const result = handleApiResponseSafe(response);
      console.log('✅ Historial de uso obtenido:', result);
      return result;
    } catch (error) {
      console.error('❌ Error en obtenerHistorialUso:', error);
      throw handleApiError(error);
    }
  }
}

export const adminCouponService = new AdminCouponService();