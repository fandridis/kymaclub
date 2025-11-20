/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
    // Look for test files in the "tests" directory, relative to this configuration file.
    testDir: 'tests',

    // Timeout for tests ~ 1 minute
    timeout: 60000,

    // Run all tests in parallel.
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,

    // Retry on CI only.
    retries: process.env.CI ? 2 : 0,

    // Opt out of parallel tests on CI.
    workers: process.env.CI ? 1 : undefined,

    // Reporter to use
    reporter: 'html',
    use: {
        // Base URL to use in actions like `await page.goto('/')`.
        baseURL: 'http://localhost:5173',

        // Collect trace when retrying the failed test.
        trace: 'on-first-retry',

        launchOptions: {
            // Slow down the tester actions by 100ms
            slowMo: 100,
        },
        actionTimeout: 20000,
        navigationTimeout: 45000,
    },
    // Configure projects for major browsers.
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
    // Run your local dev server before starting the tests.
    webServer: {
        command: 'pnpm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI
    },
});