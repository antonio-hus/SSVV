import {
    createWorkoutSessionSchema,
    updateWorkoutSessionSchema,
    workoutSessionExerciseSchema,
    workoutSessionExercisesSchema,
    workoutSessionExerciseUpdateSchema,
    workoutSessionExercisesUpdateSchema,
    CreateWorkoutSessionInput,
    UpdateWorkoutSessionInput,
    WorkoutSessionExerciseInput,
    WorkoutSessionExerciseUpdateInput,
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
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 60,
                notes: 'Great session',
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('createWorkoutSessionSchema_Path2_memberIdNotString_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 123 as never,
                date: '2024-12-31',
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
            }
        });

        it('createWorkoutSessionSchema_Path3_memberIdWhitespaceOnly_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: '   ',
                date: '2024-12-31',
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
                expect(result.error.issues[0].message).toBe('Member is required');
            }
        });

        it('createWorkoutSessionSchema_Path4_dateNotString_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: 123 as never,
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('createWorkoutSessionSchema_Path5_dateInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '31-12-2024',
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
                expect(result.error.issues[0].message).toBe('Date must be in YYYY-MM-DD format');
            }
        });

        it('createWorkoutSessionSchema_Path6_dateEmpty_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '',
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('createWorkoutSessionSchema_Path7_durationNotCoercible_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 'abc' as never,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('createWorkoutSessionSchema_Path8_durationBelowMin_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: -1,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
                expect(result.error.issues[0].message).toBe('Duration must be greater or equal to 0');
            }
        });

        it('createWorkoutSessionSchema_Path9_durationAboveMax_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 181,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
                expect(result.error.issues[0].message).toBe('Duration must be at most 180 minutes');
            }
        });

        it('createWorkoutSessionSchema_Path10_notesUndefined_returnsSuccess', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('createWorkoutSessionSchema_Path11_notesAboveMax_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 60,
                notes: 'A'.repeat(1025),
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
                expect(result.error.issues[0].message).toBe('Notes must be at most 1024 characters');
            }
        });

        it('createWorkoutSessionSchema_Path12_notesNotStringAndNotUndefined_returnsError', () => {
            // Arrange
            const inputData: CreateWorkoutSessionInput = {
                memberId: 'member-1',
                date: '2024-12-31',
                duration: 60,
                notes: 123 as never,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputData);

            // Assert
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
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {};

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionSchema_Path2_dateValidFormat_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                date: '2024-12-31',
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionSchema_Path3_durationValid_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                duration: 60,
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionSchema_Path4_notesValidString_returnsSuccess', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                notes: 'Updated notes',
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('updateWorkoutSessionSchema_Path5_dateNotString_returnsError', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                date: 123 as never,
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('updateWorkoutSessionSchema_Path6_dateInvalidFormat_returnsError', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                date: '31-12-2024' as never,
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
                expect(result.error.issues[0].message).toBe('Date must be in YYYY-MM-DD format');
            }
        });

        it('updateWorkoutSessionSchema_Path7_durationNotCoercible_returnsError', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                duration: 'abc' as never,
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('updateWorkoutSessionSchema_Path8_durationBelowMin_returnsError', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                duration: -1,
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
                expect(result.error.issues[0].message).toBe('Duration must be greater or equal to 0');
            }
        });

        it('updateWorkoutSessionSchema_Path9_durationAboveMax_returnsError', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                duration: 181,
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
                expect(result.error.issues[0].message).toBe('Duration must be at most 180 minutes');
            }
        });

        it('updateWorkoutSessionSchema_Path10_notesAboveMax_returnsError', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                notes: 'A'.repeat(1025),
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
                expect(result.error.issues[0].message).toBe('Notes must be at most 1024 characters');
            }
        });

        it('updateWorkoutSessionSchema_Path11_notesNotStringAndNotUndefined_returnsError', () => {
            // Arrange
            const inputData: UpdateWorkoutSessionInput = {
                notes: 123 as never,
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputData);

            // Assert
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
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExerciseSchema_Path2_exerciseIdNotString_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 123 as never,
                sets: 3,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExerciseSchema_Path3_exerciseIdWhitespaceOnly_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: '   ',
                sets: 3,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
                expect(result.error.issues[0].message).toBe('Exercise is required');
            }
        });

        it('workoutSessionExerciseSchema_Path4_setsNotCoercible_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 'abc' as never,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseSchema_Path5_setsBelowMin_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: -1,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
                expect(result.error.issues[0].message).toBe('Sets must be greater or equal to 0');
            }
        });

        it('workoutSessionExerciseSchema_Path6_setsAboveMax_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 7,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
                expect(result.error.issues[0].message).toBe('Sets must be at most 6');
            }
        });

        it('workoutSessionExerciseSchema_Path7_repsNotCoercible_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 'abc' as never,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseSchema_Path8_repsBelowMin_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: -1,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
                expect(result.error.issues[0].message).toBe('Reps must be greater or equal to 0');
            }
        });

        it('workoutSessionExerciseSchema_Path9_repsAboveMax_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 31,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
                expect(result.error.issues[0].message).toBe('Reps must be at most 30');
            }
        });

        it('workoutSessionExerciseSchema_Path10_weightNotCoercible_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 'abc' as never,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExerciseSchema_Path11_weightBelowMin_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: -1,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
                expect(result.error.issues[0].message).toBe('Weight must be greater or equal to 0.0');
            }
        });

        it('workoutSessionExerciseSchema_Path12_weightAboveMax_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 501,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
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
            // Arrange
            const inputData: WorkoutSessionExerciseInput[] = [VALID_EXERCISE];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesSchema_Path2_notAnArray_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput[] = 'not-an-array' as never;

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesSchema_Path3_emptyArray_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput[] = [];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('At least one exercise is required');
            }
        });

        it('workoutSessionExercisesSchema_Path4_oneInvalidEntry_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput[] = [INVALID_EXERCISE];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

    });

    describe('Loop Coverage', () => {

        it('workoutSessionExercisesSchema_Loop_no_emptyArray_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput[] = [];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesSchema_Loop_once_oneValidEntry_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput[] = [VALID_EXERCISE];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesSchema_Loop_twice_twoValidEntries_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput[] = [VALID_EXERCISE, VALID_EXERCISE];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesSchema_Loop_n_sixValidEntries_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput[] = Array(6).fill(VALID_EXERCISE);

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

    });

});

