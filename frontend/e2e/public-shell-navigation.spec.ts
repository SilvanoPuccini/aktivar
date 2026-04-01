import { expect, test } from '@playwright/test'

function trackPageErrors(page: import('@playwright/test').Page) {
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  return pageErrors
}

test.describe('Public shared-shell navigation', () => {
  test('public users can move through shared-shell routes without dead ends', async ({ page }) => {
    const pageErrors = trackPageErrors(page)

    await page.goto('/')
    await expect(page.getByRole('heading', { name: /explora la próxima salida/i })).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('footer').getByRole('link', { name: /^perfil$/i })).toHaveCount(0)
    await expect(page.locator('footer').getByRole('link', { name: /^safety$/i })).toHaveCount(0)

    await page.getByRole('button', { name: /mapa editorial/i }).click()
    await expect(page).toHaveURL(/\/explore$/)

    await page.goto('/journal')
    await expect(page.getByRole('link', { name: /read full relato/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /^safety$/i })).toHaveCount(0)
    await page.getByRole('link', { name: /read full relato/i }).first().click()
    await expect(page).toHaveURL(/\/journal\/.+/)
    await page.getByRole('button', { name: /back to journal/i }).click()
    await expect(page).toHaveURL(/\/journal$/)

    await page.getByRole('link', { name: /^communities$/i }).click()
    await expect(page).toHaveURL(/\/communities$/)
    await expect(page.getByRole('heading', { name: /find your tribe/i })).toBeVisible()
    await page.getByRole('button', { name: /join community/i }).first().click()
    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/marketplace')
    await expect(page.getByRole('heading', { name: /aktivar gear exchange/i })).toBeVisible()
    await page.getByRole('button', { name: /view gear/i }).first().click()
    await expect(page).toHaveURL(/\/marketplace\/.+/)
    await page.getByRole('button', { name: /back to marketplace/i }).first().click()
    await expect(page).toHaveURL(/\/marketplace$/)

    await page.locator('footer').getByRole('link', { name: /^inicio$/i }).click()
    await expect(page).toHaveURL(/\/$/)

    expect(pageErrors).toEqual([])
  })
})
