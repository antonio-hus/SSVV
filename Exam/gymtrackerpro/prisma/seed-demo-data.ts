import {PrismaClient} from './generated/prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({connectionString: process.env.DATABASE_URL!});
const prisma = new PrismaClient({adapter});

const MEMBERS = [
    {email: 'andrei.ionescu@gmail.com',     password: 'parola123', fullName: 'Andrei Ionescu',      phone: '+40721100001', dob: '1992-03-14', membershipStart: '2025-01-10'},
    {email: 'maria.popescu@gmail.com',      password: 'parola123', fullName: 'Maria Popescu',       phone: '+40721100002', dob: '1995-07-22', membershipStart: '2025-02-01'},
    {email: 'alex.constantin@yahoo.com',    password: 'parola123', fullName: 'Alexandru Constantin', phone: '+40721100003', dob: '1990-11-05', membershipStart: '2024-11-15'},
    {email: 'elena.dumitrescu@gmail.com',   password: 'parola123', fullName: 'Elena Dumitrescu',    phone: '+40721100004', dob: '1998-04-30', membershipStart: '2025-03-20'},
    {email: 'bogdan.popa@hotmail.com',      password: 'parola123', fullName: 'Bogdan Popa',         phone: '+40721100005', dob: '1988-09-18', membershipStart: '2024-09-01'},
    {email: 'ioana.gheorghe@gmail.com',     password: 'parola123', fullName: 'Ioana Gheorghe',      phone: '+40721100006', dob: '1997-01-09', membershipStart: '2025-01-05'},
    {email: 'mihai.stan@gmail.com',         password: 'parola123', fullName: 'Mihai Stan',          phone: '+40721100007', dob: '1993-06-27', membershipStart: '2025-04-01'},
    {email: 'raluca.moldovan@yahoo.com',    password: 'parola123', fullName: 'Raluca Moldovan',     phone: '+40721100008', dob: '1996-12-03', membershipStart: '2024-12-10'},
    {email: 'cristian.munteanu@gmail.com',  password: 'parola123', fullName: 'Cristian Munteanu',   phone: '+40721100009', dob: '1991-08-16', membershipStart: '2025-02-14'},
    {email: 'anca.stoica@gmail.com',        password: 'parola123', fullName: 'Anca Stoica',         phone: '+40721100010', dob: '1999-05-21', membershipStart: '2025-03-01'},
    {email: 'vlad.nistor@hotmail.com',      password: 'parola123', fullName: 'Vlad Nistor',         phone: '+40721100011', dob: '1987-10-11', membershipStart: '2024-10-20'},
    {email: 'gabriela.luca@gmail.com',      password: 'parola123', fullName: 'Gabriela Luca',       phone: '+40721100012', dob: '1994-02-28', membershipStart: '2025-01-25'},
];

const EXERCISES = [
    {
        name: 'Barbell Bench Press',
        description: 'A compound pushing movement performed lying on a flat bench. Lower the barbell to mid-chest and press back up to full extension.',
        muscleGroup: 'CHEST' as const,
        equipmentNeeded: 'BARBELL' as const,
    },
    {
        name: 'Cable Chest Fly',
        description: 'An isolation exercise using a cable machine. Arms sweep together in a wide arc to target the pectoral muscles through a full range of motion.',
        muscleGroup: 'CHEST' as const,
        equipmentNeeded: 'CABLE' as const,
    },
    {
        name: 'Dumbbell Shoulder Press',
        description: 'A vertical pressing movement performed seated or standing. Press dumbbells overhead from shoulder height until arms are fully extended.',
        muscleGroup: 'SHOULDERS' as const,
        equipmentNeeded: 'DUMBBELL' as const,
    },
    {
        name: 'Dumbbell Lateral Raise',
        description: 'An isolation exercise for the lateral deltoid. Raise dumbbells out to the sides until arms are parallel to the floor, then lower under control.',
        muscleGroup: 'SHOULDERS' as const,
        equipmentNeeded: 'DUMBBELL' as const,
    },
    {
        name: 'Barbell Bicep Curl',
        description: 'A classic arm exercise. Curl the barbell from full arm extension to chin height while keeping elbows fixed at the sides.',
        muscleGroup: 'ARMS' as const,
        equipmentNeeded: 'BARBELL' as const,
    },
    {
        name: 'Cable Tricep Pushdown',
        description: 'An isolation exercise for the triceps. Push a cable attachment downward from chest height to full arm extension while keeping elbows pinned.',
        muscleGroup: 'ARMS' as const,
        equipmentNeeded: 'CABLE' as const,
    },
    {
        name: 'Lat Pulldown',
        description: 'A vertical pulling movement targeting the latissimus dorsi. Pull a wide bar down to the upper chest while driving elbows toward the floor.',
        muscleGroup: 'BACK' as const,
        equipmentNeeded: 'MACHINE' as const,
    },
    {
        name: 'Seated Cable Row',
        description: 'A horizontal pulling exercise that trains the mid-back and biceps. Pull the handle toward the lower abdomen while keeping the torso upright.',
        muscleGroup: 'BACK' as const,
        equipmentNeeded: 'CABLE' as const,
    },
    {
        name: 'Romanian Deadlift',
        description: 'A hip-hinge movement that stretches and loads the hamstrings. Lower the barbell along the legs by pushing the hips back, then drive the hips forward to return.',
        muscleGroup: 'LEGS' as const,
        equipmentNeeded: 'BARBELL' as const,
    },
    {
        name: 'Leg Press',
        description: 'A machine-based compound leg exercise. Push the weighted platform away by extending the knees and hips, then return under control to the starting position.',
        muscleGroup: 'LEGS' as const,
        equipmentNeeded: 'MACHINE' as const,
    },
    {
        name: 'Cable Crunch',
        description: 'A weighted core flexion exercise. Kneel below a cable pulley, grasp the rope behind the head, and crunch the elbows toward the knees.',
        muscleGroup: 'CORE' as const,
        equipmentNeeded: 'CABLE' as const,
    },
    {
        name: 'Dumbbell Russian Twist',
        description: 'A rotational core exercise. Sit with feet off the floor, hold a dumbbell at chest height, and rotate the torso from side to side.',
        muscleGroup: 'CORE' as const,
        equipmentNeeded: 'DUMBBELL' as const,
    },
];

