import os
import sys
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings
from dotenv import load_dotenv

# Load env from parent
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

PERSIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "chroma_data"))

def check_db():
    print(f"Checking DB at: {PERSIST_DIR}")
    if not os.path.exists(PERSIST_DIR):
        print("Directory does not exist!")
        return

    # Try to init with no embeddings first just to peek (might fail)
    # Chroma requires an embedding function usually.
    # We'll try to use a dummy one or just inspect the sqlite file if possible?
    # Actually, we can pass a dummy lambda for embeddings if we just want to .get()
    
    class DummyEmbeddings:
        def embed_documents(self, texts): return [[]] * len(texts)
        def embed_query(self, text): return []

    try:
        # Note: We need to use the SAME collection name
        db = Chroma(
            persist_directory=PERSIST_DIR, 
            collection_name="my_knowledge_base",
            embedding_function=DummyEmbeddings() 
        )
        
        print("Connected to ChromaDB.")
        data = db.get()
        
        count = len(data['ids'])
        print(f"Total chunks found: {count}")
        
        sources = set()
        if data['metadatas']:
            for m in data['metadatas']:
                if m and 'source' in m:
                    sources.add(m['source'])
        
        print(f"Unique Documents: {list(sources)}")
        
    except Exception as e:
        print(f"Error inspecting DB: {e}")

if __name__ == "__main__":
    check_db()