import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectTagsWithOpenAI, TagDetectionResult } from '../src/lib/tags_model_openai';

// Mock console.warn to suppress expected error messages during tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = vi.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

// Mock the openai module
vi.mock('../src/lib/openai', () => ({
  hasRealOpenAIKey: vi.fn()
}));

// Mock the OpenAI client
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }))
}));

describe('detectTagsWithOpenAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns fallback when OpenAI key is not available', async () => {
    const { hasRealOpenAIKey } = await import('../src/lib/openai');
    vi.mocked(hasRealOpenAIKey).mockReturnValue(false);

    const text = 'I am happy and grateful for my family.';
    const result = await detectTagsWithOpenAI(text);

    expect(result).toEqual({
      tags: ['emotion_score'],
      emotion_score: 'neutral'
    });
  });

  it('calls OpenAI API when key is available', async () => {
    const { hasRealOpenAIKey } = await import('../src/lib/openai');
    vi.mocked(hasRealOpenAIKey).mockReturnValue(true);

    const mockOpenAI = await import('openai');
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  tags: ['emotion_score', 'family', 'gratitude'],
                  emotion_score: 'positive'
                })
              }
            }]
          })
        }
      }
    };
    vi.mocked(mockOpenAI.default).mockImplementation(() => mockClient as any);

    const text = 'I am happy and grateful for my family.';
    const result = await detectTagsWithOpenAI(text);

    expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes text and identifies relevant tags. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: expect.stringContaining('Text to analyze: I am happy and grateful for my family.')
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    expect(result).toEqual({
      tags: ['emotion_score', 'family', 'gratitude'],
      emotion_score: 'positive'
    });
  });

  it('handles OpenAI API errors gracefully', async () => {
    const { hasRealOpenAIKey } = await import('../src/lib/openai');
    vi.mocked(hasRealOpenAIKey).mockReturnValue(true);

    const mockOpenAI = await import('openai');
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    };
    vi.mocked(mockOpenAI.default).mockImplementation(() => mockClient as any);

    const text = 'I am happy and grateful for my family.';
    const result = await detectTagsWithOpenAI(text);

    expect(result).toEqual({
      tags: ['emotion_score'],
      emotion_score: 'neutral'
    });
  });

  it('handles invalid JSON response from OpenAI', async () => {
    const { hasRealOpenAIKey } = await import('../src/lib/openai');
    vi.mocked(hasRealOpenAIKey).mockReturnValue(true);

    const mockOpenAI = await import('openai');
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Invalid JSON response'
              }
            }]
          })
        }
      }
    };
    vi.mocked(mockOpenAI.default).mockImplementation(() => mockClient as any);

    const text = 'I am happy and grateful for my family.';
    const result = await detectTagsWithOpenAI(text);

    expect(result).toEqual({
      tags: ['emotion_score'],
      emotion_score: 'neutral'
    });
  });

  it('validates response structure and falls back on invalid format', async () => {
    const { hasRealOpenAIKey } = await import('../src/lib/openai');
    vi.mocked(hasRealOpenAIKey).mockReturnValue(true);

    const mockOpenAI = await import('openai');
    const mockClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  tags: 'not an array',
                  emotion_score: 'invalid'
                })
              }
            }]
          })
        }
      }
    };
    vi.mocked(mockOpenAI.default).mockImplementation(() => mockClient as any);

    const text = 'I am happy and grateful for my family.';
    const result = await detectTagsWithOpenAI(text);

    expect(result).toEqual({
      tags: ['emotion_score'],
      emotion_score: 'neutral'
    });
  });
}); 