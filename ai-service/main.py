import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.routers.process import router as process_router
from app.routers.cluster import router as cluster_router

app = FastAPI(
    title="JanSwar AI - Constituency Intelligence AI Service",
    description="Microservice for NLP, transcription, translation, clustering, and priorities scoring",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(process_router)
app.include_router(cluster_router)

class TranslationRequest(BaseModel):
    text: str
    target_lang: str = "en"

@app.get("/")
def root():
    return {
        "service": "janswar-ai-service",
        "status": "running",
        "health": "/health",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "janswar-ai-service",
        "gpu_available": False # Defaulting to CPU setup
    }

@app.post("/api/ai/test-process")
def test_process(request: TranslationRequest):
    # Dummy processing to test routing and serialization
    return {
        "original_text": request.text,
        "processed": True,
        "length": len(request.text),
        "target_lang": request.target_lang
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
