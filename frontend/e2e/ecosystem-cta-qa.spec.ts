import { expect, test } from '@playwright/test'

const DEMO_EMAIL = 'demo@aktivar.app'
const DEMO_PASSWORD = 'aktivar123'

async function mockAuthEndpoints(page: import('@playwright/test').Page) {
  await page.route('**/auth/token/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: 'test-access-token', refresh: 'test-refresh-token' }),
    })
  })

  await page.route('**/users/me/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        email: DEMO_EMAIL,
        full_name: 'Demo Explorer',
        phone: '+56 9 1111 1111',
        bio: 'QA session',
        avatar: null,
        is_organizer: true,
      }),
    })
  })
}

async function loginThroughUi(page: import('@playwright/test').Page) {
  await page.getByRole('textbox', { name: 'Email address' }).fill(DEMO_EMAIL)
  await page.getByRole('textbox', { name: 'Password' }).fill(DEMO_PASSWORD)
  await expect(page.getByRole('button', { name: /continue/i })).toBeEnabled()
  await page.getByRole('button', { name: /continue/i }).click()
}

test.describe('Ecosystem CTA micro-QA', () => {
  test('safety keeps visible fallback states when backend responses degrade', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('aktivar_access_token', 'test-access-token')
      sessionStorage.setItem('aktivar_refresh_token', 'test-refresh-token')
    })

    await page.route('**/users/me/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: DEMO_EMAIL,
          full_name: 'Demo Explorer',
          phone: '+56 9 1111 1111',
          bio: 'QA session',
          avatar: null,
          is_organizer: true,
        }),
      })
    })

    await page.route('**/ecosystem/safety/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: {
            expedition_protocol: 'Manual fallback',
            current_location: 'Fallback Ridge',
            temperature_c: 0,
            wind_kmh: 0,
            visibility_m: 0,
            risk_level: 'warning',
            storm_warning: 'Manual weather review required.',
            system_status: 'Degraded',
            last_sync_at: 'not-a-date',
          },
          checklist: {
            gear_progress: 0,
            gear_target: 0,
            route_status: 'incomplete',
            health_status: 'ready',
            permits_count: 0,
            updated_at: '2026-04-01T15:35:00Z',
          },
          contacts: [],
          logs: [],
          active_trip: null,
        }),
      })
    })

    await page.goto('/safety')
    await expect(page.getByRole('heading', { name: /safety & sos command center/i })).toBeVisible()
    await expect(page.getByText(/0% del equipo esencial confirmado/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /hold to broadcast/i })).toBeVisible()
  })
})
