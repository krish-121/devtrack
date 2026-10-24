import type { ProjectDto } from '@devtrack/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

const fixture: ProjectDto = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Learning project',
  description: 'Build a vertical slice',
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
  taskCount: 3,
  completedTaskCount: 1,
  progress: 33,
};

function renderApp(path = '/projects') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(['auth', 'me'], {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'Test user',
    email: 'test@example.com',
  });
  const originalFetch = globalThis.fetch;
  vi.stubGlobal('fetch', (url: string, options?: RequestInit) =>
    url.includes('/tasks')
      ? Promise.resolve(Response.json({ data: [] }))
      : originalFetch(url, options),
  );
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

describe('project user workflows', () => {
  it('creates, edits, refreshes the list and deletes only after confirmation', async () => {
    let stored: ProjectDto | undefined;
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        stored = {
          ...fixture,
          taskCount: 0,
          completedTaskCount: 0,
          progress: 0,
        };
        return Promise.resolve(
          Response.json({ data: stored }, { status: 201 }),
        );
      }
      if (options?.method === 'PATCH') {
        stored = {
          ...fixture,
          name: 'Updated project',
          taskCount: 0,
          completedTaskCount: 0,
          progress: 0,
        };
        return Promise.resolve(Response.json({ data: stored }));
      }
      if (options?.method === 'DELETE') {
        stored = undefined;
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(
        Response.json({
          data: url === '/api/v1/projects' ? (stored ? [stored] : []) : stored,
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = renderApp();
    await user.click(
      await screen.findByRole('link', { name: 'Create your first project' }),
    );
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    expect(screen.getByRole('alert').textContent).toBe(
      'Project name is required.',
    );
    expect(
      fetchMock.mock.calls.some(([, options]) => options?.method === 'POST'),
    ).toBe(false);
    await user.type(
      screen.getByLabelText(/Project name/),
      '  Learning project  ',
    );
    await user.type(
      screen.getByLabelText(/Description/),
      'Build a vertical slice',
    );
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    expect(
      (await screen.findByRole('heading', { name: 'Learning project' }))
        .textContent,
    ).toBe('Learning project');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Learning project',
          description: 'Build a vertical slice',
        }),
        credentials: 'include',
      }),
    );
    await user.click(screen.getByRole('link', { name: 'Edit project' }));
    await user.clear(await screen.findByLabelText(/Project name/));
    await user.type(screen.getByLabelText(/Project name/), 'Updated project');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await screen.findByRole('heading', { name: 'Updated project' });
    await user.click(screen.getByRole('link', { name: /All projects/ }));
    await user.click(
      await screen.findByRole('link', { name: 'Updated project' }),
    );
    await user.click(
      await screen.findByRole('button', { name: 'Delete project' }),
    );
    expect(
      fetchMock.mock.calls.some(([, options]) => options?.method === 'DELETE'),
    ).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Keep project' }));
    expect(
      fetchMock.mock.calls.some(([, options]) => options?.method === 'DELETE'),
    ).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));
    await user.click(
      screen.getByRole('button', { name: 'Permanently delete project' }),
    );
    await screen.findByRole('heading', { name: 'Your next idea starts here' });
    expect(stored).toBeUndefined();
  });

  it('shows loading, real task progress, and project dates', async () => {
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
    renderApp();
    expect(screen.getByRole('status').textContent).toBe('Loading projects…');
    resolve(Response.json({ data: [fixture] }));
    await screen.findByRole('link', { name: fixture.name });
    expect(screen.getByRole('progressbar').getAttribute('value')).toBe('33');
    expect(screen.getByText('1 of 3 tasks complete')).toBeDefined();
  });

  it('shows a load error and recovers when retried', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('offline'))
        .mockResolvedValueOnce(Response.json({ data: [] })),
    );
    const user = renderApp();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Cannot reach DevTrack',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findByRole('heading', { name: 'Your next idea starts here' });
  });

  it('keeps form input when the server rejects a save', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Check your project.',
              details: { name: 'Name rejected by server.' },
            },
          },
          { status: 400 },
        ),
      ),
    );
    const user = renderApp('/projects/new');
    await user.type(screen.getByLabelText(/Project name/), 'My project');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    await screen.findByText('Name rejected by server.');
    const input = screen.getByLabelText(/Project name/);
    expect(input instanceof HTMLInputElement && input.value).toBe('My project');
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('disables submission while a save is pending', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {})),
    );
    const user = renderApp('/projects/new');
    await user.type(screen.getByLabelText(/Project name/), 'My project');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    await waitFor(() => {
      const button = screen.getByRole('button', { name: 'Saving…' });
      expect(button instanceof HTMLButtonElement && button.disabled).toBe(true);
    });
  });

  it('retains the project and shows a failed deletion', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options?: RequestInit) =>
        Promise.resolve(
          options?.method === 'DELETE'
            ? Response.json(
                {
                  error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Unable to delete.',
                  },
                },
                { status: 500 },
              )
            : Response.json({ data: fixture }),
        ),
      ),
    );
    const user = renderApp(`/projects/${fixture.id}`);
    await user.click(
      await screen.findByRole('button', { name: 'Delete project' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Permanently delete project' }),
    );
    expect((await screen.findByRole('alert')).textContent).toBe(
      'Unable to delete.',
    );
    expect(screen.getByRole('heading', { name: fixture.name })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Keep project' })).toBeDefined();
  });
});
