import { createHash, randomBytes } from 'node:crypto';
import { argon2id, hash, verify } from 'argon2';
import type { HashOptions } from 'argon2';
import type { LoginInput, RegisterInput } from '@devtrack/shared';
import { AppError } from '../../errors/app-error.js';
import * as repository from './auth.repository.js';

export const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const hashOptions = {
  type: argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
} satisfies HashOptions;
// A missing user still runs password verification; no password or hash is logged.
const dummyHash = hash(randomBytes(32), hashOptions);
function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
function newSession() {
  const token = randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + sessionLifetimeMs),
  };
}
export async function register(input: RegisterInput, previousToken?: string) {
  const session = newSession();
  const passwordHash = await hash(input.password, hashOptions);
  const user = await repository.registerUser(
    input,
    passwordHash,
    session.tokenHash,
    session.expiresAt,
  );
  if (!user)
    throw new AppError(
      409,
      'EMAIL_IN_USE',
      'An account with this email already exists.',
    );
  await logout(previousToken);
  return { user, token: session.token };
}
export async function login(input: LoginInput, previousToken?: string) {
  const user = await repository.findUserByEmail(input.email);
  // Disabled seed records may predate authentication and must never sign in.
  const candidateHash = user?.passwordHash.startsWith('$argon2')
    ? user.passwordHash
    : await dummyHash;
  const valid = await verify(candidateHash, input.password);
  if (!user || !valid || !user.passwordHash.startsWith('$argon2'))
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Email or password is incorrect.',
    );
  const session = newSession();
  await repository.createSession(user.id, session.tokenHash, session.expiresAt);
  await logout(previousToken);
  return {
    user: { id: user.id, name: user.name, email: user.email },
    token: session.token,
  };
}
export async function authenticate(token?: string) {
  if (!token)
    throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');
  const session = await repository.findSession(tokenHash(token));
  if (!session)
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Your session has expired. Please log in again.',
    );
  return session.user;
}
export async function logout(token?: string) {
  if (token) await repository.deleteSession(tokenHash(token));
}