describe('workoutSessionExerciseUpdateSchema', () => {

    describe('Independent Paths', () => {

        it('workoutSessionExerciseUpdateSchema_Path1_idAbsent_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExerciseUpdateSchema_Path2_idNotString_returnsError', () => {
            // Arrange
            const inputData = {
                id: 123,
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('id');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path3_idIsString_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                id: 'existing-row-id',
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExerciseUpdateSchema_Path4_exerciseIdNotString_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 123 as never,
                sets: 3,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path5_exerciseIdWhitespaceOnly_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: '   ',
                sets: 3,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
                expect(result.error.issues[0].message).toBe('Exercise is required');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path6_setsNotCoercible_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 'abc' as never,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path7_setsBelowMin_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: -1,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
                expect(result.error.issues[0].message).toBe('Sets must be greater or equal to 0');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path8_setsAboveMax_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 7,
                reps: 10,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
                expect(result.error.issues[0].message).toBe('Sets must be at most 6');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path9_repsNotCoercible_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 'abc' as never,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path10_repsBelowMin_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: -1,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
                expect(result.error.issues[0].message).toBe('Reps must be greater or equal to 0');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path11_repsAboveMax_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 31,
                weight: 50,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
                expect(result.error.issues[0].message).toBe('Reps must be at most 30');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path12_weightNotCoercible_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 'abc' as never,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path13_weightBelowMin_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: -1,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
                expect(result.error.issues[0].message).toBe('Weight must be greater or equal to 0.0');
            }
        });

        it('workoutSessionExerciseUpdateSchema_Path14_weightAboveMax_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 501,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
                expect(result.error.issues[0].message).toBe('Weight must be at most 500.0');
            }
        });

    });

});

describe('workoutSessionExercisesUpdateSchema', () => {

    describe('Independent Paths', () => {

        it('workoutSessionExercisesUpdateSchema_Path1_oneValidEntry_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput[] = [{
                id: 'row-1',
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 50,
            }];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesUpdateSchema_Path2_notAnArray_returnsError', () => {
            // Arrange
            const inputData = 'not-an-array';

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesUpdateSchema_Path3_emptyArray_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput[] = [];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toBe('At least one exercise is required');
            }
        });

        it('workoutSessionExercisesUpdateSchema_Path4_oneInvalidEntry_returnsError', () => {
            // Arrange
            const inputData = [{exerciseId: '', sets: 3, reps: 10, weight: 50}];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

    });

    describe('Loop Coverage', () => {

        it('workoutSessionExercisesUpdateSchema_Loop_no_emptyArray_returnsError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput[] = [];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesUpdateSchema_Loop_once_oneValidEntry_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput[] = [
                {exerciseId: 'exercise-1', sets: 3, reps: 10, weight: 50},
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesUpdateSchema_Loop_twice_twoValidEntries_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput[] = [
                {exerciseId: 'exercise-1', sets: 3, reps: 10, weight: 50},
                {id: 'row-2', exerciseId: 'exercise-2', sets: 4, reps: 12, weight: 60},
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

        it('workoutSessionExercisesUpdateSchema_Loop_n_sixValidEntries_returnsSuccess', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput[] = Array(6).fill({
                exerciseId: 'exercise-1',
                sets: 3,
                reps: 10,
                weight: 50,
            });

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
        });

    });

});
