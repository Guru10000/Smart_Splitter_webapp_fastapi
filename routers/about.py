from fastapi import APIRouter, Depends
from .auth import get_db
from models import Feedback
from sqlalchemy.orm import Session
from Schemas import FeedbackCreate

router = APIRouter(
    prefix="/about",
    tags=["About"]
)

@router.post("/feedback")
def submit_feedback(data: FeedbackCreate, db: Session=Depends(get_db)):
    
    
    feedback = Feedback(
        name = data.name,
        email = data.email,
        comments = data.comments,
        rating = data.rating
    )
    
    db.add(feedback)
    db.commit()
    
    return {"message": "feedback submitted successfully"}