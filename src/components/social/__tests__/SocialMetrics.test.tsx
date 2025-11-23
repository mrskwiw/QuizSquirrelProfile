import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SocialMetrics } from '../SocialMetrics'

const mockPosts = [
  {
    id: 'post-1',
    platform: 'TUMBLR' as const,
    externalUrl: 'https://example.tumblr.com/post/123',
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    lastSyncedAt: new Date('2024-01-15T12:00:00Z'),
    likes: 1234,
    shares: 567,
    comments: 89,
    views: 12345,
    blogName: 'my-awesome-blog',
  },
  {
    id: 'post-2',
    platform: 'TUMBLR' as const,
    externalUrl: 'https://example.tumblr.com/post/456',
    publishedAt: new Date('2024-01-14T10:00:00Z'),
    lastSyncedAt: null,
    likes: 50,
    shares: 10,
    comments: 5,
    views: 200,
    blogName: 'another-blog',
  },
]

describe('SocialMetrics', () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockReset()
  })

  it('shows loading state initially', () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<SocialMetrics quizId="quiz-123" />)

    expect(screen.getByText('Social Media Performance')).toBeInTheDocument()
    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('fetches posts on mount', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: mockPosts }),
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/quiz/quiz-123/social-posts')
    })
  })

  it('displays empty state when no posts exist', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [] }),
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByText(/hasn't been shared on social media yet/i)).toBeInTheDocument()
    })
  })

  it('displays post metrics correctly', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [mockPosts[0]] }),
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByText('1.2K')).toBeInTheDocument() // likes formatted
      expect(screen.getByText('567')).toBeInTheDocument() // shares
      expect(screen.getByText('89')).toBeInTheDocument() // comments
      expect(screen.getByText('12.3K')).toBeInTheDocument() // views formatted
    })
  })

  it('displays blog name for Tumblr posts', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [mockPosts[0]] }),
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByText('my-awesome-blog')).toBeInTheDocument()
    })
  })

  it('formats numbers correctly for large values', async () => {
    const postWithLargeNumbers = {
      ...mockPosts[0],
      likes: 1500000, // Should show as 1.5M
      views: 2300, // Should show as 2.3K
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [postWithLargeNumbers] }),
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByText('1.5M')).toBeInTheDocument()
      expect(screen.getByText('2.3K')).toBeInTheDocument()
    })
  })

  it('renders View Post link with correct URL', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [mockPosts[0]] }),
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      const link = screen.getByText('View Post →') as HTMLAnchorElement
      expect(link.href).toBe(mockPosts[0].externalUrl)
      expect(link.target).toBe('_blank')
      expect(link.rel).toContain('noopener')
    })
  })

  it('handles sync button click', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [mockPosts[0]] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          metrics: {
            likes: 2000,
            shares: 600,
            comments: 100,
            views: 15000,
          },
        }),
      })

    render(<SocialMetrics quizId="quiz-123" />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('1.2K')).toBeInTheDocument()
    })

    // Click sync button
    const syncButton = screen.getByRole('button', { name: /sync/i })
    fireEvent.click(syncButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/social/tumblr/posts/${mockPosts[0].id}`,
        { method: 'PATCH' }
      )
    })
  })

  it('updates metrics after successful sync', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [mockPosts[0]] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          metrics: {
            likes: 2000,
            shares: 700,
            comments: 150,
            views: 20000,
          },
        }),
      })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByText('1.2K')).toBeInTheDocument()
    })

    const syncButton = screen.getByRole('button', { name: /sync/i })
    fireEvent.click(syncButton)

    await waitFor(() => {
      expect(screen.getByText('2.0K')).toBeInTheDocument() // Updated likes
      expect(screen.getByText('700')).toBeInTheDocument() // Updated shares
    })
  })

  it('disables sync buttons while syncing', async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: mockPosts }),
      })
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /sync/i })).toHaveLength(2)
    })

    const syncButtons = screen.getAllByRole('button', { name: /sync/i })
    fireEvent.click(syncButtons[0])

    await waitFor(() => {
      syncButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  it('handles sync errors gracefully', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation()

    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ posts: [mockPosts[0]] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Sync failed' }),
      })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sync/i })).toBeInTheDocument()
    })

    const syncButton = screen.getByRole('button', { name: /sync/i })
    fireEvent.click(syncButton)

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Sync failed')
    })

    alertMock.mockRestore()
  })

  it('displays multiple posts in order', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: mockPosts }),
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByText('my-awesome-blog')).toBeInTheDocument()
      expect(screen.getByText('another-blog')).toBeInTheDocument()
    })
  })

  it('handles 404 responses gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByText(/hasn't been shared on social media yet/i)).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [] }),
    })

    const { container } = render(<SocialMetrics quizId="quiz-123" className="custom-class" />)

    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('shows "Never" for null lastSyncedAt', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posts: [mockPosts[1]] }), // This post has null lastSyncedAt
    })

    render(<SocialMetrics quizId="quiz-123" />)

    await waitFor(() => {
      expect(screen.getByText(/Last synced: Never/i)).toBeInTheDocument()
    })
  })
})