type ExerciseSlot = {exerciseIndex: number; sets: number; reps: number; weight: number};

type SessionTemplate = {
    name: string;
    notes: string;
    duration: number;
    slots: ExerciseSlot[];
};

const SESSION_TEMPLATES: SessionTemplate[] = [
    {
        name: 'Push Day A',
        notes: 'Focused on chest and shoulders. Felt strong today.',
        duration: 65,
        slots: [
            {exerciseIndex: 0, sets: 4, reps: 8,  weight: 80},
            {exerciseIndex: 1, sets: 3, reps: 12, weight: 15},
            {exerciseIndex: 2, sets: 3, reps: 10, weight: 24},
            {exerciseIndex: 3, sets: 3, reps: 15, weight: 10},
        ],
    },
    {
        name: 'Pull Day A',
        notes: 'Back and biceps session. Added weight on lat pulldown.',
        duration: 60,
        slots: [
            {exerciseIndex: 6, sets: 4, reps: 10, weight: 65},
            {exerciseIndex: 7, sets: 4, reps: 12, weight: 50},
            {exerciseIndex: 4, sets: 3, reps: 10, weight: 40},
        ],
    },
    {
        name: 'Leg Day A',
        notes: 'Heavy leg session. ROM felt good throughout.',
        duration: 70,
        slots: [
            {exerciseIndex: 9, sets: 4, reps: 12, weight: 120},
            {exerciseIndex: 8, sets: 3, reps: 10, weight: 70},
        ],
    },
    {
        name: 'Arms & Core',
        notes: 'Isolation work for arms and core stability.',
        duration: 50,
        slots: [
            {exerciseIndex: 4, sets: 4, reps: 12, weight: 35},
            {exerciseIndex: 5, sets: 4, reps: 15, weight: 30},
            {exerciseIndex: 10, sets: 3, reps: 15, weight: 25},
            {exerciseIndex: 11, sets: 3, reps: 20, weight: 8},
        ],
    },
    {
        name: 'Push Day B',
        notes: 'Volume day — kept weights moderate and reps high.',
        duration: 60,
        slots: [
            {exerciseIndex: 0, sets: 3, reps: 12, weight: 70},
            {exerciseIndex: 1, sets: 4, reps: 15, weight: 12},
            {exerciseIndex: 2, sets: 4, reps: 12, weight: 20},
        ],
    },
    {
        name: 'Pull Day B',
        notes: 'Focused on mind-muscle connection in the back.',
        duration: 55,
        slots: [
            {exerciseIndex: 7, sets: 3, reps: 15, weight: 45},
            {exerciseIndex: 6, sets: 3, reps: 12, weight: 60},
            {exerciseIndex: 4, sets: 3, reps: 12, weight: 35},
        ],
    },
    {
        name: 'Leg Day B',
        notes: 'Higher reps today for hypertrophy. Quads were on fire.',
        duration: 65,
        slots: [
            {exerciseIndex: 9, sets: 5, reps: 15, weight: 100},
            {exerciseIndex: 8, sets: 4, reps: 12, weight: 60},
        ],
    },
    {
        name: 'Full Body A',
        notes: 'Quick full-body session, short rest periods.',
        duration: 75,
        slots: [
            {exerciseIndex: 0, sets: 3, reps: 8,  weight: 75},
            {exerciseIndex: 6, sets: 3, reps: 10, weight: 60},
            {exerciseIndex: 9, sets: 3, reps: 12, weight: 110},
            {exerciseIndex: 10, sets: 3, reps: 15, weight: 22},
        ],
    },
    {
        name: 'Shoulder Focus',
        notes: 'Dedicated shoulder session. Lateral raises burned.',
        duration: 45,
        slots: [
            {exerciseIndex: 2, sets: 4, reps: 10, weight: 22},
            {exerciseIndex: 3, sets: 5, reps: 15, weight: 8},
            {exerciseIndex: 5, sets: 3, reps: 15, weight: 28},
        ],
    },
    {
        name: 'Back & Core',
        notes: 'Combined back and core work. Core was the weak link.',
        duration: 55,
        slots: [
            {exerciseIndex: 7, sets: 4, reps: 12, weight: 50},
            {exerciseIndex: 6, sets: 4, reps: 10, weight: 62},
            {exerciseIndex: 11, sets: 4, reps: 20, weight: 6},
            {exerciseIndex: 10, sets: 3, reps: 15, weight: 20},
        ],
    },
    {
        name: 'Upper Body Power',
        notes: 'Heavier weights, lower reps. Bench felt great.',
        duration: 70,
        slots: [
            {exerciseIndex: 0, sets: 5, reps: 5,  weight: 90},
            {exerciseIndex: 6, sets: 5, reps: 6,  weight: 72},
            {exerciseIndex: 2, sets: 4, reps: 6,  weight: 30},
        ],
    },
    {
        name: 'Full Body B',
        notes: 'End-of-week full-body session. Finished strong.',
        duration: 80,
        slots: [
            {exerciseIndex: 0, sets: 3, reps: 10, weight: 72},
            {exerciseIndex: 8, sets: 3, reps: 10, weight: 65},
            {exerciseIndex: 4, sets: 3, reps: 12, weight: 32},
            {exerciseIndex: 10, sets: 3, reps: 15, weight: 20},
            {exerciseIndex: 9, sets: 3, reps: 12, weight: 100},
        ],
    },
];

