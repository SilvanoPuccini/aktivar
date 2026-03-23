import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryChip from '../CategoryChip'

const mockCategory = { name: 'Hiking', icon: 'mountain', color: '#4CAF50' }

describe('CategoryChip', () => {
  it('renders the category name', () => {
    render(<CategoryChip category={mockCategory} />)
    expect(screen.getByText('Hiking')).toBeInTheDocument()
  })

  it('renders as a button', () => {
    render(<CategoryChip category={mockCategory} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies selected styles when selected is true', () => {
    render(<CategoryChip category={mockCategory} selected />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-secondary')
    expect(button.className).toContain('text-surface')
  })

  it('applies unselected styles when selected is false', () => {
    render(<CategoryChip category={mockCategory} selected={false} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-surface-container-highest')
    expect(button.className).toContain('text-on-surface-variant')
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<CategoryChip category={mockCategory} onClick={handleClick} />)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders with small size class', () => {
    render(<CategoryChip category={mockCategory} size="sm" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('text-xs')
  })

  it('renders with medium size class by default', () => {
    render(<CategoryChip category={mockCategory} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('text-sm')
  })

  it('renders a fallback icon for unknown icon names', () => {
    const unknownCategory = { name: 'Unknown', icon: 'nonexistent' }
    render(<CategoryChip category={unknownCategory} />)
    // Should still render without crashing (uses HelpCircle fallback)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
