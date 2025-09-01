import { test, expect } from '@playwright/test';
import { loginUser } from './helpers';

test.describe('Venue, Template & Calendar Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Clear storage and cookies
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });
        await page.context().clearCookies();
    });

    test('complete flow: create venue → template → class instances', async ({ page }) => {
        // Step 1: Login as user with business
        await loginUser(page, 'userWithBusiness');
        await expect(page).toHaveURL('/dashboard');

        // Step 2: Navigate to venues section through Settings
        await page.click('text=UserWithB'); // Click on user dropdown in sidenav
        await page.click('text=Settings'); // Click on Settings in dropdown
        await page.click('text=Venues'); // Click on Venues tab in settings
        await page.click('div:has-text("Add another venue")');

        // Fill venue form
        await page.fill('[name="name"]', 'Test Yoga Studio');
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
        await expect(page.locator('text=Test Yoga Studio')).toBeVisible();

        // Step 4: Navigate to templates and create a new template
        await page.click('text=Templates');
        await page.click('button:has-text("Create Template")');

        // Fill template form
        await page.fill('[name="name"]', 'Morning Hatha Yoga');
        await page.fill('[name="instructor"]', 'Maria Kalogirou');
        await page.fill('[name="description"]', 'A gentle morning flow suitable for all levels');

        // Select the venue we just created
        await page.selectOption('select[name="venueId"]', { label: 'Test Yoga Studio' });

        // Set duration, capacity, and price
        await page.selectOption('select[name="duration"]', '60');
        await page.fill('[name="capacity"]', '20');
        await page.fill('[name="price"]', '2500'); // €25.00 in cents

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
        await page.click('button:has-text("Add Discount Rule")');

        // First discount rule - Early bird discount
        await page.fill('input[placeholder="Rule name"]', 'Early Bird Special');
        await page.selectOption('select[name*="condition.type"]', 'hours_before_min');
        await page.fill('input[name*="condition.hours"]', '48');
        await page.fill('input[name*="discount.value"]', '500'); // €5.00 discount

        // Add second discount rule
        await page.click('button:has-text("Add Discount Rule")');
        await page.fill('input[placeholder="Rule name"]:last-of-type', 'Last Minute Deal');
        await page.selectOption('select[name*="condition.type"]:last-of-type', 'hours_before_max');
        await page.fill('input[name*="condition.hours"]:last-of-type', '4');
        await page.fill('input[name*="discount.value"]:last-of-type', '250'); // €2.50 discount

        // Submit template creation
        await page.click('button:has-text("Create Template")');
        await expect(page.locator('text=Class template created successfully')).toBeVisible();

        // Step 6: Verify template was created
        await expect(page.locator('text=Morning Hatha Yoga')).toBeVisible();

        // Step 7: Navigate to calendar and create a standalone class instance
        await page.click('text=Calendar');

        // Click on a calendar cell (tomorrow at 9:00 AM)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDateStr = tomorrow.getDate().toString();

        await page.click(`[data-date*="${tomorrowDateStr}"][data-hour="09:00"]`);

        // Select the template we created
        await page.selectOption('select[name="templateId"]', { label: 'Morning Hatha Yoga' });

        // Create single instance
        await page.click('button:has-text("Create Instance")');
        await expect(page.locator('text=Class instance created successfully')).toBeVisible();

        // Step 8: Create a recurring instance (weekly for 3 weeks)
        // Click on another calendar cell (next week same time)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 8);
        const nextWeekDateStr = nextWeek.getDate().toString();

        await page.click(`[data-date*="${nextWeekDateStr}"][data-hour="10:00"]`);

        // Select the template again
        await page.selectOption('select[name="templateId"]', { label: 'Morning Hatha Yoga' });

        // Enable recurring
        await page.check('input[name="isRecurring"]');

        // Set weekly frequency and 3 weeks
        await page.selectOption('select[name="frequency"]', 'weekly');
        await page.fill('input[name="weeks"]', '3');

        // Create recurring instances
        await page.click('button:has-text("Create Instances")');
        await expect(page.locator('text=Class instances created successfully').or(page.locator('text=3 instances created'))).toBeVisible();

        // Step 9: Verify the instances appear on the calendar
        await expect(page.locator('text=Morning Hatha Yoga').first()).toBeVisible();

        // Count the instances (should be 4 total: 1 standalone + 3 recurring)
        const instanceElements = await page.locator('text=Morning Hatha Yoga').count();
        expect(instanceElements).toBeGreaterThanOrEqual(3); // At least 3 visible instances

        // Verify venue and template are properly linked
        await page.click('text=Morning Hatha Yoga', { position: { x: 10, y: 10 } });
        await expect(page.locator('text=Test Yoga Studio')).toBeVisible();
        await expect(page.locator('text=Maria Kalogirou')).toBeVisible();
    });
});