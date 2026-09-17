import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.routers import (
    health_router,
    tasks_router,
    requests_router,
    movements_router,
    block_windows_router,
    resources_router,
    data_sources_router,
    conflicts_router,
    optimization_router,
    simulation_router,
    compatibility_router,
    priority_router,
    dashboard_router,
    audit_router,
    audit_alias_router
)
from seed_data import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed demo data if empty
    Base.metadata.create_all(bind=engine)
    seed_database(force=False)
    yield

app = FastAPI(
    title="RailBlock Advisor API",
    description=(
        "AI-Assisted Maintenance Block Planning for Indian Railways."
        "**NOTE** This decision-support system operates on **DEMO DATA**."
        "It does NOT connect to live Indian Railways internal systems."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RailBlock Advisor Backend",
        "version": "1.0.0",
        "mode": "DEMO DATA (Synthetic Indian Railways Corridor Alpha)"
    }

# Configure CORS
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://railblock-advisor-frontend.vercel.app",
]

# Support production frontend URL or comma-separated list via environment variable
frontend_origin_env = os.getenv("FRONTEND_ORIGIN")
if frontend_origin_env:
    for origin in frontend_origin_env.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in default_origins:
            default_origins.append(cleaned)

allow_all = os.getenv("CORS_ALLOW_ALL", "false").lower() == "true"
cors_origins = ["*"] if allow_all else default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https://railblock-advisor.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route Aliases for deployment verification & backward compatibility
@app.get("/api/overview")
def get_overview_alias(db: Session = Depends(get_db)):
    from app.routers.dashboard import get_dashboard_summary
    return get_dashboard_summary(db)

# Mount Routers
app.include_router(health_router)
app.include_router(dashboard_router)
app.include_router(tasks_router)
app.include_router(requests_router)
app.include_router(movements_router)
app.include_router(block_windows_router)
app.include_router(resources_router)
app.include_router(data_sources_router)
app.include_router(conflicts_router)
app.include_router(optimization_router)
app.include_router(simulation_router)
app.include_router(compatibility_router)
app.include_router(priority_router)
app.include_router(audit_router)
app.include_router(audit_alias_router)

@app.get("/")
def root():
    return {
        "project": "RailBlock Advisor",
        "subtitle": "AI-Assisted Maintenance Block Planning for Indian Railways",
        "problem_statement": "SIH 2026 PS 26027",
        "status": "Operational (Constraint Optimization Backend)",
        "docs_url": "/docs",
        "data_mode": "DEMO DATA",
        "solver": "Google OR-Tools CP-SAT",
        "disclaimer": "Decision-support prototype only. Not connected to live Indian Railways systems."
    }
