import { describe, it, expect } from 'vitest';
import { detectTags, TagDetectionResult } from '../src/lib/tags_model';

describe('detectTags', () => {
  it('detects emotion_score and positive sentiment', () => {
    const text = 'I am so happy and grateful for my recent achievement!';
    const result = detectTags(text);
    expect(result.tags).toContain('emotion_score');
    expect(result.emotion_score).toBe('positive');
    expect(result.tags).toContain('gratitude');
    expect(result.tags).toContain('achievement');
  });

  it('detects family and stress', () => {
    const text = 'My family is causing me a lot of stress lately.';
    const result = detectTags(text);
    expect(result.tags).toContain('family');
    expect(result.tags).toContain('stress');
    expect(result.emotion_score).toBe('negative');
  });

  it('detects work and neutral emotion', () => {
    const text = 'I went to work and finished my project.';
    const result = detectTags(text);
    expect(result.tags).toContain('work');
    expect(result.tags).not.toContain('stress');
    expect(result.emotion_score).toBe('neutral');
  });

  it('detects health and negative emotion', () => {
    const text = 'I have been feeling sick and stressed.';
    const result = detectTags(text);
    expect(result.tags).toContain('health');
    expect(result.tags).toContain('stress');
    expect(result.emotion_score).toBe('negative');
  });

  it('detects growth and relationships', () => {
    const text = 'I am learning new skills and making new friends.';
    const result = detectTags(text);
    expect(result.tags).toContain('growth');
    expect(result.tags).toContain('relationships');
    expect(result.emotion_score).toBe('neutral');
  });

  it('detects finance', () => {
    const text = 'I am saving money and paying off my debt.';
    const result = detectTags(text);
    expect(result.tags).toContain('finance');
    expect(result.emotion_score).toBe('neutral');
  });

  it('always includes emotion_score', () => {
    const text = 'Random text with no keywords.';
    const result = detectTags(text);
    expect(result.tags).toContain('emotion_score');
    expect(['positive', 'negative', 'neutral']).toContain(result.emotion_score);
  });
}); 