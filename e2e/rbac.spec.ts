import { test, expect } from '@playwright/test';

/**
 * RBAC Verification Test
 * This test assumes the app is running and Supabase local/dev instance is available.
 * It tests:
 * 1. Admin login and Customer creation.
 * 2. Customer login and data isolation (can't see other data).
 * 3. Admin global visibility (can see customer's data).
 */

test.describe('Role-Based Access Control (RBAC)', () => {
    const adminEmail = 'admin@ats.com';
    const adminPass = 'Test123';

    const customerEmail = `customer_${Date.now()}@test.com`;
    const customerPass = 'cust123456';

    test('Admin can create a customer and manage global data', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER:', msg.text()));

        // 1. Login as Admin
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPass);
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard or admin
        await expect(page).toHaveURL(/.*(dashboard|admin|candidates)/, { timeout: 15000 });

        // 2. Go to Admin Settings
        await page.goto('/admin');
        await expect(page.locator('h1')).toContainText('Administration');

        // 3. Create a new Customer
        await page.fill('input[placeholder="user@example.com"]', customerEmail);
        await page.selectOption('select', 'customer');
        await page.fill('input[placeholder="············"]', customerPass);
        await page.click('button:has-text("Create Account")');

        // Verify success message
        await expect(page.locator('text=Customer account created successfully')).toBeVisible();

        // 4. Verification of Multi-tenancy
        // Logout
        await page.evaluate(() => localStorage.clear()); // Simple way to clear session
        await page.goto('/login');

        // 5. Login as the NEW Customer
        await page.fill('input[type="email"]', customerEmail);
        await page.fill('input[type="password"]', customerPass);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/.*dashboard/);

        // Verify customer sees NO jobs initially
        await page.goto('/jobs');
        await expect(page.locator('text=No jobs posted')).toBeVisible();

        // 6. Customer creates a Job
        await page.click('button:has-text("Post Job")');
        await page.fill('input[placeholder="e.g. Senior Frontend Engineer"]', 'Test Job Isolated');
        await page.fill('textarea', 'This job should only be visible to this customer and admins.');
        await page.click('button:has-text("Create Job")');

        await expect(page.locator('text=Test Job Isolated')).toBeVisible();

        // 7. Logout and Login back as Admin to verify global visibility
        await page.evaluate(() => localStorage.clear());
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPass);
        await page.click('button[type="submit"]');

        // 8. Admin check Jobs - should see the customer's job
        await page.goto('/jobs');
        await expect(page.locator('text=Test Job Isolated')).toBeVisible();

        // 9. Admin check Kanban - should see customer's candidates if any existed
        // (In this test we just verify the job is there)
    });

    test('Customer cannot access Admin page', async ({ page }) => {
        // Login as existing or new customer
        await page.goto('/login');
        await page.fill('input[type="email"]', customerEmail);
        await page.fill('input[type="password"]', customerPass);
        await page.click('button[type="submit"]');

        // Try to force navigate to /admin
        await page.goto('/admin');

        // Should be redirected or show "Unauthorized" (the middleware handles this)
        // Assuming middleware redirects to dashboard if not admin
        await expect(page).not.toHaveURL(/.*admin/);
    });
});
