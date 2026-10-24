import type { DashboardSummary, ProjectDto } from '@devtrack/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import { App } from '../../app/App';

const project: ProjectDto = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Portfolio',
  description: null,
  createdAt: '2026-10-24T00:00:00.000Z',
  updatedAt: '2026-10-24T00:00:00.000Z',
  taskCount: 4,
  completedTaskCount: 1,
  progress: 25,
};
const populated: DashboardSummary = {
  activeProjectCount: 2,
  openTaskCount: 3,
  completedTaskCount: 1,
  tasksByStatus: { TODO: 2, IN_PROGRESS: 1, DONE: 1 },
  recentProjects: [project],
};
const empty: DashboardSummary = {
  activeProjectCount: 0,
  openTaskCount: 0,
  completedTaskCount: 0,
  tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
  recentProjects: [],
};

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(['auth', 'me'], {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'User',
    email: 'user@example.com',
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), client };
}

it('shows dashboard loading and then real metrics, status counts and recent project progress', async () => {
  let resolve: (response: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    ),
  );
  setup();
  expect(screen.getByRole('status').textContent).toBe('Loading dashboard…');
  resolve(Response.json({ data: populated }));
  const metrics = await screen.findByRole('region', {
    name: 'Dashboard metrics',
  });
  expect(
    within(metrics).getByText('Active projects').parentElement?.textContent,
  ).toContain('2');
  expect(
    within(metrics).getByText('Open tasks').parentElement?.textContent,
  ).toContain('3');
  expect(
    within(metrics).getByText('Completed tasks').parentElement?.textContent,
  ).toContain('1');
  expect(screen.getByRole('progressbar').getAttribute('value')).toBe('25');
  expect(
    screen.getByRole('link', { name: 'Portfolio' }).getAttribute('href'),
  ).toBe(`/projects/${project.id}`);
  expect(
    within(screen.getByRole('region', { name: 'Task status' })).getByText(
      'In progress',
    ),
  ).toBeDefined();
});

it('offers a useful first project action when the account is empty', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(Response.json({ data: empty }))),
  );
  setup();
  const link = await screen.findByRole('link', {
    name: 'Create your first project',
  });
  expect(link.getAttribute('href')).toBe('/projects/new');
  expect(screen.getAllByText('0').length).toBe(3);
});

it('handles failure and recovers using the retry action', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(Response.json({ data: populated })),
  );
  const { user } = setup();
  const error = await screen.findByRole('alert');
  expect(error.textContent).toContain('Could not load your dashboard');
  await user.click(within(error).getByRole('button', { name: 'Try again' }));
  await screen.findByRole('region', { name: 'Dashboard metrics' });
});

it('refreshes the cached dashboard after a task status mutation', async () => {
  let completed = false;
  const task = {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    projectId: project.id,
    title: 'Complete portfolio',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'PATCH') {
        completed = true;
        return Promise.resolve(
          Response.json({ data: { ...task, status: 'DONE' } }),
        );
      }
      if (url.endsWith('/dashboard/summary'))
        return Promise.resolve(
          Response.json({
            data: {
              ...populated,
              openTaskCount: completed ? 2 : 3,
              completedTaskCount: completed ? 2 : 1,
            },
          }),
        );
      if (url.includes('/tasks?'))
        return Promise.resolve(
          Response.json({
            data: [{ ...task, status: completed ? 'DONE' : 'TODO' }],
          }),
        );
      return Promise.resolve(Response.json({ data: project }));
    }),
  );
  const { user, client } = setup();
  await user.click(await screen.findByRole('link', { name: 'Portfolio' }));
  await user.selectOptions(
    await screen.findByLabelText('Status for Complete portfolio'),
    'DONE',
  );
  await waitFor(() =>
    expect(client.getQueryState(['dashboard'])?.isInvalidated).toBe(true),
  );
  await user.click(screen.getByRole('link', { name: 'Dashboard' }));
  const metrics = await screen.findByRole('region', {
    name: 'Dashboard metrics',
  });
  await waitFor(() =>
    expect(
      within(metrics).getByText('Completed tasks').parentElement?.textContent,
    ).toContain('2'),
  );
});

it('refreshes recent projects and counts after project creation', async () => {
  let created = false;
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        created = true;
        return Promise.resolve(
          Response.json({ data: project }, { status: 201 }),
        );
      }
      if (url.endsWith('/dashboard/summary'))
        return Promise.resolve(
          Response.json({
            data: created
              ? { ...empty, activeProjectCount: 1, recentProjects: [project] }
              : empty,
          }),
        );
      if (url.includes('/tasks?'))
        return Promise.resolve(Response.json({ data: [] }));
      return Promise.resolve(Response.json({ data: project }));
    }),
  );
  const { user } = setup();
  await user.click(
    await screen.findByRole('link', { name: 'Create your first project' }),
  );
  await user.type(screen.getByLabelText(/Project name/), 'Portfolio');
  await user.click(screen.getByRole('button', { name: 'Create project' }));
  await screen.findByRole('heading', { name: 'Portfolio' });
  await user.click(screen.getByRole('link', { name: 'Dashboard' }));
  await screen.findByRole('link', { name: 'Portfolio' });
});
