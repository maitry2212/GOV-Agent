from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Neon DB (PostgreSQL) connection URL — set DATABASE_URL in your .env file
DATABASE_URL = settings.DATABASE_URL

# Fix for SQLAlchemy connecting to Neon DB
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set. Please add your Neon DB connection string "
        "to the .env file, e.g. DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require"
    )

# Neon uses PostgreSQL — no need for check_same_thread
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
