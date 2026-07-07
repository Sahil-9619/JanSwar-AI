import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
import google.generativeai as genai
import os

from app.services.embedding import get_batch_embeddings

# Initialize Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def summarize_cluster_with_gemini(titles_and_texts: list, category_name: str, block_name: str) -> dict:
    """
    Asks Gemini to analyze a cluster of citizen suggestions and propose a single,
    formal development recommendation (title, description, and proposed action).
    """
    if not api_key:
        # Fallback summary
        return {
            "title": f"Infrastructure Development Project - {block_name}",
            "description": f"AI-consolidated project recommendation addressing {len(titles_and_texts)} citizen reports regarding {category_name} issues in {block_name}."
        }

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Format suggestions list for the prompt
        suggestions_str = "\n".join([f"- Title: {item.get('title')}. Details: {item.get('description', '')}" for item in titles_and_texts])
        
        prompt = (
            f"You are the Lead Planning AI for a government development agency.\n"
            f"Analyze this cluster of {len(titles_and_texts)} citizen complaints regarding the category '{category_name}' in block '{block_name}':\n\n"
            f"{suggestions_str}\n\n"
            f"Tasks:\n"
            f"1. Generate a single, concise project title for a development project that resolves all these grievances. Format: '[Action Title] - [Focus Area/Village]'.\n"
            f"2. Write a detailed engineering project description explaining what infrastructure gap is being resolved, why it is urgent based on the citizen inputs, and the estimated community impact.\n\n"
            f"Format the output strictly as a JSON object with keys 'title' and 'description'. Do not include markdown code block syntax (like ```json ... ```), introductions, or formatting."
        )
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown wrappers
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "", 1)
        elif response_text.startswith("```"):
            response_text = response_text.replace("```", "", 1)
            
        if response_text.endswith("```"):
            response_text = response_text.rsplit("```", 1)[0]
            
        import json
        parsed = json.loads(response_text.strip())
        return {
            "title": parsed.get("title", f"Grievance Resolution Project - {category_name}"),
            "description": parsed.get("description", f"AI-consolidated resolution details.")
        }
    except Exception as e:
        print(f"[AI Clustering Summary Error] Gemini cluster summarization failed: {e}")
        return {
            "title": f"Grievance Resolution Project - {block_name}",
            "description": f"Consolidated planning project for {len(titles_and_texts)} citizen requests."
        }

def cluster_grievances(suggestions: list, semantic_weight: float = 3.0, eps: float = 0.5, min_samples: int = 2) -> list:
    """
    Performs spatial-semantic clustering on suggestions using DBSCAN.
    Groups suggestions by category, normalizes GPS coordinates (x, y in km) and 
    text embeddings, runs DBSCAN, and returns a list of proposed projects.
    """
    if len(suggestions) < min_samples:
        print("[AI Clustering Service] Insufficient suggestions to run clustering.")
        return []

    # 1. Group suggestions by category
    by_category = {}
    for sug in suggestions:
        cat_name = sug.get("categoryName", "General")
        if cat_name not in by_category:
            by_category[cat_name] = []
        by_category[cat_name].append(sug)

    proposed_projects = []

    for cat_name, items in by_category.items():
        if len(items) < min_samples:
            continue
            
        print(f"[AI Clustering Service] Processing {len(items)} suggestions for category: {cat_name}...")

        # Extract coordinates and texts
        coords = np.array([[item.get("longitude", 0.0), item.get("latitude", 0.0)] for item in items])
        # Scale GPS to approximate kilometers (Patna coordinates: 1 deg lat ~ 111km, 1 deg lng ~ 100km)
        coords_km = coords * np.array([100.0, 111.0])

        # Generate text embeddings
        texts = [item.get("description") or item.get("title") for item in items]
        embeddings = get_batch_embeddings(texts)

        # Scale coordinates to balance them with the embedding space
        scaler = StandardScaler()
        coords_scaled = scaler.fit_transform(coords_km)

        # Combine spatial and semantic features
        # X shape: (num_items, 2 + 384)
        X = np.hstack([coords_scaled, embeddings * semantic_weight])

        # Run DBSCAN
        db = DBSCAN(eps=eps, min_samples=min_samples)
        labels = db.fit_predict(X)

        # Process clusters
        unique_labels = set(labels)
        for label in unique_labels:
            if label == -1:
                # Outlier noise
                continue

            # Gather suggestions in this cluster
            cluster_indices = np.where(labels == label)[0]
            cluster_items = [items[idx] for idx in cluster_indices]
            
            # Centroid location calculation
            cluster_coords = np.array([[item.get("longitude"), item.get("latitude")] for item in cluster_items])
            centroid_lng, centroid_lat = np.mean(cluster_coords, axis=0)

            # Determine dominant block & village
            block_names = [item.get("blockName") for item in cluster_items if item.get("blockName")]
            village_names = [item.get("villageName") for item in cluster_items if item.get("villageName")]
            
            block_name = max(set(block_names), key=block_names.count) if block_names else "Patna sadar"
            village_name = max(set(village_names), key=village_names.count) if village_names else "Patna Sadar"

            print(f"[AI Clustering Service] Found cluster {label} with {len(cluster_items)} suggestions in {block_name} block.")

            # Ask Gemini to summarize cluster and generate recommendation project proposal
            summary = summarize_cluster_with_gemini(
                [{"title": item.get("title"), "description": item.get("description")} for item in cluster_items],
                cat_name,
                block_name
            )

            # Aggregate priority score
            suggestion_scores = [item.get("priorityScore", 50.0) for item in cluster_items]
            avg_priority = np.mean(suggestion_scores) if suggestion_scores else 50.0

            # Find matching relation IDs
            # Select IDs from the first item that has them to keep consistency
            first_item = cluster_items[0]
            proposed_projects.append({
                "title": summary.get("title"),
                "description": summary.get("description"),
                "priorityScore": round(float(avg_priority), 1),
                "categoryName": cat_name,
                "categoryId": first_item.get("categoryId"),
                "districtId": first_item.get("districtId"),
                "blockId": first_item.get("blockId"),
                "villageId": first_item.get("villageId"),
                "villageName": village_name,
                "blockName": block_name,
                "suggestionCount": len(cluster_items),
                "latitude": float(centroid_lat),
                "longitude": float(centroid_lng),
                "suggestionIds": [item.get("id") for item in cluster_items]
            })

    return proposed_projects
