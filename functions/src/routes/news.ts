import { Request, Response, Router } from 'express';
import { AuthRequest, verifyToken } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { CreateNewsDto, UpdateNewsDto } from '../models/news';
import {
    createNews,
    deleteNews,
    getAllNews,
    getNewsById,
    updateNews,
} from '../services/newsService';


const router = Router();

// GET /news - listar todas las noticias
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const news = await getAllNews();
    res.json(news);
  })
);

// GET /news/:id - obtener una noticia
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const news = await getNewsById(id);

    if (!news) {
      throw new ApiError(404, 'Noticia no encontrada');
    }

    res.json(news);
  })
);

// POST /news - crear noticia (protegido)
router.post(
  '/',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, description, date, body, imageUrl } = req.body as CreateNewsDto;

    if (!title || !description || !date || !body || !imageUrl) {
      throw new ApiError(400, 'Faltan campos obligatorios');
    }

    const noticia = await createNews({
      title,
      description,
      date,
      body,
      imageUrl,
    });

    res.status(201).json(noticia);
  })
);

// PUT /news/:id - actualizar noticia (protegido)
router.put(
  '/:id',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateNewsDto;

    const updated = await updateNews(id, data);

    if (!updated) {
      throw new ApiError(404, 'Noticia no encontrada');
    }

    res.json(updated);
  })
);

// DELETE /news/:id - eliminar noticia (protegido)
router.delete(
  '/:id',
  verifyToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const ok = await deleteNews(id);

    if (!ok) {
      throw new ApiError(404, 'Noticia no encontrada');
    }

    res.status(204).send();
  })
);

export default router;