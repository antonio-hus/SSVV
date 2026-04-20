import type {Exercise} from '@/prisma/generated/prisma/client';
import type {WorkoutSession, WorkoutSessionExercise} from '@/prisma/generated/prisma/client';
export type {WorkoutSession} from '@/prisma/generated/prisma/client';
export type {WorkoutSessionExercise} from '@/prisma/generated/prisma/client';

/** Workout session with all exercises and their catalogue entries included. */
export type WorkoutSessionWithExercises = WorkoutSession & {
    exercises: (WorkoutSessionExercise & {exercise: Exercise})[];
};

/** Options for filtering and paginating workout sessions. */
export type WorkoutSessionListOptions = {
    memberId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
};
