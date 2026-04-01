import { expect, test } from '@playwright/test'

const fakeUser = {
  id: 7,
  email: 'qa@aktivar.app',
  full_name: 'QA Organizer',
  avatar: 'https://example.com/avatar.jpg',
  is_verified_email: true,
}

const fakeCategory = {
  id: 1,
  name: 'Hiking',
  slug: 'hiking',
  icon: 'mountain',
  color: '#7bda96',
  is_outdoor: true,
}

function futureDate(daysAhead = 5) {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return date.toISOString().slice(0, 10)
}

async function mockCommonApi(page: import('@playwright/test').Page) {
  await page.route('**/api/v1/activities/categories/', async (route) => {
    await route.fulfill({ json: [fakeCategory] })
  })

  await page.route('**/api/v1/activities/', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { results: [] } })
      return
    }

    await route.fallback()
  })
}

async function mockAuthenticatedSession(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('aktivar_access_token', 'playwright-access-token')
    sessionStorage.setItem('aktivar_refresh_token', 'playwright-refresh-token')
  })

  await page.route('**/api/v1/users/me/', async (route) => {
    await route.fulfill({ json: fakeUser })
  })
}

async function fillRequiredCreateFlow(page: import('@playwright/test').Page, options?: { endTime?: string }) {
  await page.getByPlaceholder('e.g., Pacific Coast Road Trip').fill(`QA Activity ${Date.now()}`)
  await page.getByRole('button', { name: /hiking/i }).click()
  await page.getByPlaceholder('Tell the explorers what to expect...').fill('A short QA activity used to verify the create flow.')
  await page.getByRole('button', { name: /next expedition step/i }).click()

  await page.locator('input[type="date"]').first().fill(futureDate())
  await page.locator('input[type="time"]').nth(0).fill('10:00')
  await page.locator('input[type="time"]').nth(1).fill(options?.endTime ?? '13:00')
  await page.getByPlaceholder('Circuito Chico, Bariloche').fill('Circuito Chico, Bariloche')
  await page.getByRole('button', { name: /^siguiente$/i }).click()
}

test.describe('create activity micro-QA', () => {
  test('protected create route sends the user through login and back again', async ({ page }) => {
    await mockCommonApi(page)

    await page.route('**/api/v1/auth/token/', async (route) => {
      await route.fulfill({ json: { access: 'playwright-access-token', refresh: 'playwright-refresh-token' } })
    })

    await page.route('**/api/v1/users/me/', async (route) => {
      await route.fulfill({ json: fakeUser })
    })

    await page.goto('/create')

    await expect(page).toHaveURL(/\/login$/)
    await page.locator('input[type="email"]').fill('qa@aktivar.app')
    await page.locator('input[type="password"]').fill('test-password')
    await page.getByRole('button', { name: /continue/i }).click()

    await page.waitForURL('**/create')
    await expect(page.getByRole('heading', { name: /new activity/i })).toBeVisible()
  })

  test('blocks publishing when the end time is before the start time', async ({ page }) => {
    await mockCommonApi(page)
    await mockAuthenticatedSession(page)

    let createRequests = 0
    await page.route('**/api/v1/activities/', async (route) => {
      if (route.request().method() === 'POST') {
        createRequests += 1
        await route.fulfill({ status: 201, json: { id: 99 } })
        return
      }

      await route.fallback()
    })

    await page.goto('/create')
    await fillRequiredCreateFlow(page, { endTime: '09:30' })
    await page.getByRole('button', { name: /publicar actividad/i }).click()

    await expect(page.getByText(/la hora de fin debe ser posterior al inicio/i)).toBeVisible()
    expect(createRequests).toBe(0)
  })

  test('blocks publishing when a paid activity has no positive price', async ({ page }) => {
    await mockCommonApi(page)
    await mockAuthenticatedSession(page)

    let createRequests = 0
    await page.route('**/api/v1/activities/', async (route) => {
      if (route.request().method() === 'POST') {
        createRequests += 1
        await route.fulfill({ status: 201, json: { id: 99 } })
        return
      }

      await route.fallback()
    })

    await page.goto('/create')
    await fillRequiredCreateFlow(page)
    await page.getByRole('button', { name: /^pago$/i }).click()
    await page.getByRole('button', { name: /publicar actividad/i }).click()

    await expect(page.getByText(/precio mayor a 0/i)).toBeVisible()
    expect(createRequests).toBe(0)
  })

  test('publishes a valid activity and sends the expected payload', async ({ page }) => {
    await mockCommonApi(page)
    await mockAuthenticatedSession(page)

    let payload: Record<string, unknown> | null = null
    await page.route('**/api/v1/activities/', async (route) => {
      if (route.request().method() === 'POST') {
        payload = route.request().postDataJSON() as Record<string, unknown>
        await route.fulfill({
          status: 201,
          json: {
            id: 321,
            ...payload,
          },
        })
        return
      }

      await route.fallback()
    })

    await page.goto('/create')
    await fillRequiredCreateFlow(page)
    await page.getByRole('button', { name: /^pago$/i }).click()
    await page.getByPlaceholder('Precio por persona').fill('25000')
    await page.getByPlaceholder('12.5').fill('8.5')
    await page.getByPlaceholder('Agua, rompeviento, linterna, snack, documento').fill('Agua y rompeviento')
    await page.getByRole('button', { name: /publicar actividad/i }).click()

    await page.waitForURL('**/')
    await expect(page.getByText(/actividad creada/i)).toBeVisible()
    expect(payload).toMatchObject({
      title: expect.stringMatching(/^QA Activity /),
      description: 'A short QA activity used to verify the create flow.',
      category: fakeCategory.id,
      location_name: 'Circuito Chico, Bariloche',
      meeting_point: 'Circuito Chico, Bariloche',
      price: 25000,
      difficulty: 'moderate',
      distance_km: 8.5,
      what_to_bring: 'Agua y rompeviento',
    })
  })
})
