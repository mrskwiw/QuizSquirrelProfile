/**
 * Tests for Facebook formatter
 */

import { formatQuizForFacebook } from '../../formatter';
import type { QuizShareContent } from '../../types';

describe('Facebook Formatter', () => {
  const baseQuizContent: QuizShareContent = {
    title: 'Test Quiz',
    description: 'This is a test quiz description',
    coverImage: 'https://example.com/image.jpg',
    category: 'Entertainment',
    tags: ['fun', 'quiz'],
    quizUrl: 'https://example.com/quiz/123',
    creatorName: 'Test User',
  };

  describe('formatQuizForFacebook', () => {
    it('should format basic quiz content', () => {
      const formatted = formatQuizForFacebook(baseQuizContent);

      expect(formatted.message).toContain('Test Quiz');
      expect(formatted.message).toContain('This is a test quiz description');
      expect(formatted.message).toContain('Take the quiz: https://example.com/quiz/123');
      expect(formatted.message).toContain('Created by Test User on Quiz Squirrel');
      expect(formatted.link).toBe('https://example.com/quiz/123');
      expect(formatted.picture).toBe('https://example.com/image.jpg');
    });

    it('should handle quiz without description', () => {
      const content = { ...baseQuizContent, description: null };
      const formatted = formatQuizForFacebook(content);

      expect(formatted.message).toContain('Test Quiz');
      expect(formatted.message).not.toContain('This is a test quiz');
      expect(formatted.message).toContain('Take the quiz:');
    });

    it('should handle quiz without cover image', () => {
      const content = { ...baseQuizContent, coverImage: null };
      const formatted = formatQuizForFacebook(content);

      expect(formatted.message).toBeTruthy();
      expect(formatted.link).toBe('https://example.com/quiz/123');
      expect(formatted.picture).toBeUndefined();
    });

    it('should truncate long descriptions', () => {
      const longDescription = 'A'.repeat(250);
      const content = { ...baseQuizContent, description: longDescription };
      const formatted = formatQuizForFacebook(content);

      const descInMessage = formatted.message.split('\n\n')[1];
      expect(descInMessage.length).toBeLessThanOrEqual(203); // 200 + '...'
      expect(descInMessage).toContain('...');
    });

    it('should not truncate short descriptions', () => {
      const shortDescription = 'Short description';
      const content = { ...baseQuizContent, description: shortDescription };
      const formatted = formatQuizForFacebook(content);

      expect(formatted.message).toContain(shortDescription);
      expect(formatted.message).not.toContain('...');
    });

    it('should include quiz URL in link field', () => {
      const formatted = formatQuizForFacebook(baseQuizContent);

      expect(formatted.link).toBe(baseQuizContent.quizUrl);
    });

    it('should include attribution to creator', () => {
      const formatted = formatQuizForFacebook(baseQuizContent);

      expect(formatted.message).toContain('Created by Test User on Quiz Squirrel');
    });

    it('should format message with proper line breaks', () => {
      const formatted = formatQuizForFacebook(baseQuizContent);

      // Should have title, description, link, and attribution separated by double newlines
      const parts = formatted.message.split('\n\n');
      expect(parts.length).toBeGreaterThanOrEqual(3);
    });
  });
});
