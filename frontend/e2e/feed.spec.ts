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

async function getFixtureIds(request: import('@playwright/test').APIRequestContext) {
  const loginRes = await request.post('http://127.0.0.1:8000/api/v1/auth/token/', { data: { email: DEMO_EMAIL, password: DEMO_PASSWORD } })
  const auth = await loginRes.json()
  const api = await request.get('http://127.0.0.1:8000/api/v1/activities/', { headers: { Authorization: `Bearer ${auth.access}` } })
  const tripApi = await request.get('http://127.0.0.1:8000/api/v1/transport/trips/', { headers: { Authorization: `Bearer ${auth.access}` } })
  const activities = await api.json()
  const trips = await tripApi.json()
  return {
    activityId: (activities.results ?? activities)[0].id,
    tripId: (trips.results ?? trips)[0].id,
  }
}

test.describe('Core frontend circuits with backend data', () => {
  test('home feed and explore render live backend content', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toContainText(/volcano sunset hike|explora la próxima salida|curated expedition feed/i)

    await page.goto('/explore')
    await expect(page.locator('body')).toContainText(/explora el territorio|volcano sunset hike|activas en pantalla/i)
  })

  test('activity detail route renders seeded backend activity', async ({ page, request }) => {
    const { activityId } = await getFixtureIds(request)
    await page.goto(`/activity/${activityId}`)
    await expect(page.locator('body')).toContainText(/volcano sunset hike|la experiencia|reserva/i)
  })

  test('trip detail route renders seeded backend trip', async ({ page, request }) => {
    const { tripId } = await getFixtureIds(request)
    await page.goto(`/trip/${tripId}`)
    await expect(page.locator('body')).toContainText(/ride details|vehicle|driver|reserva/i)
  })

  test('authenticated chat notifications payment and dashboard routes load', async ({ page, request }) => {
    const { activityId } = await getFixtureIds(request)
    await authSession(page, request)

    await page.goto(`/chat/${activityId}`)
    await expect(page.locator('body')).toContainText(/group chat|bienvenidos al grupo|escribe/i)

    await page.goto('/notifications')
    await expect(page.locator('body')).toContainText(/notificaciones|nuevo participante|nuevo mensaje/i)

    await page.goto(`/payment/${activityId}`)
    await expect(page.locator('body')).toContainText(/checkout|confirma tu lugar|booking confirmation/i)

    await page.goto('/dashboard')
    await expect(page.locator('body')).toContainText(/panel del organizador|actividades recientes|desglose financiero/i)
  })
})
