import axios from 'axios';

const REVIEWS_API_BASE_URL = 'https://reviewsapi-production.up.railway.app';

export interface ReviewDto {
  id: number;
  user_id: string;
  movie_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewDto {
  user_id: string;
  movie_id: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
}

const client = axios.create({
  baseURL: REVIEWS_API_BASE_URL,
  timeout: 10000,
});

const reviewsApi = {
  getByMovie: async (movieId: number): Promise<ReviewDto[]> => {
    const res = await client.get<ReviewDto[]>(`/reviews/movie/${movieId}`);
    return res.data;
  },

  getByUser: async (userId: string): Promise<ReviewDto[]> => {
    const res = await client.get<ReviewDto[]>(`/reviews/user/${userId}`);
    return res.data;
  },

  create: async (payload: CreateReviewDto): Promise<ReviewDto> => {
    const res = await client.post<ReviewDto>('/reviews', payload);
    return res.data;
  },

  update: async (reviewId: number, payload: UpdateReviewDto): Promise<ReviewDto> => {
    const res = await client.put<ReviewDto>(`/reviews/${reviewId}`, payload);
    return res.data;
  },

  delete: async (reviewId: number): Promise<void> => {
    await client.delete(`/reviews/${reviewId}`);
  },
};

export default reviewsApi;