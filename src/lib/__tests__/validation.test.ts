import {
  validateCommunityName,
  validateCommunityDescription,
  sanitizeInput
} from '../validation'

describe('Community Validation', () => {
  describe('validateCommunityName', () => {
    it('should accept valid community names', () => {
      const validNames = [
        'Quiz Lovers',
        'Movie Buffs & Film Fans',
        'Tech Quiz!',
        'Science-Community_2024',
        'Books, Music & Art'
      ]

      validNames.forEach(name => {
        const result = validateCommunityName(name)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it('should reject names that are too short', () => {
      const result = validateCommunityName('AB')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Community name must be at least 3 characters long')
    })

    it('should reject names that are too long', () => {
      const longName = 'A'.repeat(51)
      const result = validateCommunityName(longName)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Community name must be no more than 50 characters')
    })

    it('should reject empty names', () => {
      const result = validateCommunityName('')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Community name is required')
    })

    it('should reject names with leading/trailing spaces', () => {
      const result = validateCommunityName(' Quiz Lovers ')
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Community name cannot have leading or trailing spaces')
    })

    it('should reject names with invalid characters', () => {
      const invalidNames = [
        'Quiz<script>',   // angle brackets
        'Community@#$',   // @ # $
        'Test~Name',      // tilde
        'Name|Pipe',      // pipe
        'Test*Name',      // asterisk
        'Name+Plus',      // plus
        'Name=Equals'     // equals
      ]

      invalidNames.forEach(name => {
        const result = validateCommunityName(name)
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('Community name contains invalid characters')
      })
    })

    it('should accept exactly 3 characters', () => {
      const result = validateCommunityName('ABC')
      expect(result.isValid).toBe(true)
    })

    it('should accept exactly 50 characters', () => {
      const name = 'A'.repeat(50)
      const result = validateCommunityName(name)
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateCommunityDescription', () => {
    it('should accept valid descriptions', () => {
      const validDescriptions = [
        'A community for quiz enthusiasts',
        'Join us to create and share quizzes!',
        'Short',
        'A'.repeat(500) // Exactly 500 characters
      ]

      validDescriptions.forEach(desc => {
        const result = validateCommunityDescription(desc)
        expect(result.isValid).toBe(true)
        expect(result.error).toBeUndefined()
      })
    })

    it('should accept null or undefined (optional field)', () => {
      expect(validateCommunityDescription(null).isValid).toBe(true)
      expect(validateCommunityDescription(undefined).isValid).toBe(true)
      expect(validateCommunityDescription('').isValid).toBe(true)
    })

    it('should reject descriptions that are too long', () => {
      const longDesc = 'A'.repeat(501)
      const result = validateCommunityDescription(longDesc)
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Community description must be no more than 500 characters')
    })

    it('should accept description at exactly 500 characters', () => {
      const desc = 'A'.repeat(500)
      const result = validateCommunityDescription(desc)
      expect(result.isValid).toBe(true)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeInput('<div>Hello</div>')).toBe('divHello/div')
      expect(sanitizeInput('Test<script>alert("xss")</script>')).toBe('Testscriptalert("xss")/script')
    })

    it('should remove javascript: protocol', () => {
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")')
      expect(sanitizeInput('JAVASCRIPT:void(0)')).toBe('void(0)')
    })

    it('should remove event handlers', () => {
      expect(sanitizeInput('onclick=alert("xss")')).toBe('alert("xss")')
      expect(sanitizeInput('onload=malicious()')).toBe('malicious()')
      expect(sanitizeInput('ONMOUSEOVER=bad()')).toBe('bad()')
    })

    it('should trim whitespace', () => {
      expect(sanitizeInput('  Hello  ')).toBe('Hello')
      expect(sanitizeInput('\n\tWorld\n\t')).toBe('World')
    })

    it('should handle empty input', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput('   ')).toBe('')
    })

    it('should preserve safe text', () => {
      const safeTexts = [
        'Hello World',
        'Quiz Community 2024',
        'Books, Movies & Games',
        'Science - Technology - Engineering'
      ]

      safeTexts.forEach(text => {
        expect(sanitizeInput(text)).toBe(text)
      })
    })

    it('should handle multiple XSS vectors', () => {
      const malicious = '<img src=x onerror=alert("xss")>'
      const sanitized = sanitizeInput(malicious)
      expect(sanitized).not.toContain('<')
      expect(sanitized).not.toContain('>')
      expect(sanitized).not.toContain('onerror=')
    })
  })
})
