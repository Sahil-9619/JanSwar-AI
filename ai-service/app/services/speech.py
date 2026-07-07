import os
import tempfile
import requests
import google.generativeai as genai

# Initialize Gemini SDK
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def download_audio_file(url: str) -> str:
    """
    Downloads an audio file from Cloudinary/URL to a temporary local file.
    """
    temp_dir = tempfile.gettempdir()
    # Handle extensions from URL
    ext = ".webm"
    if ".wav" in url:
        ext = ".wav"
    elif ".mp3" in url:
        ext = ".mp3"
    elif ".m4a" in url:
        ext = ".m4a"

    temp_file_path = os.path.join(temp_dir, f"temp_voice_suggestion{ext}")
    
    print(f"[AI Speech Service] Downloading audio from {url} to {temp_file_path}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(temp_file_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
            
    return temp_file_path

def transcribe_audio(audio_url: str) -> str:
    """
    Downloads the audio URL and uses the Gemini File API to transcribe it.
    Supports Hindi, Bhojpuri, Maithili, and English.
    """
    if not api_key:
        print("[AI Speech Service Warning] GEMINI_API_KEY is not configured.")
        return "Audio transcription fallback: GEMINI_API_KEY missing."

    local_path = None
    audio_file = None
    try:
        local_path = download_audio_file(audio_url)
        
        # Upload audio to Gemini File API (Gemini natively supports webm, wav, mp3)
        print(f"[AI Speech Service] Uploading {local_path} to Gemini File API...")
        audio_file = genai.upload_file(path=local_path)
        
        # Select multimodal model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        print("[AI Speech Service] Dispatching transcription query...")
        prompt = (
            "You are a professional multilingual transcriber for Indian regional speech. "
            "Transcribe this audio recording verbatim in its spoken language. "
            "Write the transcription directly using the native script (e.g. Devanagari script for Hindi, Bhojpuri, and Maithili; Latin script for English or Hinglish). "
            "Do not translate, do not summarize, and do not explain. Write ONLY the exact transcription of spoken words. "
            "Do not include introductory text like 'Here is the transcript' or markdown wrapper tags."
        )
        
        response = model.generate_content([audio_file, prompt])
        transcription = response.text.strip()
        
        print(f"[AI Speech Service] Transcription success. Length: {len(transcription)} chars.")
        return transcription

    except Exception as e:
        print(f"[AI Speech Service Error] Audio transcription process failed: {e}")
        return "Failed to transcribe audio recording."
    finally:
        # Cleanup resources
        if audio_file:
            try:
                print(f"[AI Speech Service] Cleaning up cloud file reference: {audio_file.name}")
                genai.delete_file(audio_file.name)
            except Exception as cleanup_err:
                print(f"[AI Speech Service Warning] Could not delete cloud file: {cleanup_err}")
                
        if local_path and os.path.exists(local_path):
            try:
                os.remove(local_path)
                print("[AI Speech Service] Cleaned up temporary local audio file.")
            except Exception as local_err:
                print(f"[AI Speech Service Warning] Could not remove local file: {local_err}")
