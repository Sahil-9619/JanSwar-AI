from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import requests

from app.services.speech import transcribe_audio
from app.services.translation import detect_and_translate
from app.services.llm_helper import analyze_suggestion

router = APIRouter(prefix="/api/ai", tags=["AI Ingestion Pipeline"])

class SuggestionProcessPayload(BaseModel):
    suggestionId: str
    title: str
    description: Optional[str] = None
    media: Optional[List[Dict[str, Any]]] = []
    village: Optional[Dict[str, Any]] = None
    categories: Optional[List[Dict[str, Any]]] = []
    callbackUrl: str
    internalSecret: str

def run_suggestion_pipeline_task(payload: SuggestionProcessPayload):
    """
    Background worker that runs STT, translation, classification, and scoring,
    then executes a callback HTTP request to the Express backend.
    """
    suggestion_id = payload.suggestionId
    title = payload.title
    description = payload.description or ""
    media_list = payload.media or []
    village = payload.village or {}
    categories = payload.categories or []
    callback_url = payload.callbackUrl
    internal_secret = payload.internalSecret

    print(f"[AI Ingestion Worker] Starting pipeline task for suggestion: {suggestion_id}")

    # 1. Check for Voice Audio Uploads
    transcription = None
    voice_media = next((m for m in media_list if m.get("mediaType") == "VOICE"), None)
    if voice_media and voice_media.get("url"):
        audio_url = voice_media.get("url")
        print(f"[AI Ingestion Worker] Voice recording detected: {audio_url}")
        transcription = transcribe_audio(audio_url)
    
    # Merge transcription text
    text_to_process = description
    if transcription:
        if text_to_process:
            text_to_process = f"{text_to_process}\n\n[Transcription]: {transcription}"
        else:
            text_to_process = transcription

    # 2. Language Detection & Translation
    print(f"[AI Ingestion Worker] Detecting language & translating content...")
    trans_results = detect_and_translate(text_to_process)
    detected_lang = trans_results.get("detected_lang", "en")
    translated_text = trans_results.get("translated_text", text_to_process)

    # 3. LLM Analysis (Category, Sentiment, Weights)
    print(f"[AI Ingestion Worker] Running LLM analysis prompts...")
    analysis = analyze_suggestion(title, translated_text, categories)
    
    selected_category_name = analysis.get("category_name")
    sentiment = analysis.get("sentiment", "NEUTRAL")
    urgency_weight = analysis.get("urgency_weight", 10.0)
    budget_weight = analysis.get("budget_weight", 5.0)

    # Map category name back to ID
    category_id = None
    if selected_category_name and categories:
        matched_cat = next(
            (c for c in categories if c.get("name").strip().lower() == selected_category_name.strip().lower()),
            None
        )
        if matched_cat:
            category_id = matched_cat.get("id")
        else:
            # Fallback default category if name mapping failed
            category_id = categories[0].get("id")

    # 4. Math Prioritization Weight Calculation
    population = village.get("population", 1000) if village else 1000
    infra_gap = village.get("infrastructureGap", 0.5) if village else 0.5

    citizen_demand_weight = 30.0  # Constant default weight for active request count
    population_weight = min(25.0, (population / 20000.0) * 25.0)
    gap_weight = infra_gap * 25.0  # Scaled infrastructure gap index
    
    # Gov Plan and Distance default
    distance_weight = 0.0
    gov_plan_weight = 0.0

    final_score = min(
        100.0,
        citizen_demand_weight + population_weight + gap_weight + urgency_weight + budget_weight
    )

    # 5. Callback Synchronization
    callback_payload = {
        "transcription": transcription,
        "translatedText": translated_text,
        "detectedLang": detected_lang,
        "sentiment": sentiment,
        "categoryId": category_id,
        "priorityScore": {
            "citizenDemandWeight": citizen_demand_weight,
            "populationWeight": population_weight,
            "infrastructureGap": gap_weight,
            "distanceWeight": distance_weight,
            "budgetWeight": budget_weight,
            "urgencyWeight": urgency_weight,
            "govPlanWeight": gov_plan_weight,
            "finalScore": round(final_score, 1)
        }
    }

    try:
        print(f"[AI Ingestion Worker] Syncing results back to {callback_url}...")
        headers = {
            "Content-Type": "application/json",
            "x-internal-secret": internal_secret
        }
        res = requests.patch(callback_url, json=callback_payload, headers=headers)
        res.raise_for_status()
        print(f"[AI Ingestion Worker] Synchronization successful for suggestion: {suggestion_id}. Status: {res.status_code}")
    except Exception as sync_err:
        print(f"[AI Ingestion Worker Critical Error] Callback synchronization failed: {sync_err}")

@router.post("/process-suggestion")
def process_suggestion(payload: SuggestionProcessPayload, background_tasks: BackgroundTasks):
    """
    Endpoint triggered by the backend when a suggestion is submitted.
    Pushes processing task to a background thread to prevent client timeouts.
    """
    background_tasks.add_task(run_suggestion_pipeline_task, payload)
    return {
        "status": "processing",
        "suggestionId": payload.suggestionId,
        "message": "AI analysis pipeline spawned successfully in background."
    }
