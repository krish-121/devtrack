import type { RegisterInput } from '@devtrack/shared';
import { prisma } from '../../database/prisma.js';
import { Prisma } from '../../generated/prisma/client.js';

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { ...publicUserSelect, passwordHash: true },
  });
}
export async function registerUser(
  input: RegisterInput,
  passwordHash: string,
  tokenHash: string,
  expiresAt: Date,
) {
  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        sessions: { create: { tokenHash, expiresAt } },
      },
      select: publicUserSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      return null;
    throw error;
  }
}
export async function createSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  await prisma.$transaction([
    prisma.session.deleteMany({
      where: { userId, expiresAt: { lte: new Date() } },
    }),
    prisma.session.create({ data: { userId, tokenHash, expiresAt } }),
  ]);
}
export function findSession(tokenHash: string) {
  return prisma.session.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
    select: { user: { select: publicUserSelect } },
  });
}
export function deleteSession(tokenHash: string) {
  return prisma.session.deleteMany({ where: { tokenHash } });
}
