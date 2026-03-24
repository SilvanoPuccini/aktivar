import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CTAButton from '../CTAButton'

describe('CTAButton', () => {
  it('renders with the provided label', () => {
    render(<CTAButton label="Sign Up" />)
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('shows loading spinner when loading is true', () => {
    render(<CTAButton label="Submit" loading />)
    // The Loader2 icon renders as an SVG with the animate-spin class
    const button = screen.getByRole('button')
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<CTAButton label="Click Me" disabled />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button.className).toContain('opacity-50')
  })

  it('is disabled when loading is true', () => {
    render(<CTAButton label="Loading" loading />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<CTAButton label="Click Me" onClick={handleClick} />)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<CTAButton label="Disabled" onClick={handleClick} disabled />)
    await user.click(screen.getByRole('button'))

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies primary variant styles by default', () => {
    render(<CTAButton label="Primary" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('text-[#442c00]')
    expect(button.style.background).toContain('linear-gradient')
  })

  it('applies secondary variant styles', () => {
    render(<CTAButton label="Secondary" variant="secondary" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-transparent')
    expect(button.className).toContain('border')
  })

  it('applies danger variant styles', () => {
    render(<CTAButton label="Delete" variant="danger" />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-error')
  })

  it('applies fullWidth class when fullWidth is true', () => {
    render(<CTAButton label="Full" fullWidth />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('w-full')
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<CTAButton label="Small" size="sm" />)
    expect(screen.getByRole('button').className).toContain('text-xs')

    rerender(<CTAButton label="Large" size="lg" />)
    expect(screen.getByRole('button').className).toContain('text-base')
  })
})
