from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from auth import hash_password, verify_password, create_token, get_current_user
from database import get_db
from models import User

router = APIRouter(prefix="/api/user", tags=["user"])


class RegisterReq(BaseModel):
    email: EmailStr
    password: str


class LoginReq(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(req: RegisterReq, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "邮箱已注册")
    user = User(email=req.email, password_hash=hash_password(req.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"msg": "注册成功", "token": create_token(user.id, user.is_admin)}


@router.post("/login")
def login(req: LoginReq, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "邮箱或密码错误")
    if not user.is_active:
        raise HTTPException(403, "账号已被禁用")
    return {
        "token": create_token(user.id, user.is_admin),
        "is_admin": user.is_admin,
    }


@router.get("/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "is_admin": user.is_admin,
        "subscribe_token": user.subscribe_token,
        "data_limit": user.data_limit,
        "data_used": user.data_used,
        "expire_time": user.expire_time.isoformat() if user.expire_time else None,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat(),
    }


@router.post("/reset-token")
def reset_subscribe_token(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import uuid
    user.subscribe_token = str(uuid.uuid4())
    db.commit()
    return {"subscribe_token": user.subscribe_token}
