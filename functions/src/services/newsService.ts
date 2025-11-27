import { db } from '../config/firebase';
import { CreateNewsDto, News, UpdateNewsDto } from '../models/news';

const COLLECTION = 'news';

export const getAllNews = async (): Promise<News[]> => {
  const snapshot = await db
    .collection(COLLECTION)
    .orderBy('date', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<News, 'id'>),
  }));
};

export const getNewsById = async (id: string): Promise<News | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;

  return {
    id: doc.id,
    ...(doc.data() as Omit<News, 'id'>),
  };
};

export const createNews = async (data: CreateNewsDto): Promise<News> => {
  const docRef = await db.collection(COLLECTION).add(data);
  return {
    id: docRef.id,
    ...data,
  };
};

export const updateNews = async (
  id: string,
  data: UpdateNewsDto
): Promise<News | null> => {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) return null;

  await docRef.set(data, { merge: true });

  const updated = await docRef.get();
  return {
    id: updated.id,
    ...(updated.data() as Omit<News, 'id'>),
  };
};

export const deleteNews = async (id: string): Promise<boolean> => {
  const docRef = db.collection(COLLECTION).doc(id);
  const doc = await docRef.get();

  if (!doc.exists) return false;

  await docRef.delete();
  return true;
};