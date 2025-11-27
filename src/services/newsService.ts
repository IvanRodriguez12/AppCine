// src/services/newsService.ts
import apiClient, { handleApiError, handleApiResponse } from '../api/client';
import { NEWS_ENDPOINTS, buildUrl } from '../api/endpoints';
import { ApiResponse } from '../types';

export interface News {
  id: string;
  title: string;
  description: string;
  date: string;     // ISO: "2025-11-27T00:00:00.000Z"
  body: string;
  imageUrl: string; // URL pública de la imagen
}

class NewsService {
  // Listar todas las noticias
  async getNews(): Promise<ApiResponse<News[]>> {
    try {
      const response = await apiClient.get<News[]>(NEWS_ENDPOINTS.LIST);
      return handleApiResponse<News[]>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }

  // Obtener detalle de una noticia (por si después hacés pantalla separada)
  async getNewsById(id: string): Promise<ApiResponse<News>> {
    try {
      const url = buildUrl(NEWS_ENDPOINTS.DETAIL, { id });
      const response = await apiClient.get<News>(url);
      return handleApiResponse<News>(response);
    } catch (error) {
      return handleApiError(error);
    }
  }
}

const newsService = new NewsService();
export default newsService;