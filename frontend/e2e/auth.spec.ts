import { expect, test, type Page } from '@playwright/test'

const ACCESS_TOKEN = 'playwright-access-token'
const REFRESH_TOKEN = 'playwright-refresh-token'
const DEMO_EMAIL = 'demo@aktivar.app'
const DEMO_PASSWORD = 'aktivar123'

const mockUser = {
  id: 1,
  email: DEMO_EMAIL,
  full_name: 'Catalina Reyes',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Catalina',
  bio: 'Amante del trekking y la naturaleza.',
  phone: '+56912345678',
  role: 'organizer',
  is_verified_email: true,
  is_verified_phone: true,
  profile: {
    location_name: 'Santiago, Chile',
    latitude: -33.4489,
    longitude: -70.6693,
    bio_extended: 'Organizadora de actividades outdoor.',
    website: 'https://catalinareyes.cl',
    instagram: '@cata.aventura',
    total_activities: 87,
    total_km: 1420,
    total_people_met: 342,
    badges: [],
  },
  created_at: '2023-01-15T10:00:00Z',
}

function trackPageErrors(page: Page) {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  return pageErrors
}

async function mockAuthApi(
  page: Page,
  options: {
    loginStatus?: number
    currentUserStatus?: number
  } = {},
) {
  const { loginStatus = 200, currentUserStatus = 200 } = options

  await page.route('**/api/v1/auth/token/', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }

    if (loginStatus !== 200) {
      await route.fulfill({
        status: loginStatus,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: ACCESS_TOKEN, refresh: REFRESH_TOKEN }),
    })
  })

  await page.route('**/api/v1/auth/token/refresh/', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Refresh expired' }),
    })
  })

  await page.route('**/api/v1/users/me/', async (route) => {
    if (currentUserStatus !== 200) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Unauthorized' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockUser),
    })
  })
}

test.describe('Auth and protected routes', () => {
  test('login shows a visible auth error on invalid credentials', async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await mockAuthApi(page, { loginStatus: 401 })

    await page.goto('/login')
    await page.locator('input[type="email"]').fill(DEMO_EMAIL)
    await page.locator('input[type="password"]').fill('wrong-password')
    await page.getByRole('button', { name: /continue/i }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('[role="status"]')).toContainText(/email o contraseña incorrectos/i)
    expect(pageErrors).toEqual([])
  })

  test('protected profile route redirects through login and returns to profile after sign-in', async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await mockAuthApi(page)

    await page.goto('/profile')
    await expect(page).toHaveURL(/\/login$/)

    await page.locator('input[type="email"]').fill(DEMO_EMAIL)
    await page.locator('input[type="password"]').fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: /continue/i }).click()

    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.locator('body')).toContainText(/catalina reyes/i)
    expect(pageErrors).toEqual([])
  })

  test('public activity join preserves the return path through login', async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await mockAuthApi(page)

    await page.goto('/activity/1')
    await page.getByRole('button', { name: /join activity/i }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.locator('input[type="email"]').fill(DEMO_EMAIL)
    await page.locator('input[type="password"]').fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: /continue/i }).click()

    await expect(page).toHaveURL(/\/activity\/1$/)
    await expect(page.locator('body')).toContainText(/bienvenido de vuelta|join activity/i)
    expect(pageErrors).toEqual([])
  })

  test('expired sessions fall back to login instead of keeping a fake signed-in user', async ({ page }) => {
    const pageErrors = trackPageErrors(page)
    await mockAuthApi(page, { currentUserStatus: 401 })

    await page.addInitScript(([access, refresh]) => {
      sessionStorage.setItem('aktivar_access_token', access)
      sessionStorage.setItem('aktivar_refresh_token', refresh)
    }, ['expired-access-token', 'expired-refresh-token'])

    await page.goto('/profile')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.locator('body')).not.toContainText(/catalina reyes/i)
    await expect.poll(() => page.evaluate(() => ({
      access: sessionStorage.getItem('aktivar_access_token'),
      refresh: sessionStorage.getItem('aktivar_refresh_token'),
    }))).toEqual({ access: null, refresh: null })
    expect(pageErrors).toEqual([])
  })
})
