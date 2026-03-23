import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from '../EmptyState'

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No Activities Found" />)
    expect(screen.getByText('No Activities Found')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(
      <EmptyState
        title="No Results"
        description="Try adjusting your search filters"
      />
    )
    expect(screen.getByText('Try adjusting your search filters')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(0)
  })

  it('renders an icon when provided', () => {
    render(
      <EmptyState
        title="No Data"
        icon={<span data-testid="test-icon">Icon</span>}
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders action button and handles click', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(
      <EmptyState
        title="No Activities"
        action={{ label: 'Create Activity', onClick: handleClick }}
      />
    )

    const button = screen.getByText('Create Activity')
    expect(button).toBeInTheDocument()

    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not render action button when not provided', () => {
    render(<EmptyState title="Nothing Here" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
