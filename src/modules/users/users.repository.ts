// The only Prisma access to the `User` record — `users` owns it (BR-6, AD-2,
// PC-1). Both queries select only what the caller needs and never
// `password_hash` (PC-8, SR-4): registration writes the hash and never reads
// one. Each accepts an optional transactional client so the service can compose
// them into one atomic operation (PC-9, AD-3); neither opens a transaction.

import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

/** A Prisma client or an interactive-transaction client — the two are interchangeable here. */
type UserDbClient = Pick<typeof prisma, 'user'> & { $transaction?: unknown };

const CUSTOMER_SELECT = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export interface NewUser {
  email: string;
  passwordHash: string;
}

export interface CustomerRecord {
  id: string;
  email: string;
  role: 'CUSTOMER';
  createdAt: Date;
}

export const usersRepository = {
  /** Uniqueness check — existence is the whole question, so it selects `id` only (db-design access path #1). */
  findByEmail(email: string, client: UserDbClient = prisma): Promise<{ id: string } | null> {
    return client.user.findUnique({ where: { email }, select: { id: true } });
  },

  /** Insert, selecting exactly the four response fields (db-design access path #2, FR-5, PC-8). */
  create(input: NewUser, client: UserDbClient = prisma): Promise<CustomerRecord> {
    return client.user.create({
      data: { email: input.email, passwordHash: input.passwordHash },
      select: CUSTOMER_SELECT,
    });
  },

  /** Opens the transaction the service composes access paths #1 and #2 inside (AD-3, PC-9). */
  transaction<T>(fn: (client: UserDbClient) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => fn(tx));
  },
};

export type UsersRepository = typeof usersRepository;
