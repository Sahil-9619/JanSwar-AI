import os
import json
import numpy as np
import faiss

# Persistence paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
INDEX_PATH = os.path.join(DATA_DIR, "suggestions.index")
IDS_PATH = os.path.join(DATA_DIR, "suggestion_ids.json")

# Lazy initialize global variables
_index = None
_suggestion_ids = []

def init_search_db():
    """
    Ensures vector data directory exists and loads index from disk.
    """
    global _index, _suggestion_ids
    
    if _index is not None:
        return

    # Ensure storage path exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if os.path.exists(INDEX_PATH) and os.path.exists(IDS_PATH):
        try:
            print(f"[AI Search Index] Loading vector index from {INDEX_PATH}...")
            _index = faiss.read_index(INDEX_PATH)
            with open(IDS_PATH, "r") as f:
                _suggestion_ids = json.load(f)
            print(f"[AI Search Index] Load complete. Total vector count: {_index.ntotal}")
        except Exception as e:
            print(f"[AI Search Index Error] Failed to load FAISS index: {e}. Reinitializing index...")
            _index = faiss.IndexFlatIP(384)  # IndexFlatIP computes inner product (cosine similarity if normalized)
            _suggestion_ids = []
    else:
        print("[AI Search Index] Index file not found on disk. Creating new IndexFlatIP(384)...")
        _index = faiss.IndexFlatIP(384)
        _suggestion_ids = []

def save_search_db():
    """
    Persists the FAISS index and suggestion ID mappings back to disk.
    """
    global _index, _suggestion_ids
    if _index is None:
        return
        
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        print(f"[AI Search Index] Saving database indexes to {DATA_DIR}...")
        faiss.write_index(_index, INDEX_PATH)
        with open(IDS_PATH, "w") as f:
            json.dump(_suggestion_ids, f)
        print("[AI Search Index] Indexes saved successfully.")
    except Exception as e:
        print(f"[AI Search Index Error] Saving FAISS database failed: {e}")

def add_suggestion_vector(suggestion_id: str, vector: np.ndarray):
    """
    Normalizes the embedding, appends it to the FAISS index, and persists.
    """
    global _index, _suggestion_ids
    init_search_db()

    if suggestion_id in _suggestion_ids:
        print(f"[AI Search Index] Suggestion {suggestion_id} already registered. Skipping.")
        return

    # Normalize vector to unit length so that Inner Product search equals Cosine Similarity
    v = vector.reshape(1, -1).astype(np.float32)
    faiss.normalize_L2(v)

    _index.add(v)
    _suggestion_ids.append(suggestion_id)
    save_search_db()

def search_nearest_suggestions(vector: np.ndarray, top_k: int = 5, threshold: float = 0.78) -> list:
    """
    Searches the FAISS index for vectors with cosine similarity exceeding threshold.
    Returns a list of dictionaries with matching suggestionId and similarity score.
    """
    global _index, _suggestion_ids
    init_search_db()

    if _index is None or _index.ntotal == 0:
        return []

    # Reshape and normalize
    v = vector.reshape(1, -1).astype(np.float32)
    faiss.normalize_L2(v)

    # Search (scores is cosine similarity score if normalized)
    k = min(top_k, _index.ntotal)
    scores, indices = _index.search(v, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx != -1 and score >= threshold:
            results.append({
                "suggestionId": _suggestion_ids[idx],
                "similarity": float(score)
            })
            
    return results
