import type { Property } from './Property';

export type EditableProperty =
  Omit<Property, 'average_rating' | 'total_reviews' | 'positive_review_rate'> & {
    timezone: string;
  };