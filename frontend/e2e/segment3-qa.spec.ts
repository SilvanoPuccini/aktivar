import { expect, test } from '@playwright/test'

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'
const DEMO_EMAIL = 'demo@aktivar.app'
const DEMO_PASSWORD = 'aktivar123'

async function authSession(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext) {
  const res = await request.post(`${API_BASE_URL}/auth/token/`, {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  await page.addInitScript(([access, refresh]) => {
    sessionStorage.setItem('aktivar_access_token', access)
    sessionStorage.setItem('aktivar_refresh_token', refresh)
  }, [body.access, body.refresh])
}

test.describe('Segment 3 QA', () => {
  test.setTimeout(60000)

  test('public ecosystem CTAs recover from empty and degraded states', async ({ page }) => {
    await page.goto('/communities')
    await page.getByRole('textbox', { name: /find your tribe/i }).fill('zzzz-no-results')
    await expect(page.getByText(/no encontramos comunidades/i)).toBeVisible()
    await page.getByRole('button', { name: /reset filters/i }).click()
    await expect(page.getByRole('heading', { name: /find your tribe/i })).toBeVisible()

    await page.goto('/journal')
    await expect(page.getByRole('link', { name: /read full relato/i }).first()).toBeVisible()

    await page.goto('/marketplace')
    await expect(page.getByRole('heading', { name: /aktivar gear exchange/i })).toBeVisible()

    await page.getByRole('textbox', { name: /busca por marca, seller o tipo de equipo/i }).fill('zzzz-no-results')
    await expect(page.getByText(/no encontramos gear/i)).toBeVisible()
    await page.getByRole('button', { name: /reset filters/i }).click()
    await expect(page.getByRole('button', { name: /view gear/i }).first()).toBeVisible()

    await page.getByRole('button', { name: /view gear/i }).first().click()
    await expect(page).toHaveURL(/\/marketplace\/.+/)
    await expect(page.getByRole('button', { name: /back to marketplace/i }).first()).toBeVisible()
  })

  test('authenticated create and export actions stay visible and usable', async ({ page, request }) => {
    await authSession(page, request)

    await page.goto('/marketplace/new')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /list your gear/i })).toBeVisible()

    await page.getByRole('button', { name: /publish gear/i }).click()
    await expect(page.getByText(/completa título, tipo de gear y ubicación/i)).toBeVisible()
    await expect(page).toHaveURL(/\/marketplace\/new$/)

    const listingTitle = `Segment 3 Tent ${Date.now()}`
    await page.getByPlaceholder('Title').fill(listingTitle)
    await page.getByPlaceholder('Subcategory').fill('4-season shelter')
    await page.getByPlaceholder('Price').fill('189000')
    await page.getByPlaceholder('Location').fill('Bariloche')
    await page.getByPlaceholder('Cover image URL').fill('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee')
    await page.getByRole('button', { name: /publish gear/i }).click()
    await expect(page).toHaveURL(/\/marketplace$/)
    await expect(page.getByText(listingTitle)).toBeVisible()

    await page.route('**/api/v1/activities/dashboard/', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'temporary outage' }),
      })
    })
    await page.route('**/api/v1/activities/dashboard/export/', async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'temporary outage' }),
      })
    })

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /my trips/i })).toBeVisible()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: /exportar csv/i }).click()
    await downloadPromise
  })
})
