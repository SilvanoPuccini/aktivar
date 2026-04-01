import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { type ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import JournalPage from '../pages/JournalPage'
import JournalStoryPage from '../pages/JournalStoryPage'
import type { JournalStory } from '@/types/ecosystem'

const hooksMock = vi.hoisted(() => ({
  useJournalStories: vi.fn(),
  useFeaturedJournalStory: vi.fn(),
  useTrendingJournalStories: vi.fn(),
}))

vi.mock('@/services/hooks', () => hooksMock)

const baseStory: JournalStory = {
  id: 1,
  title: 'Dawn push above Catedral',
  slug: 'dawn-push-above-catedral',
  category_label: 'Mountain journal',
  region_label: 'Bariloche',
  summary: 'Summary',
  body: 'Body',
  author_name: 'Catalina Reyes',
  cover_image: 'https://images.unsplash.com/photo-1',
  featured_quote: 'Quote',
  distance_km: 14,
  elevation_m: 1180,
  read_time_minutes: 7,
  is_featured: true,
  is_trending: true,
  published_at: '2026-03-26T09:00:00Z',
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

function renderJournal(ui: ReactNode, initialEntry = '/journal') {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/journal" element={ui} />
          <Route path="/journal/:slug" element={ui} />
          <Route path="/" element={<div>Home</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('journal route micro-QA', () => {
  it('shows a loading state instead of the empty state during initial journal fetch', () => {
    hooksMock.useFeaturedJournalStory.mockReturnValue({ data: undefined, isLoading: true })
    hooksMock.useJournalStories.mockReturnValue({ data: undefined, isLoading: true })
    hooksMock.useTrendingJournalStories.mockReturnValue({ data: undefined, isLoading: true })

    renderJournal(<JournalPage />)

    expect(screen.getByLabelText('Cargando journal')).toBeInTheDocument()
    expect(screen.queryByText('El journal está vacío por ahora')).not.toBeInTheDocument()
  })

  it('keeps a usable CTA when the journal list is empty', async () => {
    const user = userEvent.setup()

    hooksMock.useFeaturedJournalStory.mockReturnValue({ data: undefined, isLoading: false })
    hooksMock.useJournalStories.mockReturnValue({ data: [], isLoading: false })
    hooksMock.useTrendingJournalStories.mockReturnValue({ data: [], isLoading: false })

    renderJournal(<JournalPage />)

    await user.click(screen.getByRole('button', { name: /ir al inicio/i }))
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('finds a story from featured/trending data when the journal list is inconsistent', () => {
    hooksMock.useFeaturedJournalStory.mockReturnValue({ data: baseStory, isLoading: false })
    hooksMock.useJournalStories.mockReturnValue({ data: [], isLoading: false })
    hooksMock.useTrendingJournalStories.mockReturnValue({ data: [baseStory], isLoading: false })

    renderJournal(<JournalStoryPage />, `/journal/${baseStory.slug}`)

    expect(screen.getByRole('heading', { name: baseStory.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to journal/i })).toBeInTheDocument()
  })

  it('shows a not found state only after the data has finished loading', () => {
    hooksMock.useFeaturedJournalStory.mockReturnValue({ data: undefined, isLoading: false })
    hooksMock.useJournalStories.mockReturnValue({ data: [], isLoading: false })
    hooksMock.useTrendingJournalStories.mockReturnValue({ data: [], isLoading: false })

    renderJournal(<JournalStoryPage />, '/journal/missing-story')

    expect(screen.getByText('Relato no encontrado')).toBeInTheDocument()
    expect(screen.queryByText('Cargando relato…')).not.toBeInTheDocument()
  })
})
