import time
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, Plan, Order
from alipay import create_qr_pay, verify_notify

router = APIRouter(prefix="/api/order", tags=["order"])


class CreateOrderReq(BaseModel):
    plan_id: int


@router.post("/create")
def create_order(req: CreateOrderReq, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == req.plan_id, Plan.is_active == True).first()
    if not plan:
        raise HTTPException(404, "套餐不存在")

    out_trade_no = f"SUB{user.id}T{int(time.time() * 1000)}"
    order = Order(
        user_id=user.id,
        plan_id=plan.id,
        amount=plan.price,
        trade_no=out_trade_no,
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    total_amount = round(plan.price / 100, 2)
    pay_result = create_qr_pay(out_trade_no, total_amount, f"订阅-{plan.name}")

    return {
        "order_id": order.id,
        "trade_no": out_trade_no,
        "amount": plan.price,
        "qr_code": pay_result["qr_code"],
        "mock": pay_result["mock"],
    }


@router.post("/notify")
async def alipay_notify(request: Request, db: Session = Depends(get_db)):
    """支付宝异步通知回调"""
    form = await request.form()
    data = dict(form)

    if not verify_notify(data):
        return "fail"

    trade_no = data.get("out_trade_no")
    trade_status = data.get("trade_status")

    if trade_status not in ("TRADE_SUCCESS", "TRADE_FINISHED"):
        return "success"

    order = db.query(Order).filter(Order.trade_no == trade_no).first()
    if not order or order.status == "paid":
        return "success"

    _activate_order(order, db)
    return "success"


@router.post("/mock-pay/{order_id}")
def mock_pay(order_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """模拟支付（开发测试用）"""
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(404, "订单不存在")
    if order.status == "paid":
        raise HTTPException(400, "订单已支付")
    _activate_order(order, db)
    return {"msg": "模拟支付成功"}


@router.get("/list")
def list_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()
    return [
        {
            "id": o.id,
            "plan_name": o.plan.name if o.plan else "",
            "amount": o.amount,
            "status": o.status,
            "trade_no": o.trade_no,
            "created_at": o.created_at.isoformat(),
            "paid_at": o.paid_at.isoformat() if o.paid_at else None,
        }
        for o in orders
    ]


def _activate_order(order: Order, db: Session):
    """激活订单：延长时间 + 增加流量"""
    order.status = "paid"
    order.paid_at = datetime.utcnow()

    user = db.query(User).filter(User.id == order.user_id).first()
    plan = db.query(Plan).filter(Plan.id == order.plan_id).first()

    if user and plan:
        now = datetime.utcnow()
        if user.expire_time and user.expire_time > now:
            user.expire_time += timedelta(days=plan.duration_days)
        else:
            user.expire_time = now + timedelta(days=plan.duration_days)

        user.data_limit += int(plan.data_limit * 1024 * 1024 * 1024)  # GB -> bytes

    db.commit()
