import { Page } from '@playwright/test';

export const TEST_USERS = {
    userWithoutBusiness: {
        email: 'user_without_business@test.com',
        password: 'user_without_business',
    },
    userWithBusiness: {
        email: 'user_with_business@test.com',
        password: 'user_with_business',
    },
};

export async function loginUser(page: Page, userType: keyof typeof TEST_USERS) {
    const user = TEST_USERS[userType];

    // Navigate to login page
    await page.goto('http://localhost:5173/sign-in-tester');

    // Fill in credentials
    await page.fill('[name="email"]', user.email);
    await page.fill('[name="password"]', user.password);

    // Submit form
    await page.click('[type="submit"]');

    // Wait for navigation to complete
    //  await page.waitForURL(url => !url.toString().includes('/sign-in-tester'));
    // await for the "Test Authentication" h1 text not to be in the dom
    await page.waitForSelector('h1:has-text("Test Authentication")', { state: 'hidden' });
}