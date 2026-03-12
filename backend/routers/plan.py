from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Plan

router = APIRouter(prefix="/api/plan", tags=["plan"])


@router.get("/list")
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(Plan).filter(Plan.is_active == True).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "duration_days": p.duration_days,
            "data_limit": p.data_limit,
            "description": p.description,
        }
        for p in plans
    ]
