import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SpotsBar from '../SpotsBar'

describe('SpotsBar', () => {
  it('renders capacity text showing taken/capacity', () => {
    render(<SpotsBar capacity={20} taken={5} />)
    expect(screen.getByText('5/20 cupos')).toBeInTheDocument()
  })

  it('shows "Lista de espera" when full', () => {
    render(<SpotsBar capacity={10} taken={10} />)
    expect(screen.getByText('Lista de espera')).toBeInTheDocument()
  })

  it('shows "Lista de espera" when over capacity', () => {
    render(<SpotsBar capacity={10} taken={12} />)
    expect(screen.getByText('Lista de espera')).toBeInTheDocument()
  })

  it('hides label when showLabel is false', () => {
    render(<SpotsBar capacity={20} taken={5} showLabel={false} />)
    expect(screen.queryByText('5/20 cupos')).not.toBeInTheDocument()
  })

  it('uses green color when plenty of spots remaining', () => {
    const { container } = render(<SpotsBar capacity={100} taken={10} />)
    const bar = container.querySelector('[style]') as HTMLElement
    // Inner bar with backgroundColor
    const innerBar = container.querySelectorAll('[style]')[1] as HTMLElement
    expect(innerBar.style.backgroundColor).toBe('rgb(123, 218, 150)')  // #7bda96
  })

  it('uses amber color when remaining spots are 20% or less', () => {
    const { container } = render(<SpotsBar capacity={100} taken={85} />)
    const innerBar = container.querySelectorAll('[style]')[1] as HTMLElement
    expect(innerBar.style.backgroundColor).toBe('rgb(255, 197, 108)')  // #ffc56c
  })

  it('uses red color when spots are nearly full (less than 5%)', () => {
    const { container } = render(<SpotsBar capacity={100} taken={97} />)
    const innerBar = container.querySelectorAll('[style]')[1] as HTMLElement
    expect(innerBar.style.backgroundColor).toBe('rgb(255, 180, 171)')  // #ffb4ab
  })

  it('uses red color when completely full', () => {
    const { container } = render(<SpotsBar capacity={10} taken={10} />)
    const innerBar = container.querySelectorAll('[style]')[1] as HTMLElement
    expect(innerBar.style.backgroundColor).toBe('rgb(255, 180, 171)')  // #ffb4ab
  })

  it('handles zero capacity gracefully', () => {
    render(<SpotsBar capacity={0} taken={0} />)
    expect(screen.getByText('Lista de espera')).toBeInTheDocument()
  })
})
