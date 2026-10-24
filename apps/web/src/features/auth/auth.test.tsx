import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import { App } from '../../app/App';

const userDto = {
  id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  name: 'New User',
  email: 'new@example.com',
};
const unauthorized = () =>
  Response.json(
    { error: { code: 'UNAUTHORIZED', message: 'Please log in.' } },
    { status: 401 },
  );
function setup(
  path = '/login',
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  }),
) {
  const originalFetch = globalThis.fetch;
  vi.stubGlobal('fetch', (url: string, options?: RequestInit) =>
    url.endsWith('/dashboard/summary')
      ? Promise.resolve(
          Response.json({
            data: {
              activeProjectCount: 0,
              openTaskCount: 0,
              completedTaskCount: 0,
              tasksByStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
              recentProjects: [],
            },
          }),
        )
      : originalFetch(url, options),
  );
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), client };
}

it('redirects a protected route to login and preserves typed input after invalid credentials', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        url === '/api/v1/auth/me'
          ? unauthorized()
          : Response.json(
              {
                error: {
                  code: 'INVALID_CREDENTIALS',
                  message: 'Email or password is incorrect.',
                },
              },
              { status: 401 },
            ),
      ),
    ),
  );
  const { user } = setup('/projects');
  await user.type(await screen.findByLabelText('Email'), 'new@example.com');
  await user.type(screen.getByLabelText('Password'), 'wrong passphrase');
  await user.click(screen.getByRole('button', { name: 'Log in' }));
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Email or password is incorrect.',
  );
  const email = screen.getByLabelText('Email');
  expect(email instanceof HTMLInputElement && email.value).toBe(
    'new@example.com',
  );
});

it('explains password requirements, validates confirmation, and registers into a fresh account', async () => {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve(
      url === '/api/v1/auth/me'
        ? unauthorized()
        : url === '/api/v1/auth/register'
          ? Response.json({ data: userDto }, { status: 201 })
          : Response.json({ data: [] }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  const { user } = setup('/register');
  await screen.findByRole('heading', { name: 'Create an account' });
  expect(screen.getByText(/Use 12–128 characters/)).toBeDefined();
  await user.type(screen.getByLabelText('Name'), 'New User');
  await user.type(screen.getByLabelText('Email'), ' NEW@example.com ');
  await user.type(screen.getByLabelText('Password'), 'Long test passphrase');
  await user.type(screen.getByLabelText('Confirm password'), 'different');
  await user.click(screen.getByRole('button', { name: 'Create account' }));
  await screen.findByText('Passwords must match.');
  expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/register'))).toBe(
    false,
  );
  await user.clear(screen.getByLabelText('Confirm password'));
  await user.type(
    screen.getByLabelText('Confirm password'),
    'Long test passphrase',
  );
  await user.click(screen.getByRole('button', { name: 'Create account' }));
  await screen.findByRole('heading', { name: 'Your next idea starts here' });
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/v1/auth/register',
    expect.objectContaining({
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'Long test passphrase',
        name: 'New User',
      }),
      credentials: 'include',
    }),
  );
});

it('clears old account data on logout and login as another user', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  client.setQueryData(['auth', 'me'], userDto);
  client.setQueryData(
    ['projects'],
    [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'Private old project',
        description: null,
        createdAt: '2026-10-24T00:00:00.000Z',
        updatedAt: '2026-10-24T00:00:00.000Z',
        taskCount: 0,
        completedTaskCount: 0,
        progress: 0,
      },
    ],
  );
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        url.endsWith('/logout')
          ? new Response(null, { status: 204 })
          : url.endsWith('/login')
            ? Response.json({
                data: {
                  ...userDto,
                  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
                  email: 'second@example.com',
                },
              })
            : url.endsWith('/me')
              ? unauthorized()
              : Response.json({ data: [] }),
      ),
    ),
  );
  const { user } = setup('/projects', client);
  await user.click(screen.getByRole('button', { name: 'Log out' }));
  await screen.findByRole('heading', { name: 'Welcome back' });
  expect(client.getQueryData(['projects'])).toBeUndefined();
  await user.type(screen.getByLabelText('Email'), 'second@example.com');
  await user.type(screen.getByLabelText('Password'), 'Another long passphrase');
  await user.click(screen.getByRole('button', { name: 'Log in' }));
  await screen.findByRole('heading', { name: 'Your next idea starts here' });
  expect(screen.queryByText('Private old project')).toBeNull();
});

it('removes cached protected data when the API reports an expired session', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(['auth', 'me'], userDto);
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(unauthorized())),
  );
  setup('/projects', client);
  await screen.findByRole('heading', { name: 'Welcome back' });
  expect(client.getQueryData(['projects'])).toBeUndefined();
});
