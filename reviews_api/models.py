# reviews_api/models.py

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session


# ---------------------------
# Configuración de la Base de Datos
# ---------------------------

DATABASE_URL = "sqlite:///./reviews.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Necesario para SQLite en FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ---------------------------
# Modelo SQLAlchemy (Tabla real en la BD)
# ---------------------------

class ReviewModel(Base):
    """
    Modelo que representa una review en la base de datos.
    """
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, index=True, nullable=False)
    movie_id = Column(Integer, index=True, nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


# Crear tablas (si no existen)
Base.metadata.create_all(bind=engine)


# ---------------------------
# Sesión de BD para FastAPI
# ---------------------------

def get_db():
    """
    Dependencia de FastAPI para obtener una sesión de BD.
    Se cierra automáticamente cuando termina el request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------
# Pydantic Schemas (Entrada / Salida)
# ---------------------------

class ReviewBase(BaseModel):
    movie_id: int = Field(..., description="ID de la película (TMDB)")
    rating: int = Field(..., ge=1, le=10, description="Puntuación del 1 al 10")
    comment: Optional[str] = Field(None, description="Comentario del usuario")


class ReviewCreate(ReviewBase):
    user_id: str = Field(..., description="ID del usuario que crea la review")


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=10)
    comment: Optional[str] = None


class Review(BaseModel):
    id: int
    user_id: str
    movie_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True  # Permite devolver objetos SQLAlchemy directamente