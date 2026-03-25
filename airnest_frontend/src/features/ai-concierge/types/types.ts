export interface ConciergeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConciergeRequest {
  propertyId: string;
  question: string;
  conversationHistory: ConciergeMessage[];
  locale: string;
}

export interface PropertyContext {
  id: string;
  title: string;
  description: string;
  price_per_night: number;
  category: string;
  place_type: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  city: string;
  state: string;
  country: string;
  property_tags?: string[];
  average_rating?: number;
  total_reviews?: number;
}

export interface ReviewSummaryContext {
  highlights: string[];
  concerns: string[];
  best_for: string[];
  summary_text: string;
}

export interface RawReview {
  id: string;
  rating: number;
  title?: string;
  content: string;
}
