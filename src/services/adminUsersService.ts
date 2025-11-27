// services/adminUsersService.ts
import apiClient, { handleApiResponse, handleApiError } from '@/api/client';
import { ApiResponse } from '@/types';
import { UserRole, AccountStatus, AccountLevel } from 'functions/src/models/user';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  photoURL?: string;
  bio?: string;
  birthDate: string;
  age: number;
  role: UserRole;
  accountStatus: AccountStatus;
  accountLevel: AccountLevel;
  isEmailVerified: boolean;
  emailVerifiedAt: string | null;
  dniUploaded: boolean;
  dniUrl: string | null;
  dniUploadedAt: string | null;
  faceVerified: boolean;
  faceVerificationScore: number | null;
  faceVerifiedAt: string | null;
  selfieUrl: string | null;
  favorites: number[];
  isPremium: boolean;
  premiumUntilAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  authInfo?: {
    emailVerified: boolean;
    disabled: boolean;
    lastSignInTime?: string;
    creationTime: string;
  };
}

export interface UsersStats {
  total: number;
  byRole: {
    user: number;
    admin: number;
    moderator: number;
  };
  byAccountLevel: {
    basic: number;
    verified: number;
    premium: number;
    full: number;
  };
  byAccountStatus: {
    active: number;
    suspended: number;
    banned: number;
    pending: number;
  };
  verificationStatus: {
    emailVerified: number;
    dniUploaded: number;
    faceVerified: number;
    fullyVerified: number;
  };
  premium: {
    premium: number;
    nonPremium: number;
  };
  favorites: {
    totalFavorites: number;
    usersWithFavorites: number;
  };
}

// ✅ SOLO los filtros que necesitas
export interface UsersFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  accountStatus?: AccountStatus;
}

class AdminUsersService {
  private baseUrl = '/admin/users';

  /**
   * Obtener lista de usuarios con filtros SIMPLIFICADOS
   */
  async getUsers(filters: UsersFilters = {}): Promise<
    ApiResponse<{
      users: AdminUser[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>
  > {
    try {
      const params = new URLSearchParams();
      
      // ✅ SOLO pasar los filtros que necesitas
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.accountStatus) params.append('accountStatus', filters.accountStatus);

      const queryString = params.toString();
      const endpoint = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

      console.log('🔄 Fetching users with filters:', { 
        role: filters.role, 
        status: filters.accountStatus, 
        search: filters.search 
      });

      const response = await apiClient.get(endpoint);

      return {
        success: true,
        data: {
          users: response.data.users || [],
          pagination: response.data.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0
          }
        }
      };
    } catch (error: any) {
      console.error('❌ Error fetching users:', error);
      return handleApiError(error);
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getStats(): Promise<ApiResponse<{ stats: UsersStats }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/stats`);

      return {
        success: true,
        data: {
          stats: response.data.stats
        }
      };
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  /**
   * Obtener usuario específico
   */
  async getUser(id: string): Promise<ApiResponse<{ user: AdminUser }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/${id}`);

      return {
        success: true,
        data: {
          user: response.data.user
        }
      };
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  /**
   * Cambiar estado de cuenta
   */
  async changeAccountStatus(
    id: string, 
    accountStatus: AccountStatus,
    reason?: string
  ): Promise<ApiResponse<{ message: string; userId: string; newStatus: string }>> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}/status`, {
        accountStatus,
        reason
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  /**
   * Cambiar rol de usuario
   */
  async changeUserRole(
    id: string, 
    role: UserRole
  ): Promise<ApiResponse<{ message: string; userId: string; newRole: string }>> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}/role`, {
        role
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  /**
   * Cambiar nivel de cuenta
   */
  async changeAccountLevel(
    id: string, 
    accountLevel: AccountLevel
  ): Promise<ApiResponse<{ message: string; userId: string; newLevel: string }>> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/${id}/level`, {
        accountLevel
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return handleApiError(error);
    }
  }

  /**
   * Eliminar usuario permanentemente
   */
  async deleteUser(id: string): Promise<ApiResponse<{ message: string; userId: string }>> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/${id}`);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return handleApiError(error);
    }
  }
}

export default new AdminUsersService();