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

  return body.access as string
}

async function getJson<T>(request: import('@playwright/test').APIRequestContext, path: string, token?: string): Promise<T> {
  const res = await request.get(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  expect(res.ok()).toBeTruthy()
  return res.json() as Promise<T>
}

function asList<T>(payload: T[] | { results?: T[] }): T[] {
  return Array.isArray(payload) ? payload : (payload.results ?? [])
}

test.describe('Ecosystem route smoke coverage', () => {
  test('public ecosystem routes render seeded backend content', async ({ page, request }) => {
    const communities = asList(await getJson<Array<{ name: string }> | { results?: Array<{ name: string }> }>(request, '/ecosystem/communities/'))
    const stories = asList(await getJson<Array<{ title: string; slug: string }> | { results?: Array<{ title: string; slug: string }> }>(request, '/ecosystem/journal/'))
    const listings = asList(await getJson<Array<{ title: string }> | { results?: Array<{ title: string }> }>(request, '/ecosystem/marketplace/'))

    await page.goto('/communities')
    await expect(page.locator('body')).toContainText(communities[0].name)
    await expect(page.locator('body')).toContainText(/find your tribe/i)

    await page.goto('/journal')
    await expect(page.locator('body')).toContainText(stories[0].title)
    await expect(page.locator('body')).toContainText(/trending now|reader picks/i)

    await page.goto(`/journal/${stories[0].slug}`)
    await expect(page.locator('body')).toContainText(stories[0].title)
    await expect(page.locator('body')).toContainText(/author|reading time/i)

    await page.goto('/marketplace')
    await expect(page.locator('body')).toContainText(listings[0].title)
    await expect(page.locator('body')).toContainText(/aktivar gear exchange|premium marketplace/i)
  })

  test('protected ecosystem routes load with authenticated session', async ({ page, request }) => {
    const token = await authSession(page, request)
    const rank = await getJson<{ title: string; next_unlock: string }>(request, '/ecosystem/rank/', token)
    const safety = await getJson<{ status: { current_location: string }; checklist: { permits_count: number } }>(request, '/ecosystem/safety/', token)

    await page.goto('/marketplace/new')
    await expect(page.getByRole('heading', { name: /list your gear/i })).toBeVisible()
    await expect(page.locator('body')).toContainText(/publish gear|marketplace/i)

    await page.goto('/safety')
    await expect(page.locator('body')).toContainText(/safety & sos command center/i)
    await expect(page.locator('body')).toContainText(safety.status.current_location)
    await expect(page.locator('body')).toContainText(String(safety.checklist.permits_count))

    await page.goto('/achievements')
    await expect(page.locator('body')).toContainText(rank.title)
    await expect(page.locator('body')).toContainText(rank.next_unlock)
  })
})
