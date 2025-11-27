// src/services/showtimesService.ts
import apiClient, { handleApiError } from '../api/client';
import { ApiResponse } from '../types';

export interface OccupiedSeatsData {
  showtimeId: string;
  occupiedSeats: string[];
}

export const showtimesService = {
  async getOccupiedSeats(showtimeId: string): Promise<ApiResponse<OccupiedSeatsData>> {
    try {
      const res = await apiClient.get(`/showtimes/${showtimeId}/occupied-seats`);
      const body = res.data || {};

      const data: OccupiedSeatsData = body.data || {
        showtimeId,
        occupiedSeats: [],
      };

      return {
        success: true,
        data,
        message: body.message,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export default showtimesService;