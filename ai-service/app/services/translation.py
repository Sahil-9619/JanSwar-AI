import os
import json
import google.generativeai as genai

# Initialize Gemini SDK
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def detect_and_translate(text: str, target_lang: str = "English") -> dict:
    """
    Detects the primary language of the citizen request (Hindi, Maithili, Bhojpuri, English, etc.)
    and translates it to the baseline target language.
    Returns a dictionary containing 'detected_lang' (code) and 'translated_text'.
    """
    if not text or not text.strip():
        return {
            "detected_lang": "en",
            "translated_text": ""
        }

    if not api_key:
        print("[AI Translation Service Warning] GEMINI_API_KEY is not configured.")
        return {
            "detected_lang": "en",
            "translated_text": text
        }

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = (
            f"You are a language analyzer and translator. Analyze the input text and perform two actions:\n"
            f"1. Detect the primary spoken/written language. Return its standard ISO 639-1 language code (e.g. 'en', 'hi', 'bho' for Bhojpuri, 'mai' for Maithili).\n"
            f"2. Translate the text verbatim into {target_lang}.\n\n"
            f"Format the output strictly as a JSON object with the keys 'detected_lang' and 'translated_text'. "
            f"Return ONLY valid JSON. Do not include markdown code block syntax (like ```json ... ```), introductions, or formatting. "
            f"If the text is already in the target language, set 'translated_text' to the original text and 'detected_lang' to the detected code.\n\n"
            f"Input text:\n\"{text}\""
        )
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown code blocks if the LLM outputted them despite instructions
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "", 1)
        elif response_text.startswith("```"):
            response_text = response_text.replace("```", "", 1)
            
        if response_text.endswith("```"):
            response_text = response_text.rsplit("```", 1)[0]
            
        cleaned_json = response_text.strip()
        parsed_data = json.loads(cleaned_json)
        
        return {
            "detected_lang": parsed_data.get("detected_lang", "en"),
            "translated_text": parsed_data.get("translated_text", text)
        }

    except Exception as e:
        print(f"[AI Translation Error] Language detection and translation failed: {e}")
        # Standard fallback
        return {
            "detected_lang": "en",
            "translated_text": text
        }
