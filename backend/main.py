import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import os
from contextlib import asynccontextmanager
from database.connection import connect_to_mongo, close_mongo_connection
from routers import auth, problems, analytics, admin, developer, messages, notifications, settings

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # await connect_to_mongo()
    yield
    # await close_mongo_connection()

app = FastAPI(title="Needstack AI Backend", lifespan=lifespan)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Needstack AI API is running"}

app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(developer.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(settings.router)