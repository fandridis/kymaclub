import { test as setup } from '@playwright/test';

// Optional: Create test users before running tests
setup('create test users', async ({ request }) => {
    // If you have an API endpoint to create test users
    // await request.post('/api/seed-test-users');

    console.log('[auth.setup] process.env.CONVEX_URL: ', process.env.VITE_CONVEX_URL);

    // Or use Convex HTTP endpoint
    await request.post(`${process.env.CONVEX_URL}/createTestUser`, {
        data: {
            email: 'admin@test.com',
            password: 'test123',
            name: 'Test Admin',
            role: 'admin',
            hasBusinessOnboarded: true,
            emailVerificationTime: Date.now(),
        }
    });
});
