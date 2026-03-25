import type {
  PropertyContext,
  ReviewSummaryContext,
  RawReview,
} from '../types/types';

const MAX_DESCRIPTION_CHARS = 500;
const MAX_REVIEW_CHARS = 200;
const MAX_RAW_REVIEWS = 10;

export function buildContext(
  property: PropertyContext,
  reviewSummary: ReviewSummaryContext | null,
  rawReviews: RawReview[] | null,
): string {
  const sections: string[] = [];

  // --- Property Info ---
  const location = [property.city, property.state, property.country]
    .filter(Boolean)
    .join(', ');

  const lines = [
    `Name: ${property.title}`,
    `Location: ${location}`,
    `Type: ${property.category} (${property.place_type})`,
    `Capacity: ${property.guests} guests, ${property.bedrooms} bedrooms, ${property.beds} beds, ${property.bathrooms} bathrooms`,
    `Price: $${property.price_per_night}/night`,
  ];

  if (property.average_rating != null && property.total_reviews != null) {
    lines.push(
      `Rating: ${property.average_rating.toFixed(1)}/5 (${property.total_reviews} reviews)`,
    );
  }

  if (property.property_tags?.length) {
    lines.push(`Amenities/Tags: ${property.property_tags.join(', ')}`);
  }

  sections.push(`### Property Info\n${lines.join('\n')}`);

  // --- Description ---
  if (property.description) {
    const desc =
      property.description.length > MAX_DESCRIPTION_CHARS
        ? property.description.slice(0, MAX_DESCRIPTION_CHARS) + '…'
        : property.description;
    sections.push(`### Description\n${desc}`);
  }

  // --- Guest Reviews ---
  if (reviewSummary) {
    const reviewLines: string[] = [];

    if (reviewSummary.summary_text) {
      reviewLines.push(`Overall: ${reviewSummary.summary_text}`);
    }
    if (reviewSummary.highlights.length) {
      reviewLines.push(`Highlights: ${reviewSummary.highlights.join('; ')}`);
    }
    if (reviewSummary.concerns.length) {
      reviewLines.push(`Concerns: ${reviewSummary.concerns.join('; ')}`);
    }
    if (reviewSummary.best_for.length) {
      reviewLines.push(`Best for: ${reviewSummary.best_for.join('; ')}`);
    }

    sections.push(`### Guest Review Summary\n${reviewLines.join('\n')}`);
  } else if (rawReviews?.length) {
    const reviewTexts = rawReviews.slice(0, MAX_RAW_REVIEWS).map((r, i) => {
      const text =
        r.content.length > MAX_REVIEW_CHARS
          ? r.content.slice(0, MAX_REVIEW_CHARS) + '…'
          : r.content;
      const title = r.title ? ` "${r.title}"` : '';
      return `${i + 1}. (${r.rating}/5)${title}: ${text}`;
    });
    sections.push(`### Guest Reviews\n${reviewTexts.join('\n')}`);
  }

  return sections.join('\n\n');
}