/** Spread 12 session dates across the last ~5 months, roughly weekly. */
function buildSessionDates(membershipStart: string): Date[] {
    const start = new Date(membershipStart);
    const now = new Date('2026-04-07');
    const rangeMs = now.getTime() - start.getTime();

    // 12 evenly-spaced slots with 2-day jitter
    return Array.from({length: 12}, (_, i) => {
        const fraction = (i + 0.5) / 12;
        const base = new Date(start.getTime() + fraction * rangeMs);
        const jitterDays = Math.floor(((i * 7 + 3) % 5) - 2);
        base.setDate(base.getDate() + jitterDays);
        return base;
    });
}

const main = async () => {
    console.log('Seeding demo data...');

    console.log(`\nUpserting ${EXERCISES.length} exercises...`);
    const exerciseIds: string[] = [];

    for (const ex of EXERCISES) {
        const record = await prisma.exercise.upsert({
            where: {name: ex.name},
            update: {},
            create: ex,
        });
        exerciseIds.push(record.id);
        console.log(`  exercise  "${ex.name}" (${record.id})`);
    }

    console.log(`\nCreating ${MEMBERS.length} members with 12 sessions each...`);

    for (const m of MEMBERS) {
        const existing = await prisma.user.findUnique({where: {email: m.email}});
        if (existing) {
            console.log(`  skip member  ${m.email} (already exists)`);
            continue;
        }

        const passwordHash = await bcrypt.hash(m.password, 12);

        const user = await prisma.user.create({
            data: {
                email: m.email,
                fullName: m.fullName,
                phone: m.phone,
                dateOfBirth: new Date(m.dob),
                passwordHash,
                role: 'MEMBER',
                member: {
                    create: {
                        membershipStart: new Date(m.membershipStart),
                        isActive: true,
                    },
                },
            },
            include: {member: true},
        });

        const memberId = user.member!.id;
        console.log(`  member  ${m.fullName} (${memberId})`);

        const sessionDates = buildSessionDates(m.membershipStart);

        for (let s = 0; s < 12; s++) {
            const template = SESSION_TEMPLATES[s];

            await prisma.workoutSession.create({
                data: {
                    memberId,
                    date: sessionDates[s],
                    duration: template.duration,
                    notes: template.notes,
                    exercises: {
                        create: template.slots.map((slot) => ({
                            exerciseId: exerciseIds[slot.exerciseIndex],
                            sets: slot.sets,
                            reps: slot.reps,
                            weight: slot.weight,
                        })),
                    },
                },
            });
        }

        console.log(`    ${sessionDates.length} sessions created`);
    }

    console.log('\nDemo seed completed.');
};

main()
    .catch((e) => {
        console.error('Demo seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });