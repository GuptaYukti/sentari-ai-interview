// tags_model.ts
// Defines the set of tags to detect in transcribed text and provides detection logic.

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

// Simple keyword-based rules for each tag
const TAG_KEYWORDS: Record<Tag, string[]> = {
  emotion_score: ['happy', 'sad', 'angry', 'excited', 'upset', 'joy', 'depressed', 'neutral', 'positive', 'negative'],
  growth: ['learn', 'improve', 'grew', 'develop', 'progress', 'self-improvement', 'skill'],
  family: ['family', 'mother', 'father', 'sister', 'brother', 'parent', 'child', 'children'],
  work: ['work', 'job', 'career', 'office', 'boss', 'colleague', 'promotion', 'project'],
  health: ['health', 'sick', 'ill', 'wellness', 'doctor', 'hospital', 'exercise', 'diet'],
  relationships: ['friend', 'partner', 'relationship', 'girlfriend', 'boyfriend', 'spouse', 'marriage'],
  finance: ['money', 'finance', 'salary', 'expense', 'cost', 'pay', 'debt', 'savings'],
  stress: ['stress', 'anxiety', 'pressure', 'overwhelmed', 'tense', 'worried'],
  achievement: ['achieve', 'accomplish', 'success', 'win', 'award', 'goal', 'milestone'],
  gratitude: ['grateful', 'thankful', 'appreciate', 'gratitude', 'thanks'],
};

/**
 * Analyzes text sentiment using keyword-based scoring.
 * 
 * This function implements a simple sentiment analysis by counting positive and negative
 * keywords in the text. It maintains separate lists of positive and negative words,
 * then calculates a score based on their presence.
 * 
 * @param text - The input text to analyze for sentiment
 * @returns The detected sentiment: 'positive', 'negative', or 'neutral'
 * 
 * @example
 * ```typescript
 * detectEmotionScore("I am happy and grateful") // returns 'positive'
 * detectEmotionScore("I feel sad and stressed") // returns 'negative'
 * detectEmotionScore("The weather is cloudy")   // returns 'neutral'
 * ```
 */
function detectEmotionScore(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['happy', 'joy', 'excited', 'grateful', 'thankful', 'win', 'success', 'achievement'];
  const negativeWords = ['sad', 'angry', 'upset', 'depressed', 'sick', 'anxiety', 'stress', 'worried'];
  let score = 0;
  for (const word of positiveWords) {
    if (text.toLowerCase().includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (text.toLowerCase().includes(word)) score--;
  }
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

/**
 * Detects relevant tags in transcribed text using keyword matching.
 * 
 * This function analyzes the input text to identify relevant tags from a predefined set.
 * It uses keyword-based detection for most tags and a simple sentiment analysis for
 * emotion_score. The function is deterministic and works offline without external APIs.
 * 
 * Algorithm:
 * 1. Convert text to lowercase for case-insensitive matching
 * 2. Check each tag's keyword list for matches
 * 3. Perform sentiment analysis for emotion_score
 * 4. Return structured result with detected tags and emotion score
 * 
 * @param text - The transcribed text to analyze for tags
 * @returns A TagDetectionResult containing detected tags and emotion score
 * 
 * @example
 * ```typescript
 * const result = detectTags("I'm learning new skills at work");
 * // Returns: { tags: ['growth', 'work', 'emotion_score'], emotion_score: 'neutral' }
 * 
 * const result2 = detectTags("I'm grateful for my family's support");
 * // Returns: { tags: ['gratitude', 'family', 'emotion_score'], emotion_score: 'positive' }
 * ```
 */
export function detectTags(text: string): TagDetectionResult {
  const detected: Tag[] = [];
  const lower = text.toLowerCase();
  for (const tag of TAGS) {
    if (tag === 'emotion_score') continue; // handled separately
    for (const keyword of TAG_KEYWORDS[tag]) {
      if (lower.includes(keyword)) {
        detected.push(tag);
        break;
      }
    }
  }
  // Always include emotion_score and its value
  const emotion_score = detectEmotionScore(text);
  detected.push('emotion_score');
  return { tags: detected, emotion_score };
} 