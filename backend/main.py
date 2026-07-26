import os
import sys
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Add backend directory to sys.path
sys.path.append(os.path.dirname(__file__))

from recommender import RecommenderEngine

app = FastAPI(
    title="AI Book Recommendation System API",
    description="Collaborative Filtering Book Recommender Engine using Book-Crossing Dataset",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Lazy initialize recommender engine
recommender: Optional[RecommenderEngine] = None

@app.on_event("startup")
def startup_event():
    global recommender
    try:
        recommender = RecommenderEngine()
    except Exception as e:
        print(f"Warning: Could not initialize recommender engine on startup: {e}")

class RecommendRequest(BaseModel):
    book_name: str = Field(..., example="Harry Potter and the Chamber of Secrets")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AI Book Recommendation System API is running successfully",
        "version": "1.0.0"
    }

@app.get("/api/popular")
def get_popular(limit: int = 50):
    global recommender
    if recommender is None:
        try:
            recommender = RecommenderEngine()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Engine error: {str(e)}")
    
    books = recommender.get_popular_books(limit=limit)
    return {"status": "success", "count": len(books), "books": books}

@app.get("/api/search")
def search_books(q: str = Query("", description="Book title search query")):
    global recommender
    if recommender is None:
        try:
            recommender = RecommenderEngine()
        except Exception as e:
            return {"status": "error", "results": []}
            
    if not q or len(q.strip()) < 2:
        return {"status": "success", "results": []}
        
    results = recommender.search_book_titles(q, limit=10)
    return {"status": "success", "query": q, "results": results}

@app.post("/recommend")
def recommend_book(payload: RecommendRequest):
    global recommender
    if recommender is None:
        try:
            recommender = RecommenderEngine()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Recommender engine not ready: {str(e)}")
            
    if not payload.book_name or not payload.book_name.strip():
        raise HTTPException(status_code=400, detail="Book name is required")
        
    result = recommender.recommend(payload.book_name, top_n=5)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
