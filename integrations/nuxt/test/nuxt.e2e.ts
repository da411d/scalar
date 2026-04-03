import { expect, test } from '@playwright/test'

test('Renders scalar/galaxy api reference from nuxt', async ({ page }) => {
  await page.goto('/_scalar')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()
})

test('Does not throw CJS module errors in browser console', async ({ page }) => {
  const consoleErrors: string[] = []
  const jsErrors: Error[] = []

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  // Capture JavaScript errors
  page.on('pageerror', (error) => {
    jsErrors.push(error)
  })

  // Navigate to the Scalar page
  await page.goto('/_scalar')

  // Wait for the page to fully load and hydrate
  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()

  // Wait a bit more for any lazy-loaded modules
  await page.waitForTimeout(2000)

  // Check for CJS module errors
  const cjsErrors = [
    ...consoleErrors.filter((msg) => msg.includes('does not provide an export named')),
    ...jsErrors.filter(
      (error) => error.message.includes('does not provide an export named') || error.message.includes('SyntaxError'),
    ),
  ]

  // Assert no CJS module errors occurred
  expect(cjsErrors, `Found CJS module errors: ${JSON.stringify(cjsErrors, null, 2)}`).toHaveLength(0)

  // Also verify specific problematic modules don't appear in errors
  const problematicModules = [
    'extend',
    'debug',
    'ajv',
    'jsonpointer',
    'highlight.js',
    'highlightjs-curl',
    'whatwg-mimetype',
  ]

  for (const moduleName of problematicModules) {
    const moduleErrors = [
      ...consoleErrors.filter((msg) => msg.includes(moduleName)),
      ...jsErrors.filter((error) => error.message.includes(moduleName)),
    ]

    // Filter errors that are strings (console errors) or have message property (Error objects)
    const exportErrors = moduleErrors.filter((msg) =>
      typeof msg === 'string'
        ? msg.includes('does not provide an export')
        : msg.message?.includes('does not provide an export'),
    )

    expect(exportErrors, `Found errors related to ${moduleName} module`).toHaveLength(0)
  }
})

test('API reference UI is fully functional', async ({ page }) => {
  await page.goto('/_scalar')

  // Wait for the main heading
  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()

  // Verify sidebar exists (may be hidden on mobile, visible on desktop)
  const sidebar = page.locator('.t-doc__sidebar').first()
  await expect(sidebar).toBeAttached()

  // Verify the page has rendered content (not a blank page or error page)
  const bodyText = await page.textContent('body')
  expect(bodyText).toContain('Nitro Server Routes')

  // Verify no critical JavaScript errors prevented rendering
  expect(bodyText).not.toContain('does not provide an export')
  expect(bodyText).not.toContain('SyntaxError')
  expect(bodyText).not.toContain('Unexpected token')

  // Verify operations are rendered (check for HTTP methods or endpoint text)
  // Use regex to be more flexible with whitespace and formatting
  expect(bodyText).toMatch(/GET|POST|PUT|DELETE|PATCH/)
})
