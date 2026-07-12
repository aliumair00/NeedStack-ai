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
from starlette.middleware.base import BaseHTTPMiddleware
from middleware.rate_limit import rate_limit_middleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger("uvicorn.error")

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Needstack AI Backend", lifespan=lifespan)

                    
app.add_middleware(
    CORSMiddleware,
    allow_origins=[                         
        "http://localhost:3000",                             
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    logger.error(f"Validation error: {exc}")

    return JSONResponse(
        status_code=422,
        content={"detail": "Invalid request parameters."},
    )

@app.get("/")
async def root():
    return {"message": "Needstack AI API is running"}

@app.get("/api/test-reload")
async def test_reload():
    return {"status": "reloaded"}

app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(developer.router)
app.include_router(messages.router)
app.include_router(notifications.router)
app.include_router(settings.router)