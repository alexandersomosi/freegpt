import os
import shutil
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag_engine import RAGEngine
from typing import List, Optional, Any
import uvicorn
from sqlalchemy.orm import Session
from database import ChatSessionDB, get_db, init_db

# Load environment variables from root directory
backend_dir = Path(__file__).parent
root_dir = backend_dir.parent
load_dotenv(root_dir / ".env")
load_dotenv(root_dir / ".env.local")

# Initialize Database tables
init_db()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for local dev to fix 400 Bad Request
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG Engine instance (lazy initialization)
rag_engine: Optional[RAGEngine] = None

# --- Pydantic Models ---
class ChatRequest(BaseModel):
    message: str
    image: Optional[str] = None
    apiKey: Optional[str] = None
    model: Optional[str] = "gemini-1.5-pro"
    providerUrl: Optional[str] = None
    history: Optional[List[dict]] = []
    deepThink: Optional[bool] = False
    enableSearch: Optional[bool] = False
    searchApiKey: Optional[str] = None
    systemInstruction: Optional[str] = None
    sessionId: Optional[str] = None

class IngestRequest(BaseModel):
    text: str
    source: Optional[str] = "user_upload"
    apiKey: Optional[str] = None
    sessionId: Optional[str] = None

class ChatSessionModel(BaseModel):
    id: str
    title: str
    dateGroup: str
    messages: List[Any] # Message objects

