import {PrismaClient} from '../app/generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
const prisma = new PrismaClient({adapter});

/**
 * Seeds the database with an initial admin user.
 *
 * - Checks if an admin user already exists to avoid duplicates.
 * - Hashes the admin password securely using bcrypt.
 * - Creates the admin user with default credentials:
 *   - Email: admin@gymtrackerpro.com
 *   - Password: admin
 *
 * @async
 */
const main = async () => {
    console.log('Seeding database...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: {email: 'admin@gymtrackerpro.com'},
    });

    if (existingAdmin) {
        console.log('Admin user already exists, skipping seed.');
        return;
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash('admin', 12);

    // Create the admin user
    await prisma.user.create({
        data: {
            email: 'admin@gymtrackerpro.com',
            fullName: 'Gym Administrator',
            phone: '+1234567890',
            dateOfBirth: new Date('1990-01-01'),
            passwordHash,
            role: 'ADMIN',
        },
    });

    console.log('Admin user created: admin@gymtrackerpro.com / admin');
    console.log('Seed completed!');
};

/**
 * Execute the main seeding function.
 *
 * Catches and logs errors, exits the process if an error occurs,
 * and ensures the Prisma client disconnects at the end.
 */
main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });