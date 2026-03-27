import {PrismaClient} from '@/app/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';

/**
 * Extends the global object to hold a Prisma client instance.
 * This ensures that in development, we reuse the same client
 * to prevent exhausting database connections due to hot-reloading.
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Creates a new Prisma client instance with a PostgreSQL adapter.
 *
 * @returns {PrismaClient} A new Prisma client connected via PrismaPg adapter.
 */
const createClient = (): PrismaClient => {
    const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
    return new PrismaClient({adapter});
};

/**
 * The Prisma client instance.
 *
 * - In production, a new client is always created.
 * - In development, the client is stored globally to avoid multiple instances
 *   due to module reloads.
 */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

/**
 * Assigns the Prisma client to the global object in development
 * to reuse the same client across hot module reloads.
 */
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}