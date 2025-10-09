/// <reference types="node" />

import { test, expect } from '@playwright/test';
import { loginUser } from './helpers';
import { ConvexHttpClient } from "convex/browser";
import { api } from '@repo/api/convex/_generated/api';

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

test.describe('Venue, Template & Calendar Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        await client.mutation(api.testFunctions.resetTestData, { testRunId: `test_${Date.now()}` });

        // Clear storage and cookies
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.context().clearCookies();
    });

    test.afterAll(async () => {
        // Cleanup test data after all tests complete
        await client.mutation(api.testFunctions.resetTestData, { testRunId: `cleanup_${Date.now()}` });
    });

    test('complete flow: create venue → template → class instances', async ({ page }) => {
        // Step 1: Login as user with business
        await loginUser(page, 'userWithBusiness');
        await expect(page).toHaveURL('/dashboard');

        // Step 2: Navigate to venues section through Settings
        await page.click('text=user_with_business'); // Click on user dropdown in sidenav
        await page.click('text=Settings'); // Click on Settings in dropdown
        await page.click('text=Venues'); // Click on Venues tab in settings
        await page.click('button:has-text("Add another venue")');

        // Fill venue form
        await page.fill('[name="name"]', 'gefatest01 Test Yoga Studio');
        await page.fill('[name="email"]', 'studio@testyoga.com');
        await page.fill('[name="description"]', 'A beautiful yoga studio for all levels of practice');
        await page.fill('[name="phone"]', '+30 123 456 7890');
        await page.fill('[name="website"]', 'https://testyoga.com');
        // Select business category from dropdown
        await page.click('text=Business Category');
        await page.keyboard.press('Enter'); // Select the first/highlighted option
        await page.fill('[name="addressStreet"]', '123 Yoga Street');
        await page.fill('[name="addressCity"]', 'Athens');
        await page.fill('[name="addressZipCode"]', '12345');

        // Select some services
        await page.check('label:has-text("Yoga")');
        await page.check('label:has-text("Meditation")');

        // Select some amenities
        await page.check('label:has-text("Mats Provided")');
        await page.check('label:has-text("Showers")');

        // Submit venue creation
        await page.click('button:has-text("Create venue")');
        await expect(page.locator('text=Venue created successfully')).toBeVisible();

        // Step 3: Verify venue was created
        await expect(page.locator('text=gefatest01 Test Yoga Studio').first()).toBeVisible();

        // Step 4: Navigate to templates and create a new template
        await page.click('text=Lessons');
        await page.click('button:has-text("Create Template")');

        // Fill template form
        await page.fill('[name="name"]', 'gefatest01 Morning Hatha Yoga');
        await page.fill('[name="instructor"]', 'Maria Kalogirou');
        await page.fill('[name="description"]', 'A gentle morning flow suitable for all levels');

        // Select the venue we just created
        await page.click('text=Venue');
        await page.keyboard.press('Enter'); // Select the first/highlighted option

        // Set duration, capacity, and price
        await page.getByLabel('Duration').click();
        await page.getByRole('option', { name: '90 minutes' }).click();

        await page.fill('[name="capacity"]', '20');
        await page.fill('[name="price"]', '25'); // €25

        // Add some tags
        await page.fill('input[placeholder*="tag"]', 'hatha');
        await page.keyboard.press('Enter');
        await page.fill('input[placeholder*="tag"]', 'beginner-friendly');
        await page.keyboard.press('Enter');

        // Set booking window
        await page.fill('[name="bookingWindowMinHours"]', '2');
        await page.fill('[name="bookingWindowMaxHours"]', '168');
        await page.fill('[name="cancellationWindowHours"]', '4');

        // Step 5: Add two discount rules
        await page.click('button:has-text("Add Rule")');

        // First discount rule - Early bird discount
        await page.locator('label:has-text("Type")').first().click();
        await page.getByRole('option', { name: 'Early Booking' }).click();
        await page.fill('input[name*="condition.hours"]', '48');
        await page.fill('input[name*="discount.value"]', '500'); // €5.00 discount

        // Add second discount rule
        await page.click('button:has-text("Add Rule")');
        await page.locator('label:has-text("Type")').nth(1).click();
        await page.getByRole('option', { name: 'Last Minute' }).click();
        await page.fill('input[name*="condition.hours"]:last-of-type', '4');
        await page.fill('input[name*="discount.value"]:last-of-type', '250'); // €2.50 discount

        // Submit template creation
        await page.click('button:has-text("Create this template")');
        await expect(page.locator('text=Class template created successfully')).toBeVisible();

        // Step 6: Verify template was created
        await expect(page.locator('text=gefatest01 Morning Hatha Yoga').first()).toBeVisible();

        // Step 7: Navigate to calendar and create a standalone class instance
        await page.click('text=Schedule');

        // Open new class dialog and select date & time for tomorrow
        await page.click('button:has-text("New Class")');
        await page.getByRole('button', { name: 'Select date and time' }).click();

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowStr = `${year}-${month}-${day}`;

        await page.click(`[data-day="${tomorrowStr}"]`);
        await page.keyboard.press('Escape');

        // Select the template we created
        await page.getByLabel('Class Template').click();
        await page.getByRole('option', { name: 'gefatest01 Morning Hatha Yoga' }).first().click();

        // Create single instance
        await page.click('button:has-text("Schedule Class")');
        await expect(page.locator('text=gefatest01 Morning Hatha Yoga scheduled successfully')).toBeVisible();

        // Step 8: Create a recurring instance (weekly for 3 weeks)
        // Open new class dialog and select date & time for next week
        await page.click('button:has-text("New Class")');
        await page.getByRole('button', { name: 'Select date and time' }).click();

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 8);

        const nextWeekYear = nextWeek.getFullYear();
        const nextWeekMonth = String(nextWeek.getMonth() + 1).padStart(2, '0');
        const nextWeekDay = String(nextWeek.getDate()).padStart(2, '0');
        const nextWeekStr = `${nextWeekYear}-${nextWeekMonth}-${nextWeekDay}`;

        await page.click(`[data-day="${nextWeekStr}"]`);
        await page.keyboard.press('Escape');

        // Select the template we created
        await page.getByLabel('Class Template').click();
        await page.getByRole('option', { name: 'gefatest01 Morning Hatha Yoga' }).first().click();

        // Enable recurring
        await page.check('label:has-text("Make this recurring")');

        // Set weekly frequency and 3 weeks
        await page.click('label:has-text("Frequency")');
        await page.getByRole('option', { name: 'Weekly' }).click();

        // Find the dropdown that's currently open/visible
        await page.click('label:has-text("Duration")');
        await page.getByRole('option', { name: '7 weeks' }).click();

        // Create recurring instances
        await page.click('button:has-text("Schedule Series")');
        await expect(page.locator('text=Created 7 instances of gefatest01 Morning Hatha Yoga').or(page.locator('text=3 instances created'))).toBeVisible();

        // Step 9: Verify the instances appear on the calendar
        await expect(page.locator('text=gefatest01 Morning Hatha Yoga').first()).toBeVisible();
    });
});