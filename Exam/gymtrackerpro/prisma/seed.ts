import {PrismaClient} from './generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
const prisma = new PrismaClient({adapter});

type AdminSeed = {
    email: string;
    password: string;
    name: string;
    phone: string;
    dob: string;
};

const DEFAULT_ADMINS: AdminSeed[] = [
    {
        email: 'admin@gymtrackerpro.com',
        password: 'admin',
        name: 'Gym Administrator',
        phone: '+1234567890',
        dob: '1990-01-01',
    },
];

/**
 * Parses the SEED_ADMINS environment variable.
 * Expected format: JSON array of admin objects, e.g.
 *   [{"email":"a@b.com","password":"secret","name":"Alice","phone":"+1","dob":"1990-01-01"}]
 *
 * Falls back to DEFAULT_ADMINS when the variable is absent or invalid.
 */
const parseAdmins = (): AdminSeed[] => {
    const raw = process.env.SEED_ADMINS;
    if (!raw) return DEFAULT_ADMINS;

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            console.warn('SEED_ADMINS is not a non-empty array — using defaults.');
            return DEFAULT_ADMINS;
        }
        return parsed as AdminSeed[];
    } catch {
        console.warn('SEED_ADMINS is not valid JSON — using defaults.');
        return DEFAULT_ADMINS;
    }
};

/**
 * Seeds the database with one or more admin users defined in SEED_ADMINS.
 * Already-existing emails are skipped so re-running is always safe.
 */
const main = async () => {
    console.log('Seeding database...');

    const admins = parseAdmins();
    console.log(`Provisioning ${admins.length} admin(s)...`);

    for (const admin of admins) {
        const exists = await prisma.user.findUnique({where: {email: admin.email}});

        if (exists) {
            console.log(`  skip  ${admin.email} (already exists)`);
            continue;
        }

        const passwordHash = await bcrypt.hash(admin.password, 12);

        await prisma.user.create({
            data: {
                email: admin.email,
                fullName: admin.name,
                phone: admin.phone,
                dateOfBirth: new Date(admin.dob),
                passwordHash,
                role: 'ADMIN',
                admin: {create: {}},
            },
        });

        console.log(`  created ${admin.email}`);
    }

    console.log('Seed completed.');
};

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
