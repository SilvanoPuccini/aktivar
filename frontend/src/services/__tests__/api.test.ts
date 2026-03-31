import { describe, it, expect } from 'vitest'
import { endpoints } from '../api'

describe('API endpoints', () => {
  it('has correct auth endpoints', () => {
    expect(endpoints.login).toBe('/auth/token/')
    expect(endpoints.refresh).toBe('/auth/token/refresh/')
    expect(endpoints.register).toBe('/users/register/')
  })

  it('has correct user endpoints', () => {
    expect(endpoints.users).toBe('/users/')
    expect(endpoints.me).toBe('/users/me/')
    expect(endpoints.myProfile).toBe('/users/me/profile/')
  })

  it('has correct activity endpoints', () => {
    expect(endpoints.activities).toBe('/activities/')
    expect(endpoints.categories).toBe('/activities/categories/')
  })

  it('has correct transport endpoints', () => {
    expect(endpoints.trips).toBe('/transport/trips/')
    expect(endpoints.vehicles).toBe('/transport/vehicles/')
  })

  it('generates correct messages endpoint for a given activity ID', () => {
    expect(endpoints.messages(42)).toBe('/chat/activities/42/messages/')
    expect(endpoints.messages(1)).toBe('/chat/activities/1/messages/')
  })

  it('has correct review and report endpoints', () => {
    expect(endpoints.reviews).toBe('/reviews/')
    expect(endpoints.reports).toBe('/reviews/reports/')
  })

  it('has correct payment endpoints', () => {
    expect(endpoints.payments).toBe('/payments/')
    expect(endpoints.subscriptions).toBe('/payments/subscriptions/')
  })

  it('has correct notification endpoint', () => {
    expect(endpoints.notifications).toBe('/notifications/')
  })

  it('has correct health endpoint', () => {
    expect(endpoints.health).toBe('/health/')
  })
})
