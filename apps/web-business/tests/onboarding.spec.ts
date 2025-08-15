import { test, expect } from '@playwright/test';
import { loginUser, TEST_USERS } from './helpers';

test.describe('Onboarding', () => {
    test.beforeEach(async ({ page }) => {
        // logout the user
        // First navigate to your app domain
        await page.goto('/');

        // Now clear storage (localStorage will be accessible)
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // Clear cookies
        await page.context().clearCookies();
    });

    test('new user is redirected to onboarding', async ({ page }) => {
        // Login as user without business
        await loginUser(page, 'userWithoutBusiness');

        // Should automatically redirect to onboarding
        await expect(page).toHaveURL('/onboarding');
    });

    test('user with business is redirected to dashboard', async ({ page }) => {
        // Login as user with business
        await loginUser(page, 'userWithBusiness');

        // Should automatically redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
    });

    // A not logged in user going to / should be redirected to sign-in
    test('not logged in user going to /dashboard should be redirected to sign-in', async ({ page }) => {
        // Go to /
        await page.goto('/dashboard');

        // Should automatically redirect to sign-in
        await expect(page).toHaveURL('http://localhost:5173/sign-in?redirect=%2Fdashboard');
    });
});