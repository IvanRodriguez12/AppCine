// functions/src/models/news.ts

export interface News {
  id: string;
  title: string;
  description: string;
  date: string;      // ISO string, ej: "2025-11-27T00:00:00.000Z"
  body: string;
  imageUrl: string;  // URL pública de la imagen
}

export interface CreateNewsDto {
  title: string;
  description: string;
  date: string;
  body: string;
  imageUrl: string;
}

export type UpdateNewsDto = Partial<CreateNewsDto>;