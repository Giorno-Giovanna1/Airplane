import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from auth import require_admin, hash_password
from database import get_db
from models import User, Plan, Order, Server

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---- 用户管理 ----

@router.get("/users")
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "is_admin": u.is_admin,
            "is_active": u.is_active,
            "data_limit": u.data_limit,
            "data_used": u.data_used,
            "expire_time": u.expire_time.isoformat() if u.expire_time else None,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]


class ToggleUserReq(BaseModel):
    is_active: bool


@router.put("/users/{user_id}/toggle")
def toggle_user(user_id: int, req: ToggleUserReq, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "用户不存在")
    user.is_active = req.is_active
    db.commit()
    return {"msg": "操作成功"}


class RenewUserReq(BaseModel):
    days: int = 30
    data_gb: float = 100


@router.post("/users/{user_id}/renew")
def renew_user(user_id: int, req: RenewUserReq, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "用户不存在")
    now = datetime.utcnow()
    if user.expire_time and user.expire_time > now:
        user.expire_time += timedelta(days=req.days)
    else:
        user.expire_time = now + timedelta(days=req.days)
    user.data_limit += int(req.data_gb * 1024 * 1024 * 1024)
    db.commit()
    return {"msg": "续期成功"}


# ---- 套餐管理 ----

class PlanReq(BaseModel):
    name: str
    price: int
    duration_days: int
    data_limit: float
    description: str = ""
    is_active: bool = True


@router.get("/plans")
def list_plans(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    plans = db.query(Plan).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "duration_days": p.duration_days,
            "data_limit": p.data_limit,
            "description": p.description,
            "is_active": p.is_active,
        }
        for p in plans
    ]


@router.post("/plans")
def create_plan(req: PlanReq, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    plan = Plan(**req.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"msg": "创建成功", "id": plan.id}


@router.put("/plans/{plan_id}")
def update_plan(plan_id: int, req: PlanReq, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(404, "套餐不存在")
    for k, v in req.model_dump().items():
        setattr(plan, k, v)
    db.commit()
    return {"msg": "更新成功"}


@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(404, "套餐不存在")
    db.delete(plan)
    db.commit()
    return {"msg": "删除成功"}


# ---- 订单管理 ----

@router.get("/orders")
def list_orders(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "user_email": o.user.email if o.user else "",
            "plan_name": o.plan.name if o.plan else "",
            "amount": o.amount,
            "status": o.status,
            "trade_no": o.trade_no,
            "created_at": o.created_at.isoformat(),
            "paid_at": o.paid_at.isoformat() if o.paid_at else None,
        }
        for o in orders
    ]


# ---- 管理员管理 ----

class CreateAdminReq(BaseModel):
    email: EmailStr
    password: str


@router.post("/admins")
def create_admin(req: CreateAdminReq, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(400, "邮箱已存在")
    user = User(email=req.email, password_hash=hash_password(req.password), is_admin=True)
    db.add(user)
    db.commit()
    return {"msg": "管理员创建成功"}


@router.get("/admins")
def list_admins(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    admins = db.query(User).filter(User.is_admin == True).all()
    return [{"id": a.id, "email": a.email, "created_at": a.created_at.isoformat()} for a in admins]


# ---- 节点管理 ----

class ServerReq(BaseModel):
    name: str
    address: str
    port: int
    protocol: str
    settings_json: str = "{}"
    is_active: bool = True


@router.get("/servers")
def list_servers(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    servers = db.query(Server).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "address": s.address,
            "port": s.port,
            "protocol": s.protocol,
            "settings_json": s.settings_json,
            "is_active": s.is_active,
        }
        for s in servers
    ]


@router.post("/servers")
def create_server(req: ServerReq, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    server = Server(**req.model_dump())
    db.add(server)
    db.commit()
    db.refresh(server)
    return {"msg": "节点创建成功", "id": server.id}


@router.put("/servers/{server_id}")
def update_server(server_id: int, req: ServerReq, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "节点不存在")
    for k, v in req.model_dump().items():
        setattr(server, k, v)
    db.commit()
    return {"msg": "更新成功"}


@router.delete("/servers/{server_id}")
def delete_server(server_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    server = db.query(Server).filter(Server.id == server_id).first()
    if not server:
        raise HTTPException(404, "节点不存在")
    db.delete(server)
    db.commit()
    return {"msg": "删除成功"}
