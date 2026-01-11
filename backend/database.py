from sqlalchemy import create_engine, Column, String, Integer, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./chats.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ChatSessionDB(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    date_group = Column(String)  # e.g. "Today", "Yesterday"
    messages = Column(JSON)      # Store full message history as JSON

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
