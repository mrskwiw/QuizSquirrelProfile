/**
 * Tests for Facebook OAuth helpers
 */

import {
  generateOAuthState,
  validateState,
  generateFacebookAuthUrl,
} from '../oauth';

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    FACEBOOK_APP_ID: 'test-app-id',
    FACEBOOK_APP_SECRET: 'test-app-secret',
    FACEBOOK_CALLBACK_URL: 'http://localhost:3000/api/social/facebook/auth/callback',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Facebook OAuth Helpers', () => {
  describe('generateOAuthState', () => {
    it('should generate a random state string', () => {
      const state1 = generateOAuthState();
      const state2 = generateOAuthState();

      expect(state1).toBeTruthy();
      expect(state2).toBeTruthy();
      expect(state1).not.toBe(state2);
      expect(state1.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate hex strings', () => {
      const state = generateOAuthState();
      expect(state).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('validateState', () => {
    it('should return true for matching states', () => {
      const state = 'test-state-123';
      expect(validateState(state, state)).toBe(true);
    });

    it('should return false for non-matching states', () => {
      expect(validateState('state1', 'state2')).toBe(false);
    });

    it('should return false for empty states', () => {
      expect(validateState('', 'state')).toBe(false);
      expect(validateState('state', '')).toBe(false);
      expect(validateState('', '')).toBe(false);
    });

    it('should return false for null/undefined states', () => {
      expect(validateState(null as any, 'state')).toBe(false);
      expect(validateState('state', undefined as any)).toBe(false);
    });
  });

  describe('generateFacebookAuthUrl', () => {
    it('should generate valid authorization URL', () => {
      const state = 'test-state';
      const url = generateFacebookAuthUrl(state);

      expect(url).toContain('https://www.facebook.com/v22.0/dialog/oauth');
      expect(url).toContain('client_id=test-app-id');
      expect(url).toContain('redirect_uri=http');
      expect(url).toContain('state=test-state');
      expect(url).toContain('response_type=code');
    });

    it('should include required scopes', () => {
      const state = 'test-state';
      const url = generateFacebookAuthUrl(state);

      expect(url).toContain('scope=');
      expect(url).toContain('pages_show_list');
      expect(url).toContain('pages_read_engagement');
      expect(url).toContain('pages_manage_posts');
    });

    it('should throw error if FACEBOOK_APP_ID is not set', () => {
      delete process.env.FACEBOOK_APP_ID;

      expect(() => generateFacebookAuthUrl('state')).toThrow(
        'FACEBOOK_APP_ID environment variable is not set'
      );
    });

    it('should throw error if FACEBOOK_CALLBACK_URL is not set', () => {
      delete process.env.FACEBOOK_CALLBACK_URL;

      expect(() => generateFacebookAuthUrl('state')).toThrow(
        'FACEBOOK_CALLBACK_URL environment variable is not set'
      );
    });

    it('should include the state parameter in URL', () => {
      const state = 'test-state-123';
      const url = generateFacebookAuthUrl(state);

      // URLSearchParams may encode differently than encodeURIComponent
      // Just verify state is present in the URL
      expect(url).toContain('state=');
      expect(url).toContain('test-state-123');
    });
  });
});