# --- RAG Engine Helper ---
def get_rag_engine(request: Request, apiKey: Optional[str] = None):
    global rag_engine
    
    # Try to get API key from request header, body (if passed), or env
    key = apiKey or request.headers.get("x-api-key") or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    
    if not key:
        print("DEBUG: API Key missing in get_rag_engine")
        raise HTTPException(status_code=401, detail="API Key not provided. Please set it in Settings.")
    
    print(f"DEBUG: get_rag_engine called. Key provided: {key[:5]}...")
    
    # If engine exists but key changed, or not exists, initialize
    if rag_engine:
        print(f"DEBUG: Global rag_engine exists. Current key in engine: {rag_engine.api_key[:5]}...")
        if rag_engine.api_key != key:
             print(f"DEBUG: Re-initializing RAGEngine with new key (old: {rag_engine.api_key[:5]}..., new: {key[:5]}...)")
             try:
                rag_engine = RAGEngine(api_key=key)
             except Exception as e:
                print(f"Error re-initializing RAGEngine: {e}")
                pass
        else:
             print("DEBUG: Keys match. Reusing existing RAGEngine.")
    else:
        print(f"DEBUG: Global rag_engine is None. Initializing RAGEngine with key: {key[:5]}...")
        try:
            rag_engine = RAGEngine(api_key=key)
        except Exception as e:
            error_msg = str(e).lower()
            if "api key" in error_msg or "401" in error_msg or "unauthorized" in error_msg:
                raise HTTPException(status_code=401, detail=f"Authentication Error: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
            
    if rag_engine:
        status = "Initialized" if rag_engine.vector_store is not None else "None"
        print(f"DEBUG: Returning RAGEngine. VectorStore status: {status}")
    
    return rag_engine

# (Root endpoint removed to allow SPA serving)

# --- Chat History Endpoints ---

@app.get("/api/history", response_model=List[ChatSessionModel])
def get_history(db: Session = Depends(get_db)):
    sessions = db.query(ChatSessionDB).all()
    return [
        ChatSessionModel(
            id=s.id,
            title=s.title,
            dateGroup=s.date_group,
            messages=s.messages
        ) for s in sessions
    ]

@app.post("/api/history")
def save_history(session: ChatSessionModel, db: Session = Depends(get_db)):
    db_session = db.query(ChatSessionDB).filter(ChatSessionDB.id == session.id).first()
    
    if db_session:
        # Update existing
        db_session.title = session.title
        db_session.date_group = session.dateGroup
        db_session.messages = session.messages
    else:
        # Create new
        db_session = ChatSessionDB(
            id=session.id,
            title=session.title,
            date_group=session.dateGroup,
            messages=session.messages
        )
        db.add(db_session)
    
    db.commit()
    db.refresh(db_session)
    return {"status": "success", "id": session.id}

@app.delete("/api/history/{session_id}")
def delete_history(session_id: str, db: Session = Depends(get_db)):
    db_session = db.query(ChatSessionDB).filter(ChatSessionDB.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(db_session)
    db.commit()
    return {"status": "deleted"}

# --- RAG Endpoints ---

import traceback

@app.post("/api/chat")
async def chat_endpoint(request: Request, body: ChatRequest):
    try:
        print(f"Received chat request for model: {body.model}")
        
        # Logic to prevent self-referencing base_url
        provider_url = body.providerUrl
        if provider_url:
            normalized = provider_url.lower().replace("http://", "").replace("https://", "").replace("/", "")
            if "localhost" in normalized or "127.0.0.1" in normalized or "0.0.0.0" in normalized:
                 provider_url = None
                 
        engine = get_rag_engine(request, apiKey=body.apiKey)
        
        response = engine.get_response(
            body.message, 
            image=body.image,
            model_name=body.model,
            base_url=provider_url, # Use filtered URL
            api_key=body.apiKey, # Pass key dynamically
            history=body.history, # Pass chat history
            deep_think=body.deepThink, # Pass reasoning flag
            enable_search=body.enableSearch,
            search_api_key=body.searchApiKey,
            system_instruction=body.systemInstruction,
            session_id=body.sessionId
        )
        
        if isinstance(response, dict):
            return {"response": response["answer"], "sources": response.get("sources", [])}
        else:
            return {"response": response, "sources": []}
            
    except Exception as e:
        print("Error in chat_endpoint:")
        traceback.print_exc() # Print full stack trace
        error_msg = str(e).lower()
        if "api key" in error_msg or "401" in error_msg or "unauthorized" in error_msg:
            raise HTTPException(status_code=401, detail=f"Authentication Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest")
async def ingest_endpoint(request: Request, body: IngestRequest):
    engine = get_rag_engine(request, apiKey=body.apiKey)
    try:
        count = engine.ingest_text(body.text, body.source)
        return {"status": "success", "chunks_added": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import sys
import webbrowser
import threading

# Ensure uploads directory exists relative to CWD
BASE_DIR = Path(os.getcwd())
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

@app.post("/api/upload")
async def upload_file(
    request: Request,
    file: UploadFile = File(...), 
    apiKey: Optional[str] = Form(None),
    sessionId: Optional[str] = Form(None)
):
    print(f"DEBUG: Received upload request for file: {file.filename} (Session: {sessionId})")
    if apiKey:
        print(f"DEBUG: Received API Key in form: {apiKey[:5]}...")
    else:
        print("DEBUG: No API Key in form data")

    engine = get_rag_engine(request, apiKey=apiKey)
    
    try:
        # Save uploaded file permanently
        file_path = UPLOADS_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Process the file
        count = engine.ingest_file(str(file_path), file.filename, session_id=sessionId)
        
        # Note: File is kept for future downloads
        
        return {"status": "success", "filename": file.filename, "chunks_added": count}
        
    except Exception as e:
        print(f"Error in upload_file: {e}")
        # Clean up if ingestion failed
        if os.path.exists(UPLOADS_DIR / file.filename):
             os.remove(UPLOADS_DIR / file.filename)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{filename}/download")
def download_document(filename: str):
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path=file_path, filename=filename, media_type='application/octet-stream')

@app.get("/api/documents")
def list_documents(request: Request, apiKey: Optional[str] = None):
    engine = get_rag_engine(request, apiKey=apiKey)
    return {"documents": engine.list_documents()}

@app.delete("/api/documents/{filename}")
def delete_document(filename: str, request: Request, apiKey: Optional[str] = None):
    engine = get_rag_engine(request, apiKey=apiKey)
    success = engine.delete_document(filename)
    if success:
        return {"status": "deleted", "filename": filename}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete document")

# --- Path helper for PyInstaller ---
def get_base_path():
    if hasattr(sys, '_MEIPASS'):
        print(f"DEBUG: Running in PyInstaller. MEIPASS: {sys._MEIPASS}")
        return Path(sys._MEIPASS)
    print(f"DEBUG: Running in Dev Mode. Base: {Path(__file__).parent.parent}")
    return Path(__file__).parent.parent

# --- Serve Frontend (SPA) ---
frontend_dist = get_base_path() / "dist"
print(f"DEBUG: Looking for frontend at: {frontend_dist.absolute()}")

if frontend_dist.exists():
    print("DEBUG: Frontend directory FOUND.")
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    
    # Catch-all route for SPA - MUST BE LAST
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API requests to pass through
        if full_path.startswith("api"):
            raise HTTPException(status_code=404)
        return FileResponse(frontend_dist / "index.html")
else:
    print("WARNING: Frontend 'dist' directory not found. Run 'npm run build' to generate it.")

def open_browser():
    # Small delay to let server start
    threading.Timer(1.5, lambda: webbrowser.open("http://localhost:8000")).start()

if __name__ == "__main__":
    if not os.environ.get("SKIP_BROWSER"):
        open_browser()
    
    print("--- Registered Routes ---")
    for route in app.routes:
        if hasattr(route, 'methods'):
            print(f"{route.methods} {route.path}")
    print("-------------------------")

    # Pass the app object directly to avoid import issues in PyInstaller
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)