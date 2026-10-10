import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api.api_router import api_router
# import models to register with Base
import app.models

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ShipSenseApp")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    logger.info("Initializing ShipSense Database schemas...")
    Base.metadata.create_all(bind=engine)
    logger.info("ShipSense Database tables verified.")
    yield
    logger.info("ShipSense application shutdown.")

app = FastAPI(
    title="ShipSense AI Platform API",
    description="AI-Powered Supply Chain Risk Prediction & Prescriptive Analytics Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error handling {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred in ShipSense. Please check telemetry logs."}
    )

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "platform": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": "active"
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "app": "ShipSense API",
        "description": "AI-Powered Supply Chain Risk Prediction & Prescriptive Analytics",
        "docs": "/docs",
        "health": "/health"
    }
