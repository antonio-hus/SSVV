import type {MuscleGroup} from '@/prisma/generated/prisma/client';
export type {Exercise} from '@/prisma/generated/prisma/client';
export {MuscleGroup, Equipment} from '@/prisma/generated/prisma/client';

/** Options for filtering and paginating the exercise catalogue. */
export type ExerciseListOptions = {
    search?: string;
    muscleGroup?: MuscleGroup;
    includeInactive?: boolean;
    page?: number;
    pageSize?: number;
};
