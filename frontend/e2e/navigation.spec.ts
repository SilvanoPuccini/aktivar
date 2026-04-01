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

async function expectNoPageErrors(page: import('@playwright/test').Page, action: () => Promise<void>) {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await action()
  expect(pageErrors).toEqual([])
}

test.describe('Navigation quality pass', () => {
  test('public users can move through core and ecosystem navigation', async ({ page }) => {
    await expectNoPageErrors(page, async () => {
      await page.goto('/')
      await expect(page.getByRole('heading', { name: /explora la próxima salida/i })).toBeVisible()

      await page.getByRole('button', { name: /explorar/i }).first().click()
      await expect(page).toHaveURL(/\/explore$/)
      await expect(page.getByText(/explora el territorio/i)).toBeVisible()

      await page.goto('/')
      await page.getByRole('link', { name: /journal/i }).click()
      await expect(page).toHaveURL(/\/journal$/)
      await expect(page.getByRole('link', { name: /read more|read full relato/i }).first()).toBeVisible()

      await page.getByRole('link', { name: /read more|read full relato/i }).first().click()
      await expect(page).toHaveURL(/\/journal\/.+/)
      await expect(page.getByRole('button', { name: /back to journal/i })).toBeVisible()
      await page.getByRole('button', { name: /back to journal/i }).click()
      await expect(page).toHaveURL(/\/journal$/)

      await page.getByRole('link', { name: /^communities$/i }).click()
      await expect(page).toHaveURL(/\/communities$/)
      await expect(page.getByText(/find your tribe/i)).toBeVisible()

      await page.getByRole('button', { name: /join community/i }).first().click()
      await expect(page).toHaveURL(/\/login$/)

      await page.goto('/marketplace')
      await expect(page.getByRole('heading', { name: /aktivar gear exchange/i })).toBeVisible()
      await page.getByRole('button', { name: /list your gear/i }).click()
      await expect(page).toHaveURL(/\/login$/)
    })
  })

  test('ecosystem surfaces cross-link cleanly with the shared shell', async ({ page, request }) => {
    await authSession(page, request)

    await expectNoPageErrors(page, async () => {
      await page.goto('/communities')
      await page.locator('main').getByRole('link', { name: /^journal$/i }).click()
      await expect(page).toHaveURL(/\/journal$/)
      await expect(page.locator('body')).toContainText(/reader picks|trending now/i)

      await page.locator('main').getByRole('link', { name: /^marketplace$/i }).click()
      await expect(page).toHaveURL(/\/marketplace$/)
      await expect(page.getByRole('heading', { name: /aktivar gear exchange/i })).toBeVisible()

      await page.getByRole('button', { name: /list your gear/i }).click()
      await expect(page).toHaveURL(/\/marketplace\/new$/)
      await expect(page.getByRole('heading', { name: /list your gear/i })).toBeVisible()

      await page.locator('main').getByRole('link', { name: /^safety$/i }).click()
      await expect(page).toHaveURL(/\/safety$/)
      await expect(page.getByRole('heading', { name: /safety & sos command center/i })).toBeVisible()

      await page.locator('main').getByRole('link', { name: /^ranks$/i }).click()
      await expect(page).toHaveURL(/\/achievements$/)
      await expect(page.getByRole('heading', { name: /active challenges/i })).toBeVisible()

      await page.locator('footer').getByRole('link', { name: /^explorar$/i }).click()
      await expect(page).toHaveURL(/\/explore$/)
      await expect(page.getByText(/explora el territorio/i)).toBeVisible()

      await page.getByRole('button', { name: /inicio/i }).first().click()
      await expect(page).toHaveURL(/\/$/)
    })
  })

  test('authenticated users can traverse protected navigation and ecosystem actions', async ({ page, request }) => {
    await authSession(page, request)
    const listingTitle = `Navigation Test Tent ${Date.now()}`

    await expectNoPageErrors(page, async () => {
      await page.goto('/')
      await page.getByRole('button', { name: /perfil/i }).first().click()
      await expect(page).toHaveURL(/\/profile$/)
      await expect(page.getByRole('heading', { name: /explorer profile/i })).toBeVisible()

      await page.getByRole('button', { name: /explorar/i }).first().click()
      await expect(page).toHaveURL(/\/explore$/)

      await page.goto('/notifications')
      await expect(page.getByRole('heading', { name: 'Notificaciones', exact: true })).toBeVisible()
      const markAllButton = page.getByRole('button', { name: /marcar todo/i })
      if (await markAllButton.count()) {
        await markAllButton.click()
        await expect(markAllButton).toHaveCount(0)
      } else {
        await expect(page.locator('body')).toContainText(/notificaciones|nuevo participante|nuevo mensaje|actividad reciente/i)
      }

      await page.goto('/marketplace')
      await page.getByRole('button', { name: /list your gear/i }).click()
      await expect(page).toHaveURL(/\/marketplace\/new$/)
      await page.getByPlaceholder('Title').fill(listingTitle)
      await page.getByPlaceholder('Subcategory').fill('4-season')
      await page.getByPlaceholder('Price').fill('199')
      await page.getByPlaceholder('Location').fill('Bariloche')
      await page.getByPlaceholder('Cover image URL').fill('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee')
      await page.getByRole('button', { name: /publish gear/i }).click()
      await expect(page).toHaveURL(/\/marketplace$/)
      await expect(page.getByText(listingTitle)).toBeVisible()

      await page.goto('/safety')
      await expect(page.getByRole('heading', { name: /safety & sos command center/i })).toBeVisible()
      await page.getByRole('button', { name: /mark route ready/i }).click()
      await expect(page.getByText('Route ready', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: /mark health ready/i }).click()
      await expect(page.getByText('Health ready', { exact: true })).toBeVisible()

      await page.goto('/achievements')
      await expect(page.getByRole('heading', { name: /active challenges/i })).toBeVisible()
      await page.getByRole('button', { name: /explore marketplace/i }).click()
      await expect(page).toHaveURL(/\/marketplace$/)
    })
  })
})
