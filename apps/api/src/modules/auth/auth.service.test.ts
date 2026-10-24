import { createHash } from 'node:crypto';
import { argon2id, hash, verify } from 'argon2';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import * as repository from './auth.repository.js';
import * as service from './auth.service.js';

vi.mock('./auth.repository.js');
const input = {
  name: 'User',
  email: 'unit@example.test',
  password: 'A public unit test passphrase',
};
const publicUser = { id: 'owner', name: input.name, email: input.email };
let passwordHash = '';
beforeAll(async () => {
  passwordHash = await hash(input.password, { type: argon2id });
});
beforeEach(() => {
  vi.resetAllMocks();
});

it('registers with a password hash and stores only a hash of the opaque expiring token', async () => {
  vi.mocked(repository.registerUser).mockResolvedValue(publicUser);
  const result = await service.register(input, 'previous-token');
  const call = vi.mocked(repository.registerUser).mock.calls[0];
  if (!call) throw new Error('Expected a registration write.');
  expect(await verify(call[1], input.password)).toBe(true);
  expect(call[1]).not.toBe(input.password);
  expect(result.token).toMatch(/^[a-f0-9]{64}$/);
  expect(call[2]).toBe(createHash('sha256').update(result.token).digest('hex'));
  expect(call[3].getTime() - Date.now()).toBeGreaterThan(
    service.sessionLifetimeMs - 5000,
  );
  expect(result.user).toEqual(publicUser);
  expect(repository.deleteSession).toHaveBeenCalledWith(
    createHash('sha256').update('previous-token').digest('hex'),
  );
});
it('rejects duplicate registration without revoking the caller session', async () => {
  vi.mocked(repository.registerUser).mockResolvedValue(null);
  await expect(service.register(input, 'previous')).rejects.toMatchObject({
    statusCode: 409,
    code: 'EMAIL_IN_USE',
  });
  expect(repository.deleteSession).not.toHaveBeenCalled();
});
it('logs in with real Argon2 verification and returns only a public user DTO', async () => {
  vi.mocked(repository.findUserByEmail).mockResolvedValue({
    ...publicUser,
    passwordHash,
  });
  const result = await service.login(input);
  expect(result.user).toEqual(publicUser);
  expect(repository.createSession).toHaveBeenCalledWith(
    publicUser.id,
    createHash('sha256').update(result.token).digest('hex'),
    expect.any(Date),
  );
});
it.each(['missing', 'wrong password', 'disabled seed'])(
  'rejects %s credentials without creating sessions',
  async (scenario) => {
    vi.mocked(repository.findUserByEmail).mockResolvedValue(
      scenario === 'missing'
        ? null
        : {
            ...publicUser,
            passwordHash:
              scenario === 'disabled seed' ? 'disabled' : passwordHash,
          },
    );
    await expect(
      service.login({
        email: input.email,
        password: scenario === 'wrong password' ? 'incorrect' : input.password,
      }),
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    expect(repository.createSession).not.toHaveBeenCalled();
  },
);
it('requires a token, rejects an unavailable session, and authenticates only its stored owner', async () => {
  await expect(service.authenticate()).rejects.toMatchObject({
    statusCode: 401,
  });
  vi.mocked(repository.findSession)
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce({ user: publicUser });
  await expect(service.authenticate('missing')).rejects.toMatchObject({
    statusCode: 401,
  });
  expect(await service.authenticate('valid')).toEqual(publicUser);
  expect(repository.findSession).toHaveBeenLastCalledWith(
    createHash('sha256').update('valid').digest('hex'),
  );
  await service.logout();
  expect(repository.deleteSession).not.toHaveBeenCalled();
});
