import {
    createWorkoutSessionSchema,
    updateWorkoutSessionSchema,
    workoutSessionExerciseSchema,
    workoutSessionExercisesSchema,
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
} from '@/lib/schema/workout-session-schema';

const VALID_EXERCISE: WorkoutSessionExerciseInput = {
    exerciseId: 'exercise-1',
    sets: 3,
    reps: 10,
    weight: 50,
};

const INVALID_EXERCISE: WorkoutSessionExerciseInput = {
    exerciseId: '',
    sets: 3,
    reps: 10,
    weight: 50,
};

describe('createWorkoutSessionSchema', () => {

    describe('Independent Paths', () => {

        it('createWorkoutSessionSchema_Path1_validInputWithNotes_returnsSuccess', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 60,
                notes: 'Great session',
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSessionSchema_Path2_memberIdNotString_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 123 as never,
                date: '2024-12-31',
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
            }
        });

        it('createWorkoutSessionSchema_Path3_memberIdWhitespaceOnly_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: '   ',
                date: '2024-12-31',
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
                expect(result.error.issues[0].message).toBe('Member is required');
            }
        });

        it('createWorkoutSessionSchema_Path4_dateNotString_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: 123 as never,
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('createWorkoutSessionSchema_Path5_dateInvalidFormat_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '31-12-2024',
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
                expect(result.error.issues[0].message).toBe('Date must be in YYYY-MM-DD format');
            }
        });

        it('createWorkoutSessionSchema_Path6_dateEmpty_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '',
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('createWorkoutSessionSchema_Path7_durationNotCoercible_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 'abc' as never,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('createWorkoutSessionSchema_Path8_durationBelowMin_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: -1,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
                expect(result.error.issues[0].message).toBe('Duration must be greater or equal to 0');
            }
        });

        it('createWorkoutSessionSchema_Path9_durationAboveMax_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 181,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
                expect(result.error.issues[0].message).toBe('Duration must be at most 180 minutes');
            }
        });

        it('createWorkoutSessionSchema_Path10_notesUndefined_returnsSuccess', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('createWorkoutSessionSchema_Path11_notesAboveMax_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 60,
                notes: 'A'.repeat(1025),
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
                expect(result.error.issues[0].message).toBe('Notes must be at most 1024 characters');
            }
        });

        it('createWorkoutSessionSchema_Path12_notesNotStringAndNotUndefined_returnsError', () => {
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 60,
                notes: 123 as never,
            };

            const result = createWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
            }
        });

    });

});

