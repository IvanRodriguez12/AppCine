# reviews_api/main.py

from typing import List

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from models import (
    ReviewModel,
    Review,
    ReviewCreate,
    ReviewUpdate,
    get_db,
)

app = FastAPI(
    title="User Reviews API",
    description="API en Python para CRUD básico de reviews de usuario",
    version="1.0.0",
)

# ---------------------------------
# Configuración de CORS
# ---------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # En desarrollo está bien; luego podés limitarlo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------
# Endpoints CRUD para Reviews
# ---------------------------------


@app.post("/reviews", response_model=Review)
def create_review(review: ReviewCreate, db: Session = Depends(get_db)):
    """
    Crear una nueva review.
    """
    db_review = ReviewModel(
        user_id=review.user_id,
        movie_id=review.movie_id,
        rating=review.rating,
        comment=review.comment,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


@app.get("/reviews/{review_id}", response_model=Review)
def get_review(review_id: int, db: Session = Depends(get_db)):
    """
    Obtener una review por id.
    """
    db_review = db.query(ReviewModel).filter(ReviewModel.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review no encontrada")
    return db_review


@app.get("/reviews/user/{user_id}", response_model=List[Review])
def get_reviews_by_user(user_id: str, db: Session = Depends(get_db)):
    """
    Listar todas las reviews hechas por un usuario.
    """
    reviews = (
        db.query(ReviewModel)
        .filter(ReviewModel.user_id == user_id)
        .order_by(ReviewModel.created_at.desc())
        .all()
    )
    return reviews


@app.get("/reviews/movie/{movie_id}", response_model=List[Review])
def get_reviews_by_movie(movie_id: int, db: Session = Depends(get_db)):
    """
    Listar todas las reviews de una película.
    """
    reviews = (
        db.query(ReviewModel)
        .filter(ReviewModel.movie_id == movie_id)
        .order_by(ReviewModel.created_at.desc())
        .all()
    )
    return reviews


@app.put("/reviews/{review_id}", response_model=Review)
def update_review(
    review_id: int,
    update_data: ReviewUpdate,
    db: Session = Depends(get_db),
):
    """
    Actualizar una review existente (rating y/o comment).
    """
    db_review = db.query(ReviewModel).filter(ReviewModel.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review no encontrada")

    if update_data.rating is not None:
        db_review.rating = update_data.rating
    if update_data.comment is not None:
        db_review.comment = update_data.comment

    from datetime import datetime
    db_review.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_review)
    return db_review


@app.delete("/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db)):
    """
    Eliminar una review por id.
    """
    db_review = db.query(ReviewModel).filter(ReviewModel.id == review_id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review no encontrada")

    db.delete(db_review)
    db.commit()
    return {"message": "Review eliminada correctamente"}


# (Opcional) ejecutar con: python main.py
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)