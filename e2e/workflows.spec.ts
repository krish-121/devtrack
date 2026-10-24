import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { projectResponseSchema, userResponseSchema } from '@devtrack/shared';
import { prisma } from '../apps/api/src/database/prisma.js';
import { e2eEnvironment } from './environment.js';

// Refuse developer/production databases even if Playwright is invoked directly.
if (
  process.env.DATABASE_URL !== e2eEnvironment.DATABASE_URL ||
  process.env.NODE_ENV !== 'test'
)
  throw new Error(
    'Use npm run test:e2e or test:docker with the disposable E2E database.',
  );

const password = 'Public E2E test passphrase 24!';
let email = '';
test.beforeEach(() => {
  email = `e2e-${randomUUID()}@devtrack.example.test`;
});
test.afterEach(async () => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (user)
    await prisma.$transaction([
      prisma.project.deleteMany({ where: { ownerId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
});
test.afterAll(async () => {
  await prisma.$disconnect();
});

test('register → project → task → done → dashboard completion', async ({
  page,
}, testInfo) => {
  await page.goto('/register');
  await page.getByLabel('Name', { exact: true }).fill('E2E developer');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('link', { name: 'Create your first project' }).click();
  await page.getByLabel('Project name (required)').fill('Release checklist');
  await page
    .getByRole('button', { name: 'Create project', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Release checklist', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByLabel('Title (required)').fill('Ship first slice');
  await page.getByRole('button', { name: 'Create task', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Ship first slice', exact: true }),
  ).toBeVisible();
  await page
    .getByLabel('Status for Ship first slice', { exact: true })
    .selectOption('DONE');
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '100');
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  const metrics = page.getByRole('region', { name: 'Dashboard metrics' });
  await expect(
    metrics.getByText('Completed tasks').locator('..'),
  ).toContainText('1');
  await expect(metrics.getByText('Open tasks').locator('..')).toContainText(
    '0',
  );
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '100');
  await page.reload();
  await expect(page.getByRole('progressbar')).toHaveAttribute('value', '100');
  await page.screenshot({
    path: testInfo.outputPath('dashboard-verified.png'),
    fullPage: true,
  });
});

test('login → open project → search → edit task → logout', async ({
  page,
  request,
}) => {
  const registered = await request.post('/api/v1/auth/register', {
    data: { name: 'E2E returning user', email, password },
  });
  expect(registered.status()).toBe(201);
  userResponseSchema.parse(await registered.json());
  const created = await request.post('/api/v1/projects', {
    data: { name: 'Search workflow' },
  });
  expect(created.status()).toBe(201);
  const project = projectResponseSchema.parse(await created.json()).data;
  for (const title of ['Review Harness logs', 'Write README']) {
    const task = await request.post(`/api/v1/projects/${project.id}/tasks`, {
      data: { title },
    });
    expect(task.status()).toBe(201);
  }
  await request.post('/api/v1/auth/logout', { data: {} });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await page
    .getByRole('link', { name: 'Search workflow', exact: true })
    .click();
  await page.getByLabel('Search tasks', { exact: true }).fill('Harness');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Review Harness logs', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Write README', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit task', exact: true }).click();
  await page
    .getByLabel('Title (required)')
    .fill('Review Harness logs carefully');
  await page.getByRole('button', { name: 'Save task', exact: true }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Review Harness logs carefully',
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', {
      name: 'Review Harness logs carefully',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto(`/projects/${project.id}`);
  await expect(page).toHaveURL(/\/login$/);
});
