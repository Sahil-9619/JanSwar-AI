import os
import numpy as np
from sentence_transformers import SentenceTransformer

# Cache model reference globally for lazy loading
_model = None

def get_embedding_model() -> SentenceTransformer:
    """
    Lazy loads and returns the SentenceTransformer model.
    """
    global _model
    if _model is None:
        # Determine caching directory or use default
        cache_folder = os.getenv("TRANSFORMERS_CACHE", None)
        print("[AI Embedding Service] Loading all-MiniLM-L6-v2 model...")
        _model = SentenceTransformer("all-MiniLM-L6-v2", cache_folder=cache_folder)
        print("[AI Embedding Service] Model loaded successfully.")
    return _model

def get_text_embedding(text: str) -> np.ndarray:
    """
    Generates a 384-dimensional float32 vector for a single text input.
    """
    if not text or not text.strip():
        return np.zeros(384, dtype=np.float32)
        
    model = get_embedding_model()
    # Ensure it's a numpy array of float32
    embedding = model.encode(text, show_progress_bar=False, convert_to_numpy=True)
    return embedding.astype(np.float32)

def get_batch_embeddings(texts: list) -> np.ndarray:
    """
    Generates vector embeddings for a list of text inputs.
    Returns a 2D numpy array of shape (num_texts, 384).
    """
    if not texts:
        return np.empty((0, 384), dtype=np.float32)
        
    model = get_embedding_model()
    embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
    return embeddings.astype(np.float32)
