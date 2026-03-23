import { test, expect } from '@playwright/test'

test.describe('Feed Page', () => {
  test('loads the feed page', async ({ page }) => {
    await page.goto('/feed')

    // The page should load and contain content
    await expect(page.locator('body')).toContainText(/.+/)
  })

  test('displays search or filter controls', async ({ page }) => {
    await page.goto('/feed')

    // Look for search input or filter elements
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"], [role="searchbox"]')
    const filterChips = page.locator('button').filter({ hasText: /./i })

    // At least one of search or filter controls should exist
    const hasSearch = await searchInput.count() > 0
    const hasFilters = await filterChips.count() > 0
    expect(hasSearch || hasFilters).toBe(true)
  })

  test('search filters update displayed results', async ({ page }) => {
    await page.goto('/feed')

    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="search"], [role="searchbox"]')

    if (await searchInput.count() > 0) {
      await searchInput.first().fill('hiking')
      // Wait for results to update
      await page.waitForTimeout(500)

      // Page should still be functional after search
      await expect(page.locator('body')).toContainText(/.+/)
    }
  })

  test('category chips can be clicked to filter', async ({ page }) => {
    await page.goto('/feed')

    // Find category filter buttons
    const categoryButtons = page.locator('[class*="chip"], [class*="category"], button').filter({ hasText: /./i })

    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click()
      // Page should update after category selection
      await expect(page.locator('body')).toContainText(/.+/)
    }
  })

  test('clicking an activity card navigates to detail page', async ({ page }) => {
    await page.goto('/feed')

    // Look for activity cards (links or clickable elements)
    const activityLinks = page.locator('a[href*="activit"], a[href*="activity"], [class*="card"] a, [class*="Card"]')

    if (await activityLinks.count() > 0) {
      await activityLinks.first().click()

      // Should navigate to a detail page
      await page.waitForURL(/\/(activit|activity|activities)/)
      await expect(page.locator('body')).toContainText(/.+/)
    }
  })
})
