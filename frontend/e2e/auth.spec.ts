import { test, expect } from '@playwright/test'

const DEMO_EMAIL = 'demo@aktivar.app'
const DEMO_PASSWORD = 'aktivar123'

async function authSession(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext) {
  const res = await request.post('http://127.0.0.1:8000/api/v1/auth/token/', {
    data: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  await page.addInitScript(([access, refresh]) => {
    sessionStorage.setItem('aktivar_access_token', access)
    sessionStorage.setItem('aktivar_refresh_token', refresh)
  }, [body.access, body.refresh])
}

test.describe('Auth and protected routes', () => {
  test('login page renders and can authenticate with real backend', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /bienvenido de vuelta/i })).toBeVisible()
    await page.locator('input[type="email"]').fill(DEMO_EMAIL)
    await page.locator('input[type="password"]').fill(DEMO_PASSWORD)
    await page.getByRole('button', { name: /continue|iniciar/i }).click()
    await page.waitForURL('**/')
    await expect(page.locator('body')).toContainText(/explora|expedici|aktivar/i)
  })

  test('onboarding flow renders and advances through steps', async ({ page }) => {
    await page.goto('/onboarding')
    await expect(page.locator('body')).toContainText(/join the adventure|aktivar/i)
    await page.locator('input').nth(0).fill('Smoke Tester')
    await page.locator('input').nth(1).fill('smoke@aktivar.app')
    await page.locator('input').nth(2).fill('aktivar123')
    await page.getByRole('button', { name: /continue/i }).click()
    await expect(page.locator('body')).toContainText(/what fuels your soul|step 02|select/i)
  })

  test('protected profile route loads with authenticated session', async ({ page, request }) => {
    await authSession(page, request)
    await page.goto('/profile')
    await expect(page.locator('body')).toContainText(/demo organizer|tu historia|explorer profile/i)
  })
})
