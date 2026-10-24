import {
  createTaskSchema,
  taskSchema,
  updateTaskSchema,
} from '@devtrack/shared';
import type { TaskDto } from '@devtrack/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import { App } from '../../app/App';

const projectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const fixture: TaskDto = {
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  projectId,
  title: 'Learn task flow',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: null,
  createdAt: '2026-10-24T00:00:00.000Z',
  updatedAt: '2026-10-24T00:00:00.000Z',
};
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(['auth', 'me'], {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'Task user',
    email: 'tasks@example.com',
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/projects/${projectId}`]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}
function projectResponse(tasks: TaskDto[]) {
  return Response.json({
    data: {
      id: projectId,
      name: 'Task project',
      description: null,
      createdAt: fixture.createdAt,
      updatedAt: fixture.updatedAt,
      taskCount: tasks.length,
      completedTaskCount: tasks.filter((task) => task.status === 'DONE').length,
      progress:
        tasks.length && tasks.every((task) => task.status === 'DONE') ? 100 : 0,
    },
  });
}

it('blocks duplicate creation and preserves/focuses input after server validation fails', async () => {
  let respond: (response: Response) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST')
        return new Promise<Response>((resolve) => {
          respond = resolve;
        });
      return Promise.resolve(
        url.includes('/tasks?')
          ? Response.json({ data: [] })
          : projectResponse([]),
      );
    }),
  );
  const user = setup();
  await user.click(
    await screen.findByRole('button', { name: 'Create your first task' }),
  );
  await user.type(screen.getByLabelText('Title (required)'), 'Keep my input');
  await user.click(screen.getByRole('button', { name: 'Create task' }));
  for (const name of ['Saving task…', 'New task', 'Create your first task']) {
    const button = screen.getByRole('button', { name });
    expect(button instanceof HTMLButtonElement && button.disabled).toBe(true);
  }
  respond(
    Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Review your task.',
          details: { title: 'Server rejected this title.' },
        },
      },
      { status: 400 },
    ),
  );
  await screen.findByText('Server rejected this title.');
  const title = screen.getByLabelText('Title (required)');
  expect(title instanceof HTMLInputElement && title.value).toBe(
    'Keep my input',
  );
  expect(document.activeElement).toBe(title);
});

it('creates, moves, edits and deletes tasks while refreshing project progress', async () => {
  let tasks: TaskDto[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      const body: unknown =
        typeof options?.body === 'string' ? JSON.parse(options.body) : {};
      if (options?.method === 'POST') {
        const task = taskSchema.parse({
          ...fixture,
          ...createTaskSchema.parse(body),
        });
        tasks = [task];
        return Promise.resolve(Response.json({ data: task }, { status: 201 }));
      }
      if (options?.method === 'PATCH') {
        const task = taskSchema.parse({
          ...tasks[0],
          ...updateTaskSchema.parse(body),
        });
        tasks = [task];
        return Promise.resolve(Response.json({ data: task }));
      }
      if (options?.method === 'DELETE') {
        tasks = [];
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(
        url.includes('/tasks?')
          ? Response.json({ data: tasks })
          : projectResponse(tasks),
      );
    }),
  );
  const user = setup();
  await screen.findByRole('heading', { name: 'No tasks yet' });
  await user.click(screen.getByRole('button', { name: 'New task' }));
  await user.click(screen.getByRole('button', { name: 'Create task' }));
  await screen.findByText('Task title is required.');
  await user.type(screen.getByLabelText('Title (required)'), fixture.title);
  await user.selectOptions(screen.getByLabelText('Priority'), 'HIGH');
  await user.type(screen.getByLabelText('Due date (optional)'), '2026-10-30');
  await user.click(screen.getByRole('button', { name: 'Create task' }));
  await screen.findByRole('heading', { name: fixture.title });
  expect(tasks[0]).toMatchObject({
    priority: 'HIGH',
    dueDate: '2026-10-30T00:00:00.000Z',
  });
  await user.selectOptions(
    screen.getByLabelText(`Status for ${fixture.title}`),
    'DONE',
  );
  await waitFor(() =>
    expect(screen.getByRole('progressbar').getAttribute('value')).toBe('100'),
  );
  await user.click(screen.getByRole('button', { name: 'Edit task' }));
  await user.clear(screen.getByLabelText('Title (required)'));
  await user.type(screen.getByLabelText('Title (required)'), 'Edited task');
  await user.clear(screen.getByLabelText('Due date (optional)'));
  await user.click(screen.getByRole('button', { name: 'Save task' }));
  await screen.findByRole('heading', { name: 'Edited task' });
  expect(tasks[0]?.dueDate).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Delete task' }));
  expect(tasks).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Keep task' }));
  expect(tasks).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Delete task' }));
  await user.click(screen.getByRole('button', { name: 'Confirm delete task' }));
  await screen.findByRole('heading', { name: 'No tasks yet' });
  expect(tasks).toHaveLength(0);
  expect(screen.getByRole('progressbar').getAttribute('value')).toBe('0');
});

it('sends search, status and priority filters to the API and handles no matches', async () => {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve(
      url.includes('/tasks?')
        ? Response.json({ data: url.includes('q=missing') ? [] : [fixture] })
        : projectResponse([fixture]),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  const user = setup();
  await screen.findByRole('heading', { name: fixture.title });
  await user.selectOptions(screen.getByLabelText('Filter by status'), 'TODO');
  await user.selectOptions(screen.getByLabelText('Filter by priority'), 'HIGH');
  await user.type(screen.getByLabelText('Search tasks'), 'missing');
  await user.click(screen.getByRole('button', { name: 'Search' }));
  await screen.findByRole('heading', { name: 'No tasks match these filters' });
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/v1/projects/${projectId}/tasks?status=TODO&priority=HIGH&q=missing`,
    expect.anything(),
  );
  await user.click(screen.getByRole('button', { name: 'Clear filters' }));
  await screen.findByRole('heading', { name: fixture.title });
});

it('shows task loading errors and retains the form after a failed save', async () => {
  let failedLoad = true;
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST')
        return Promise.resolve(
          Response.json(
            {
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Task could not be saved.',
              },
            },
            { status: 500 },
          ),
        );
      if (url.includes('/tasks?'))
        return Promise.resolve(
          failedLoad
            ? Response.json(
                {
                  error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Task load failed.',
                  },
                },
                { status: 500 },
              )
            : Response.json({ data: [] }),
        );
      return Promise.resolve(projectResponse([]));
    }),
  );
  const user = setup();
  const error = await screen.findByRole('alert');
  expect(error.textContent).toContain('Task load failed.');
  failedLoad = false;
  await user.click(within(error).getByRole('button', { name: 'Try again' }));
  await screen.findByRole('heading', { name: 'No tasks yet' });
  await user.click(screen.getByRole('button', { name: 'New task' }));
  await user.type(screen.getByLabelText('Title (required)'), 'Keep this draft');
  await user.click(screen.getByRole('button', { name: 'Create task' }));
  await screen.findByText('Task could not be saved.');
  const input = screen.getByLabelText('Title (required)');
  expect(input instanceof HTMLInputElement && input.value).toBe(
    'Keep this draft',
  );
});
