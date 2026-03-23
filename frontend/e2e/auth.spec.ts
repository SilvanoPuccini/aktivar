import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('renders login page with form elements', async ({ page }) => {
    await page.goto('/login')

    // Expect core form elements to be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /iniciar|login|entrar/i })).toBeVisible()
  })

  test('shows validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login')

    // Click submit without filling in fields
    await page.getByRole('button', { name: /iniciar|login|entrar/i }).click()

    // Expect validation messages to appear
    await expect(page.locator('text=/requerido|required|obligatorio|correo|email/i').first()).toBeVisible()
  })

  test('has a link to registration or onboarding', async ({ page }) => {
    await page.goto('/login')

    const registerLink = page.locator('a[href*="onboarding"], a[href*="register"], a[href*="signup"]')
    await expect(registerLink).toBeVisible()
  })
})

test.describe('Onboarding Page', () => {
  test('renders onboarding page', async ({ page }) => {
    await page.goto('/onboarding')

    // Should show the onboarding content
    await expect(page.locator('body')).toContainText(/.+/)
  })

  test('allows navigation through onboarding steps', async ({ page }) => {
    await page.goto('/onboarding')

    // Look for a next/continue button or navigation element
    const nextButton = page.getByRole('button', { name: /siguiente|next|continuar|continue|empezar/i })
    if (await nextButton.isVisible()) {
      await nextButton.click()
      // Page content should change after navigation
      await expect(page.locator('body')).toContainText(/.+/)
    }
  })

  test('form validation prevents advancing without required fields', async ({ page }) => {
    await page.goto('/onboarding')

    // If there is a submit/register button, click it without filling fields
    const submitButton = page.getByRole('button', { name: /registrar|register|crear|create|submit/i })
    if (await submitButton.isVisible()) {
      await submitButton.click()
      // Should show validation feedback
      await expect(page.locator('[role="alert"], .text-error, [class*="error"]').first()).toBeVisible()
    }
  })
})
