/**
 * Aggregated statistics for a specific exercise.
 */
export type ExerciseStats = {
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    sessionCount: number;
};

/**
 * Detailed data for an exercise within a session.
 */
export type SessionExerciseDetail = {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    weight: number;
    volume: number;
};

/**
 * Detailed information about a workout session.
 */
export type SessionDetail = {
    sessionId: string;
    date: Date;
    durationMinutes: number;
    notes?: string | null;
    exercises: SessionExerciseDetail[];
    totalVolume: number;
};

/**
 * Report summarizing a member's activity over a period.
 */
export type Report = {
    memberId: string;
    memberName: string;
    startDate: Date;
    endDate: Date;
    totalSessions: number;
    totalVolume: number;
    averageSessionDuration: number;
    exerciseBreakdown: ExerciseStats[];
    sessionDetails: SessionDetail[];
};