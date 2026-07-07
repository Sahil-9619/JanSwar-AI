import os
import json
import google.generativeai as genai

# Initialize Gemini SDK
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def analyze_suggestion(title: str, description: str, categories_list: list) -> dict:
    """
    Sends the suggestion details and the list of categories to Gemini.
    Returns a dict with 'category_name', 'sentiment', 'urgency_weight', and 'budget_weight'.
    """
    if not api_key:
        print("[AI LLM Helper Warning] GEMINI_API_KEY is not configured.")
        # Return fallback mock weights
        return {
            "category_name": "Road" if categories_list else "",
            "sentiment": "NEUTRAL",
            "urgency_weight": 12.0,
            "budget_weight": 5.0
        }

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Prepare category description string
        cat_descriptions = "\n".join([f"- {c.get('name')}" for c in categories_list])
        
        prompt = (
            f"You are the Core AI Engine of JanSwar AI, an Indian constituency planning platform.\n"
            f"Analyze the following citizen suggestion and categorize it, assess its sentiment, and determine priority weights.\n\n"
            f"Suggestion Title: \"{title}\"\n"
            f"Suggestion Text: \"{description}\"\n\n"
            f"Available Categories:\n"
            f"{cat_descriptions}\n\n"
            f"Tasks:\n"
            f"1. Select the best category from the available list. Match the name EXACTLY. If none match, select 'Road' or the most related option.\n"
            f"2. Assess the citizen's sentiment: NEGATIVE (e.g. angry about potholes, leaking pipes), POSITIVE (e.g. praising new lights), or NEUTRAL.\n"
            f"3. Assign an Urgency Weight (0.0 to 25.0): High values mean immediate threat to life/safety or critical breakdown (e.g., collapsed bridge, no drinking water). Low values mean recreational/long-term requests (e.g., stadium, park).\n"
            f"4. Assign a Budget Weight (0.0 to 15.0): High values mean the project is inexpensive and easy to deploy (e.g., street light fix, public toilet cleaning). Low values mean expensive infrastructure projects requiring complex budgets (e.g. building a railway station, highway bypass).\n\n"
            f"Format the output strictly as a JSON object with keys 'category_name', 'sentiment', 'urgency_weight', and 'budget_weight'. "
            f"Return ONLY valid JSON. Do not include markdown code block syntax (like ```json ... ```), introductions, or formatting."
        )
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "", 1)
        elif response_text.startswith("```"):
            response_text = response_text.replace("```", "", 1)
            
        if response_text.endswith("```"):
            response_text = response_text.rsplit("```", 1)[0]
            
        cleaned_json = response_text.strip()
        parsed_data = json.loads(cleaned_json)
        
        return {
            "category_name": parsed_data.get("category_name", "Road"),
            "sentiment": parsed_data.get("sentiment", "NEUTRAL").upper(),
            "urgency_weight": float(parsed_data.get("urgency_weight", 10.0)),
            "budget_weight": float(parsed_data.get("budget_weight", 5.0))
        }

    except Exception as e:
        print(f"[AI LLM Helper Error] Suggestion text analysis failed: {e}")
        # Standard fallback weights
        return {
            "category_name": "Road" if categories_list else "",
            "sentiment": "NEUTRAL",
            "urgency_weight": 10.0,
            "budget_weight": 5.0
        }
