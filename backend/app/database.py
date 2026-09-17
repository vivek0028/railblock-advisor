import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from pathlib import Path

# Use database path relative to backend directory or via environment variable
BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = f"sqlite:///{BACKEND_DIR / 'railblock.db'}"
DB_PATH = os.getenv("DATABASE_URL", DEFAULT_DB_PATH)

engine = create_engine(
    DB_PATH,
    connect_args={"check_same_thread": False} if "sqlite" in DB_PATH else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
