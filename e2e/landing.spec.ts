import { test, expect } from '@playwright/test';

test('has title and can navigate to login', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Mini ATS/);

    // Click the get started link.
    await page.getByRole('link', { name: 'Get Started' }).click();

    // Expects page to have a heading with the name of Welcome back.
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});