describe('updateWorkoutSessionSchema', () => {

    describe('Independent Paths', () => {

        it('updateWorkoutSessionSchema_Path1_emptyObject_returnsSuccess', () => {
            const inputData: UpdateWorkoutSessionInput = {};

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionSchema_Path2_dateValidFormat_returnsSuccess', () => {
            const inputData: UpdateWorkoutSessionInput = {
                date: '2024-12-31',
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionSchema_Path3_durationValid_returnsSuccess', () => {
            const inputData: UpdateWorkoutSessionInput = {
                duration: 60,
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionSchema_Path4_notesValidString_returnsSuccess', () => {
            const inputData: UpdateWorkoutSessionInput = {
                notes: 'Updated notes',
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionSchema_Path5_dateNotString_returnsError', () => {
            const inputData: UpdateWorkoutSessionInput = {
                date: 123 as never,
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('updateWorkoutSessionSchema_Path6_dateInvalidFormat_returnsError', () => {
            const inputData: UpdateWorkoutSessionInput = {
                date: '31-12-2024' as never,
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
                expect(result.error.issues[0].message).toBe('Date must be in YYYY-MM-DD format');
            }
        });

        it('updateWorkoutSessionSchema_Path7_durationNotCoercible_returnsError', () => {
            const inputData: UpdateWorkoutSessionInput = {
                duration: 'abc' as never,
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('updateWorkoutSessionSchema_Path8_durationBelowMin_returnsError', () => {
            const inputData: UpdateWorkoutSessionInput = {
                duration: -1,
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
                expect(result.error.issues[0].message).toBe('Duration must be greater or equal to 0');
            }
        });

        it('updateWorkoutSessionSchema_Path9_durationAboveMax_returnsError', () => {
            const inputData: UpdateWorkoutSessionInput = {
                duration: 181,
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
                expect(result.error.issues[0].message).toBe('Duration must be at most 180 minutes');
            }
        });

        it('updateWorkoutSessionSchema_Path10_notesAboveMax_returnsError', () => {
            const inputData: UpdateWorkoutSessionInput = {
                notes: 'A'.repeat(1025),
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
                expect(result.error.issues[0].message).toBe('Notes must be at most 1024 characters');
            }
        });

        it('updateWorkoutSessionSchema_Path11_notesNotStringAndNotUndefined_returnsError', () => {
            const inputData: UpdateWorkoutSessionInput = {
                notes: 123 as never,
            };

            const result = updateWorkoutSessionSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
            }
        });

    });

});

describe('workoutSessionExerciseSchema', () => {

    describe('Independent Paths', () => {

        it('workoutSessionExerciseSchema_Path1_validEntry_returnsSuccess', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('workoutSessionExerciseSchema_Path2_exerciseIdNotString_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 123 as never,
                sets: 3,
                reps: 10,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExerciseSchema_Path3_exerciseIdWhitespaceOnly_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: '   ',
                sets: 3,
                reps: 10,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
                expect(result.error.issues[0].message).toBe('Exercise is required');
            }
        });

        it('workoutSessionExerciseSchema_Path4_setsNotCoercible_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 'abc' as never,
                reps: 10,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseSchema_Path5_setsBelowMin_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: -1,
                reps: 10,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
                expect(result.error.issues[0].message).toBe('Sets must be greater or equal to 0');
            }
        });

        it('workoutSessionExerciseSchema_Path6_setsAboveMax_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 7,
                reps: 10,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
                expect(result.error.issues[0].message).toBe('Sets must be at most 6');
            }
        });

        it('workoutSessionExerciseSchema_Path7_repsNotCoercible_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 'abc' as never,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseSchema_Path8_repsBelowMin_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: -1,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
                expect(result.error.issues[0].message).toBe('Reps must be greater or equal to 0');
            }
        });

        it('workoutSessionExerciseSchema_Path9_repsAboveMax_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 31,
                weight: 50,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
                expect(result.error.issues[0].message).toBe('Reps must be at most 30');
            }
        });

        it('workoutSessionExerciseSchema_Path10_weightNotCoercible_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 'abc' as never,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExerciseSchema_Path11_weightBelowMin_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: -1,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
                expect(result.error.issues[0].message).toBe('Weight must be greater or equal to 0.0');
            }
        });

        it('workoutSessionExerciseSchema_Path12_weightAboveMax_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 501,
            };

            const result = workoutSessionExerciseSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
                expect(result.error.issues[0].message).toBe('Weight must be at most 500.0');
            }
        });

    });

});

describe('workoutSessionExercisesSchema', () => {

    describe('Independent Paths', () => {

        it('workoutSessionExercisesSchema_Path1_oneValidEntry_returnsSuccess', () => {
            const inputData: WorkoutSessionExerciseInput[] = [VALID_EXERCISE];

            const result = workoutSessionExercisesSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesSchema_Path2_notAnArray_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput[] = 'not-an-array' as never;

            const result = workoutSessionExercisesSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesSchema_Path3_emptyArray_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput[] = [];

            const result = workoutSessionExercisesSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('At least one exercise is required');
            }
        });

        it('workoutSessionExercisesSchema_Path4_oneInvalidEntry_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput[] = [INVALID_EXERCISE];

            const result = workoutSessionExercisesSchema.safeParse(inputData);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

    });

    describe('Loop Coverage', () => {

        it('workoutSessionExercisesSchema_Loop_no_emptyArray_returnsError', () => {
            const inputData: WorkoutSessionExerciseInput[] = [];

            const result = workoutSessionExercisesSchema.safeParse(inputData);

            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesSchema_Loop_once_oneValidEntry_returnsSuccess', () => {
            const inputData: WorkoutSessionExerciseInput[] = [VALID_EXERCISE];

            const result = workoutSessionExercisesSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesSchema_Loop_twice_twoValidEntries_returnsSuccess', () => {
            const inputData: WorkoutSessionExerciseInput[] = [VALID_EXERCISE, VALID_EXERCISE];

            const result = workoutSessionExercisesSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesSchema_Loop_n_sixValidEntries_returnsSuccess', () => {
            const inputData: WorkoutSessionExerciseInput[] = Array(6).fill(VALID_EXERCISE);

            const result = workoutSessionExercisesSchema.safeParse(inputData);

            expect(result.success).toBe(true);
        });

    });

});