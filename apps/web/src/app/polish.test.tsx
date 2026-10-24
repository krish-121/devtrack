import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router';
import { expect, it, vi } from 'vitest';
import { App } from './App';

const project = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Polish project',
  description: null,
  createdAt: '2026-10-24T00:00:00.000Z',
  updatedAt: '2026-10-24T00:00:00.000Z',
  taskCount: 0,
  completedTaskCount: 0,
  progress: 0,
};
function HistoryButtons() {
  const navigate = useNavigate();
  return (
    <>
      <button
        onClick={() => {
          void navigate(-1);
        }}
      >
        Browser back
      </button>
      <button
        onClick={() => {
          void navigate(1);
        }}
      >
        Browser forward
      </button>
    </>
  );
}
function setup(path: string, history = false) {
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
      <MemoryRouter initialEntries={[path]}>
        <App />
        {history && <HistoryButtons />}
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

it('shows a recovery link for a missing project instead of a pointless retry', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        Response.json(
          {
            error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' },
          },
          { status: 404 },
        ),
      ),
    ),
  );
  setup(`/projects/${project.id}`);
  await screen.findByRole('heading', { name: 'This project is unavailable' });
  expect(
    screen.getByRole('link', { name: 'Back to projects' }).getAttribute('href'),
  ).toBe('/projects');
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
});

it('focuses the first invalid project field for client and server validation', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        Response.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Check your project details.',
              details: { name: 'Name was rejected by the server.' },
            },
          },
          { status: 400 },
        ),
      ),
    ),
  );
  const user = setup('/projects/new');
  await user.click(screen.getByRole('button', { name: 'Create project' }));
  expect(document.activeElement).toBe(screen.getByLabelText(/Project name/));
  expect(
    screen.getByLabelText(/Project name/).getAttribute('aria-describedby'),
  ).toBe('name-error');
  await user.type(screen.getByLabelText(/Project name/), 'A project');
  await user.click(screen.getByRole('button', { name: 'Create project' }));
  await screen.findByText('Name was rejected by the server.');
  expect(document.activeElement).toBe(screen.getByLabelText(/Project name/));
});

it('focuses the safe confirmation action and restores focus after cancel', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        Response.json({ data: url.includes('/tasks?') ? [] : project }),
      ),
    ),
  );
  const user = setup(`/projects/${project.id}`);
  await user.click(
    await screen.findByRole('button', { name: 'Delete project' }),
  );
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Keep project' }),
  );
  await user.click(screen.getByRole('button', { name: 'Keep project' }));
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Delete project' }),
  );
});

it('returns focus to New task after cancelling or saving the task form', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) =>
      Promise.resolve(
        Response.json({
          data:
            options?.method === 'POST'
              ? {
                  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
                  projectId: project.id,
                  title: 'Keyboard task',
                  description: null,
                  status: 'TODO',
                  priority: 'MEDIUM',
                  dueDate: null,
                  createdAt: project.createdAt,
                  updatedAt: project.updatedAt,
                }
              : url.includes('/tasks?')
                ? []
                : project,
        }),
      ),
    ),
  );
  const user = setup(`/projects/${project.id}`);
  const newTask = await screen.findByRole('button', { name: 'New task' });
  await user.click(newTask);
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(document.activeElement).toBe(newTask);
  await user.click(newTask);
  await user.type(screen.getByLabelText(/Title/), 'Keyboard task');
  await user.click(screen.getByRole('button', { name: 'Create task' }));
  await waitFor(() => expect(document.activeElement).toBe(newTask));
  expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
});

it('keeps task search synchronized with browser back/forward navigation', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        Response.json({ data: url.includes('/tasks?') ? [] : project }),
      ),
    ),
  );
  const user = setup(`/projects/${project.id}`, true);
  await user.type(await screen.findByLabelText('Search tasks'), 'harness');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  const input = await screen.findByLabelText('Search tasks');
  expect(input instanceof HTMLInputElement && input.value).toBe('harness');
  await user.click(screen.getByRole('button', { name: 'Browser back' }));
  await waitFor(() => {
    const field = screen.getByLabelText('Search tasks');
    expect(field instanceof HTMLInputElement && field.value).toBe('');
  });
  await user.click(screen.getByRole('button', { name: 'Browser forward' }));
  await waitFor(() => {
    const field = screen.getByLabelText('Search tasks');
    expect(field instanceof HTMLInputElement && field.value).toBe('harness');
  });
});

it('shows and disables task deletion while the request is pending', async () => {
  const task = {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    projectId: project.id,
    title: 'Pending delete',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) =>
      options?.method === 'DELETE'
        ? new Promise<Response>(() => {})
        : Promise.resolve(
            Response.json({ data: url.includes('/tasks?') ? [task] : project }),
          ),
    ),
  );
  const user = setup(`/projects/${project.id}`);
  await user.click(await screen.findByRole('button', { name: 'Delete task' }));
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Keep task' }),
  );
  await user.click(screen.getByRole('button', { name: 'Confirm delete task' }));
  const pending = await screen.findByRole('button', { name: 'Deleting task…' });
  expect(pending instanceof HTMLButtonElement && pending.disabled).toBe(true);
});
