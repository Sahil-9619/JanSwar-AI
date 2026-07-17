export interface SuggestionMedia {
  id: string;
  suggestionId: string;
  mediaType: 'VOICE' | 'IMAGE' | 'DOCUMENT';
  url: string;
  publicId: string;
  createdAt: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string | null;
  transcription: string | null;
  translatedText: string | null;
  sentiment: string | null;
  status: 'PENDING' | 'PROCESSING' | 'ANALYZED' | 'APPROVED' | 'REJECTED';
  latitude: number;
  longitude: number;
  createdAt: string;
  category: { name: string } | null;
  village: { name: string } | null;
  block: { name: string } | null;
  priorityScore: { finalScore: number } | null;
  media?: SuggestionMedia[];
}
