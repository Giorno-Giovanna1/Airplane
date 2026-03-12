import uuid
from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, BigInteger, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    subscribe_token = Column(String, unique=True, default=lambda: str(uuid.uuid4()))
    data_limit = Column(BigInteger, default=0)  # bytes, 0 = no subscription
    data_used = Column(BigInteger, default=0)
    expire_time = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)  # 分
    duration_days = Column(Integer, nullable=False)
    data_limit = Column(Float, nullable=False)  # GB
    description = Column(String, default="")
    is_active = Column(Boolean, default=True)

    orders = relationship("Order", back_populates="plan")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("plans.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # 分
    trade_no = Column(String, nullable=True)  # 支付宝交易号
    status = Column(String, default="pending")  # pending/paid/expired
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="orders")
    plan = relationship("Plan", back_populates="orders")


class Server(Base):
    __tablename__ = "servers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    protocol = Column(String, nullable=False)  # vmess/vless/ss/trojan
    settings_json = Column(Text, default="{}")
    is_active = Column(Boolean, default=True)
