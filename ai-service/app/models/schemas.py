from pydantic import BaseModel

class ProcessSuggestionRequest(BaseModel):
    suggestionId: str
