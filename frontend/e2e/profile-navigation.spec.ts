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

test('authenticated profile navigation stays usable', async ({ page, request }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await authSession(page, request)
  await page.goto('/')

  await page.locator('footer').getByRole('link', { name: /^perfil$/i }).click()
  await expect(page).toHaveURL(/\/profile$/)
  await expect(page.getByRole('heading', { name: /demo organizer/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /tu historia/i })).toBeVisible()

  await page.getByRole('button', { name: /explorar/i }).first().click()
  await expect(page).toHaveURL(/\/explore$/)

  await page.getByRole('button', { name: /perfil/i }).first().click()
  await expect(page).toHaveURL(/\/profile$/)

  await page.getByRole('button', { name: /cerrar sesión/i }).click()
  await expect(page).toHaveURL(/\/login$/)

  expect(pageErrors).toEqual([])
})
