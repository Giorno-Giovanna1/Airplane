from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from models import User
from auth import hash_password
from config import DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD
from database import SessionLocal

from routers import user, plan, order, subscribe, admin

app = FastAPI(title="订阅管理系统")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(plan.router)
app.include_router(order.router)
app.include_router(subscribe.router)
app.include_router(admin.router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == DEFAULT_ADMIN_EMAIL).first():
            admin_user = User(
                email=DEFAULT_ADMIN_EMAIL,
                password_hash=hash_password(DEFAULT_ADMIN_PASSWORD),
                is_admin=True,
            )
            db.add(admin_user)
            db.commit()
            print(f"默认管理员已创建: {DEFAULT_ADMIN_EMAIL} / {DEFAULT_ADMIN_PASSWORD}")
    finally:
        db.close()


@app.get("/")
def root():
    return {"msg": "订阅管理系统 API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
