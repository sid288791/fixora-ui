import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8083/api';

const mockApplication = {
  id: 1,
  name: 'Test App',
  alias: 'test-app',
  ownerEmail: 'owner@test.com',
  adGroupMapping: 'dev-team',
  description: 'A test application',
  status: 'ACTIVE',
};

const mockAlert = {
  id: 100,
  applicationId: 1,
  owningAdGrp: 'dev-team',
  name: 'High CPU Alert',
  description: 'Triggers when CPU exceeds 90%',
  alertType: 'METRIC',
  severity: 'HIGH',
  conditionExpression: 'cpu_usage > 90',
  environment: 'production',
  source: 'prometheus',
  channels: 'SLACK,TEAMS',
  goalertServiceUrl: '',
  teamsWebhookUrl: '',
  triggerAiInvestigation: false,
  enabled: true,
  status: 'ENABLED',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test('create one alert end to end', async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => localStorage.clear());

  // Mock the external Fixora API
  await page.route(`${API_BASE}/applications/1`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockApplication),
    });
  });

  let createdAlerts: typeof mockAlert[] = [];
  await page.route(
    `${API_BASE}/applications/1/alert-configurations`,
    async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createdAlerts),
        });
      } else if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const newAlert = { ...mockAlert, ...body, id: 100 };
        createdAlerts = [newAlert];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newAlert),
        });
      }
    },
  );

  // Step 1: Navigate to the alert config page
  await page.goto('/alerts/1');

  // Wait for the AD group gate
  await expect(
    page.getByText('Verify AD Group Membership'),
  ).toBeVisible();

  // Step 2: Enter AD group and continue
  await page.getByLabel('Your AD Group').fill('dev-team');
  await page.getByRole('button', { name: 'Continue' }).click();

  // Wait for the alert management page
  await expect(
    page.getByRole('heading', { name: /Alert & Notifications - Test App/ }),
  ).toBeVisible();

  // Step 3: Go to "Create New Alert" tab
  await page.getByRole('tab', { name: 'Create New Alert' }).click();

  await expect(
    page.getByRole('heading', { name: 'Create New Alert' }),
  ).toBeVisible();

  // Step 4: Fill in the alert form
  await page.getByLabel('Alert Name').fill('High CPU Alert');
  await page.getByLabel('Owning AD Group').fill('dev-team');
  await page.getByLabel('Source').fill('prometheus');
  await page.getByLabel('Condition Expression').fill('cpu_usage > 90');
  await page.getByLabel('Description').fill('Triggers when CPU exceeds 90%');

  // Select notification channels
  await page.getByRole('button', { name: 'SLACK' }).click();
  await page.getByRole('button', { name: 'TEAMS' }).click();

  // Step 5: Submit the form
  await page.getByRole('button', { name: 'Create Alert' }).click();

  // Step 6: Verify success
  await expect(
    page.getByText('Alert configuration saved successfully!'),
  ).toBeVisible();

  // Should switch back to Alert List tab
  await expect(page.getByRole('tab', { name: 'Alert List' })).toHaveAttribute(
    'aria-selected',
    'true',
  );

  // The created alert should appear in the table
  await expect(page.getByText('High CPU Alert')).toBeVisible();
  await expect(page.getByText('cpu_usage > 90')).toBeVisible();
});
