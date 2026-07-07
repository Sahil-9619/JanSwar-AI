from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.services.clustering import cluster_grievances

router = APIRouter(prefix="/api/ai", tags=["AI Clustering & Synthesis Engine"])

class SuggestionClusteringInput(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    priorityScore: Optional[float] = 50.0
    categoryId: str
    categoryName: str
    districtId: str
    blockId: str
    villageId: str
    blockName: Optional[str] = None
    villageName: Optional[str] = None

class ClusterRequestPayload(BaseModel):
    suggestions: List[SuggestionClusteringInput]
    eps: Optional[float] = 0.5
    minSamples: Optional[int] = 2
    semanticWeight: Optional[float] = 3.0

@router.post("/cluster")
def run_suggestions_clustering(payload: ClusterRequestPayload):
    """
    Groups active suggestions by category, running geographical and semantic DBSCAN.
    Consolidates clusters into structured recommendation packages for planning.
    """
    suggestions_dicts = []
    for s in payload.suggestions:
        suggestions_dicts.append(s.dict())

    print(f"[AI Clustering Router] Received {len(suggestions_dicts)} suggestions for clustering analysis.")
    
    try:
        projects = cluster_grievances(
            suggestions=suggestions_dicts,
            semantic_weight=payload.semanticWeight,
            eps=payload.eps,
            min_samples=payload.minSamples
        )
        return {
            "status": "success",
            "clusterCount": len(projects),
            "proposedProjects": projects
        }
    except Exception as e:
        print(f"[AI Clustering Router Error] Clustering process failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
