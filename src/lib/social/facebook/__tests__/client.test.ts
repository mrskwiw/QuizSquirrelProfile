/**
 * Tests for Facebook Graph API Client
 */

import { createGraphAPIClient } from '../client';
import { SocialMediaError } from '../../types';

describe('Facebook Graph API Client', () => {
  describe('createGraphAPIClient', () => {
    it('should create axios instance with access token', () => {
      const token = 'test-access-token';
      const client = createGraphAPIClient(token);

      expect(client).toBeDefined();
      expect(client.defaults.baseURL).toBe('https://graph.facebook.com/v22.0');
      expect(client.defaults.params.access_token).toBe(token);
      expect(client.defaults.timeout).toBe(30000);
    });

    it('should throw error if token is not provided', () => {
      expect(() => createGraphAPIClient('')).toThrow('Page access token is required');
    });

    it('should set correct headers', () => {
      const token = 'test-access-token';
      const client = createGraphAPIClient(token);

      expect(client.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Error Messages', () => {
    it('should use correct Graph API version', () => {
      const token = 'test-token';
      const client = createGraphAPIClient(token);

      expect(client.defaults.baseURL).toContain('v22.0');
    });
  });
});
