// tags_model_openai.ts
// OpenAI API-based tag detection for transcribed text.

import { hasRealOpenAIKey } from './openai';

export const TAGS = [
  'emotion_score', // e.g., positive, negative, neutral
  'growth',        // mentions of personal growth, learning, or self-improvement
  'family',        // references to family or family members
  'work',          // references to work, job, or career
  'health',        // mentions of health, wellness, or illness
  'relationships', // references to friends, partners, or social connections
  'finance',       // mentions of money, expenses, or financial matters
  'stress',        // mentions of stress, anxiety, or pressure
  'achievement',   // mentions of accomplishments or successes
  'gratitude',     // expressions of thankfulness or appreciation
] as const;

export type Tag = typeof TAGS[number];

export interface TagDetectionResult {
  tags: Tag[];
  emotion_score?: 'positive' | 'negative' | 'neutral';
}

/**
 * Fallback function for when OpenAI API is not available.
 * 
 * This function provides a minimal fallback response when the OpenAI API cannot be used.
 * It returns a neutral emotion score and only the emotion_score tag to maintain
 * consistent response structure.
 * 
 * @param _text - The input text (unused in fallback scenario)
 * @returns A minimal TagDetectionResult with neutral emotion
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fallbackDetectTags(_text: string): TagDetectionResult {
  // Simple fallback logic - just return emotion_score as neutral
  return {
    tags: ['emotion_score'],
    emotion_score: 'neutral'
  };
}

// OpenAI API prompt for tag detection
const TAG_DETECTION_PROMPT = `Analyze the following text and identify relevant tags from this list: ${TAGS.join(', ')}.

For emotion_score, determine if the overall sentiment is positive, negative, or neutral.

Return your response as valid JSON in this exact format:
{
  "tags": ["tag1", "tag2", "emotion_score"],
  "emotion_score": "positive|negative|neutral"
}

Text to analyze: `;

/**
 * Detects relevant tags in transcribed text using OpenAI's GPT model.
 * 
 * This function leverages OpenAI's GPT-3.5-turbo model to perform sophisticated
 * tag detection and sentiment analysis. It uses a carefully crafted prompt to
 * ensure consistent JSON responses and handles various error scenarios gracefully.
 * 
 * Features:
 * - Dynamic import of OpenAI client to avoid dependency issues
 * - Structured prompt engineering for reliable JSON responses
 * - Comprehensive error handling with fallback behavior
 * - Response validation to ensure data integrity
 * - Low temperature setting for consistent results
 * 
 * Error Handling:
 * - No API key: Falls back to neutral response
 * - API errors: Catches exceptions and falls back
 * - Invalid JSON: Handles malformed responses
 * - Invalid structure: Validates response format
 * 
 * @param text - The transcribed text to analyze for tags
 * @returns A Promise that resolves to TagDetectionResult with detected tags and emotion score
 * 
 * @example
 * ```typescript
 * const result = await detectTagsWithOpenAI("I'm grateful for my family's support");
 * // Returns: { tags: ['gratitude', 'family', 'emotion_score'], emotion_score: 'positive' }
 * 
 * // When API is unavailable:
 * const fallback = await detectTagsWithOpenAI("any text");
 * // Returns: { tags: ['emotion_score'], emotion_score: 'neutral' }
 * ```
 */
export async function detectTagsWithOpenAI(text: string): Promise<TagDetectionResult> {
  if (!hasRealOpenAIKey()) {
    return fallbackDetectTags(text);
  }

  try {
    // Dynamic import to avoid requiring the package if not installed
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes text and identifies relevant tags. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: TAG_DETECTION_PROMPT + text
        }
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 200
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    // Parse the JSON response
    const result = JSON.parse(content) as TagDetectionResult;
    
    // Validate the response structure
    if (!result.tags || !Array.isArray(result.tags)) {
      throw new Error('Invalid response format: missing or invalid tags array');
    }
    
    if (!result.emotion_score || !['positive', 'negative', 'neutral'].includes(result.emotion_score)) {
      throw new Error('Invalid response format: missing or invalid emotion_score');
    }

    return result;

  } catch (error) {
    // Silently fall back without logging warnings for expected scenarios
    return fallbackDetectTags(text);
  }
} 