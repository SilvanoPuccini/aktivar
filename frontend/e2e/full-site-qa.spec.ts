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

function trackPageErrors(page: import('@playwright/test').Page) {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  return pageErrors
}

async function getFixtureIds(request: import('@playwright/test').APIRequestContext) {
  const loginRes = await request.post(`${API_BASE_URL}/auth/token/`, { data: { email: DEMO_EMAIL, password: DEMO_PASSWORD } })
  expect(loginRes.ok()).toBeTruthy()
  const auth = await loginRes.json()
  const headers = { Authorization: `Bearer ${auth.access}` }

  const [activitiesRes, tripsRes, listingsRes] = await Promise.all([
    request.get(`${API_BASE_URL}/activities/`, { headers }),
    request.get(`${API_BASE_URL}/transport/trips/`, { headers }),
    request.get(`${API_BASE_URL}/ecosystem/marketplace/`, { headers }),
  ])

  expect(activitiesRes.ok()).toBeTruthy()
  expect(tripsRes.ok()).toBeTruthy()
  expect(listingsRes.ok()).toBeTruthy()

  const activities = await activitiesRes.json()
  const trips = await tripsRes.json()
  const listings = await listingsRes.json()

  return {
    activityId: (activities.results ?? activities)[0].id,
    tripId: (trips.results ?? trips)[0].id,
    listingSlug: (listings.results ?? listings)[0].slug,
  }
}

test.describe('Final full-site QA circuits', () => {
  test('public navigation, footer links, and marketplace detail flow work', async ({ page, request }) => {
    const pageErrors = trackPageErrors(page)
    await getFixtureIds(request)

    await page.goto('/')
    await expect(page.getByRole('heading', { name: /explora la próxima salida/i })).toBeVisible()

    await page.getByRole('button', { name: /mapa editorial/i }).click()
    await expect(page).toHaveURL(/\/explore$/)

    await page.goto('/marketplace')
    await expect(page.getByRole('heading', { name: /aktivar gear exchange/i })).toBeVisible()
    await page.getByRole('button', { name: /view gear/i }).first().click()
    await expect(page).toHaveURL(/\/marketplace\/.+/)
    const backToMarketplace = page.getByRole('button', { name: /back to marketplace/i }).first()
    await expect(backToMarketplace).toBeVisible()

    await backToMarketplace.click()
    await expect(page).toHaveURL(/\/marketplace$/)

    await page.goto('/journal')
    await page.getByRole('link', { name: /read full relato/i }).first().click()
    await expect(page).toHaveURL(/\/journal\/.+/)
    await page.getByRole('button', { name: /back to journal/i }).click()
    await expect(page).toHaveURL(/\/journal$/)

    await page.goto('/communities')
    await page.locator('main').getByRole('link', { name: /^marketplace$/i }).click()
    await expect(page).toHaveURL(/\/marketplace$/)

    await page.locator('footer').getByRole('link', { name: /^inicio$/i }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.locator('footer').getByRole('link', { name: /^perfil$/i }).click()
    await expect(page).toHaveURL(/\/login$/)

    expect(pageErrors).toEqual([])
  })

  test('authenticated users can complete core protected actions without dead ends', async ({ page, request }) => {
    const pageErrors = trackPageErrors(page)
    const { activityId, tripId } = await getFixtureIds(request)
    await authSession(page, request)

    await page.goto('/create')
    await expect(page.getByRole('heading', { name: /new activity/i })).toBeVisible()
    await page.getByRole('button', { name: /next expedition step/i }).click()
    await expect(page.locator('body')).toContainText(/paso 2\/3/i)
    await page.getByRole('button', { name: /^siguiente$/i }).click()
    await expect(page.locator('body')).toContainText(/paso 3\/3/i)
    await page.getByRole('button', { name: /anterior/i }).click()
    await expect(page.locator('body')).toContainText(/paso 2\/3/i)

    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /my trips/i })).toBeVisible()
    const openGroupChat = page.getByRole('button', { name: /open group chat/i }).first()
    if (await openGroupChat.count()) {
      await openGroupChat.click()
      await expect(page).toHaveURL(/\/chat\//)
    }

    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: /notificaciones/i })).toBeVisible()
    const markAllButton = page.getByRole('button', { name: /marcar todo/i })
    if (await markAllButton.count()) {
      await markAllButton.click()
      await expect(markAllButton).toHaveCount(0)
    }
    const notificationItems = page.locator('section button').filter({ has: page.locator('img') })
    if (await notificationItems.count()) {
      await notificationItems.first().click()
      await expect(page).toHaveURL(/\/(activity|chat)\//)
    }

    await page.goto(`/trip/${tripId}`)
    await expect(page.locator('body')).toContainText(/ride details|seats left|vehicle/i)
    await page.getByRole('button', { name: /emergency sos/i }).click()
    await expect(page).toHaveURL(/\/safety$/)

    await page.getByRole('button', { name: /mark route ready/i }).click()
    await expect(page.getByText('Route ready', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /mark health ready/i }).click()
    await expect(page.getByText('Health ready', { exact: true })).toBeVisible()

    await page.goto('/achievements')
    await expect(page.getByRole('heading', { name: /active challenges/i })).toBeVisible()
    await page.getByRole('button', { name: /explore marketplace/i }).click()
    await expect(page).toHaveURL(/\/marketplace$/)

    await page.goto(`/chat/${activityId}`)
    await expect(page.locator('body')).toContainText(/group chat|bienvenidos al grupo|escribe/i)

    expect(pageErrors).toEqual([])
  })
})
