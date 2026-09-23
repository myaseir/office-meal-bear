from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routers import orders, restaurants, rider_summary, riders, expenses
from app.core.database import close_mongo_connection, connect_to_mongo, mongodb


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(title="Meal Bear Skardu API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://office-meal-bear-frontend.vercel.app",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(restaurants.router, prefix="/api/v1")
app.include_router(riders.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(rider_summary.router, prefix="/api/v1")
app.include_router(expenses.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    try:
        await mongodb.client.admin.command("ping")
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        return {"status": "error", "database": "disconnected", "detail": str(exc)}