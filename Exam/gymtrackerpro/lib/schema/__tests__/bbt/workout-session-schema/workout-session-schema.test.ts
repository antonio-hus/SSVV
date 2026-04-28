import {
    CreateWorkoutSessionInput,
    createWorkoutSessionSchema,
    UpdateWorkoutSessionInput,
    updateWorkoutSessionSchema,
    WorkoutSessionExerciseInput,
    workoutSessionExerciseSchema,
    workoutSessionExercisesSchema,
    WorkoutSessionExerciseUpdateInput,
    workoutSessionExerciseUpdateSchema,
    workoutSessionExercisesUpdateSchema,
} from '@/lib/schema/workout-session-schema';

const VALID_SESSION: CreateWorkoutSessionInput = {
    memberId: 'member-123',
    date: '2024-01-01',
    duration: 60,
    notes: 'Good workout',
};

const VALID_EXERCISE: WorkoutSessionExerciseInput = {
    exerciseId: 'exercise-123',
    sets: 3,
    reps: 10,
    weight: 80.5,
};

describe('createWorkoutSessionSchema', () => {
    describe('Equivalence Classes', () => {
        it('createWorkoutSessionSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputSession);
            }
        });

        it('createWorkoutSessionSchema_EC_notesAbsent_parsesSuccessfully', () => {
            // Arrange
            const inputSession = {
                memberId: 'member-123',
                date: '2024-01-01',
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe(inputSession.memberId);
                expect(result.data.notes).toBeUndefined();
            }
        });

        it('createWorkoutSessionSchema_EC_notesEmptyString_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: ''
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('createWorkoutSessionSchema_EC_missingMemberId_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                date: '2024-01-01',
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
            }
        });

        it('createWorkoutSessionSchema_EC_missingDate_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                memberId: 'member-123',
                duration: 60,
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('createWorkoutSessionSchema_EC_missingDuration_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                memberId: 'member-123',
                date: '2024-01-01',
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('createWorkoutSessionSchema_EC_memberIdWhitespace_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                ...VALID_SESSION,
                memberId: '   '
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
            }
        });

        it('createWorkoutSessionSchema_EC_memberIdWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                memberId: '  member-123  '
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('member-123');
            }
        });

        it('createWorkoutSessionSchema_EC_dateWrongFormat_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                ...VALID_SESSION,
                date: '01/01/2024'
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('createWorkoutSessionSchema_EC_notesWhitespaceOnly_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: '     '
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('createWorkoutSessionSchema_EC_notesWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: '  some notes  '
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('some notes');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createWorkoutSessionSchema_BVA_memberId0Chars_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                ...VALID_SESSION,
                memberId: ''
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
            }
        });

        it('createWorkoutSessionSchema_BVA_memberId1Char_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                memberId: 'A'
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('A');
            }
        });

        it('createWorkoutSessionSchema_BVA_memberId2Chars_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                memberId: 'AB'
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('AB');
            }
        });

        it('createWorkoutSessionSchema_BVA_memberIdPadded1CharAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                memberId: ' A '
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('A');
            }
        });

        it('createWorkoutSessionSchema_BVA_durationMinus1_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                ...VALID_SESSION,
                duration: -1
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('createWorkoutSessionSchema_BVA_duration0_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                duration: 0
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(0);
            }
        });

        it('createWorkoutSessionSchema_BVA_duration1_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                duration: 1
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(1);
            }
        });

        it('createWorkoutSessionSchema_BVA_duration179_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                duration: 179
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(179);
            }
        });

        it('createWorkoutSessionSchema_BVA_duration180_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                duration: 180
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(180);
            }
        });

        it('createWorkoutSessionSchema_BVA_duration181_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                ...VALID_SESSION,
                duration: 181
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('createWorkoutSessionSchema_BVA_notes0Chars_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: ''
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('createWorkoutSessionSchema_BVA_notes1Char_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: 'A'
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A');
            }
        });

        it('createWorkoutSessionSchema_BVA_notes1023Chars_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: 'A'.repeat(1023)
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1023));
            }
        });

        it('createWorkoutSessionSchema_BVA_notes1024Chars_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: 'A'.repeat(1024)
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1024));
            }
        });

        it('createWorkoutSessionSchema_BVA_notes1025Chars_returnsValidationError', () => {
            // Arrange
            const inputSession = {
                ...VALID_SESSION,
                notes: 'A'.repeat(1025)
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
            }
        });

        it('createWorkoutSessionSchema_BVA_notesPadded1024CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: ' ' + 'A'.repeat(1024) + ' '
            };

            // Act
            const result = createWorkoutSessionSchema.safeParse(inputSession);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1024));
            }
        });
    });
});

describe('workoutSessionExerciseSchema', () => {
    describe('Equivalence Classes', () => {
        it('workoutSessionExerciseSchema_EC_allFieldsValid_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: 'exercise-123',
                sets: 3,
                reps: 10,
                weight: 80.5,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputData);
            }
        });

        it('workoutSessionExerciseSchema_EC_missingExerciseId_returnsValidationError', () => {
            // Arrange
            const inputData = {sets: 3, reps: 10, weight: 80.5};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExerciseSchema_EC_exerciseIdWhitespace_returnsValidationError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: '   ',
                sets: 3,
                reps: 10,
                weight: 80.5,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExerciseSchema_EC_exerciseIdWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {
                exerciseId: '  exercise-123  ',
                sets: 3,
                reps: 10,
                weight: 80.5,
            };

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exerciseId).toBe('exercise-123');
            }
        });

        it('workoutSessionExerciseSchema_EC_invalidSetsType_returnsValidationError', () => {
            // Arrange
            const inputData = {exerciseId: 'exercise-123', sets: 'invalid', reps: 10, weight: 80.5};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseSchema_EC_invalidRepsType_returnsValidationError', () => {
            // Arrange
            const inputData = {exerciseId: 'exercise-123', sets: 3, reps: 'invalid', weight: 80.5};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseSchema_EC_invalidWeightType_returnsValidationError', () => {
            // Arrange
            const inputData = {exerciseId: 'exercise-123', sets: 3, reps: 10, weight: 'invalid'};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('workoutSessionExerciseSchema_BVA_setsMinus1_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, sets: -1};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseSchema_BVA_sets0_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, sets: 0};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sets).toBe(0);
            }
        });

        it('workoutSessionExerciseSchema_BVA_sets1_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, sets: 1};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sets).toBe(1);
            }
        });

        it('workoutSessionExerciseSchema_BVA_sets5_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, sets: 5};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sets).toBe(5);
            }
        });

        it('workoutSessionExerciseSchema_BVA_sets6_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, sets: 6};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sets).toBe(6);
            }
        });

        it('workoutSessionExerciseSchema_BVA_sets7_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, sets: 7};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseSchema_BVA_exerciseIdPadded1CharAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, exerciseId: ' E '};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exerciseId).toBe('E');
            }
        });

        it('workoutSessionExerciseSchema_BVA_repsMinus1_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, reps: -1};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseSchema_BVA_reps0_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, reps: 0};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reps).toBe(0);
            }
        });

        it('workoutSessionExerciseSchema_BVA_reps1_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, reps: 1};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reps).toBe(1);
            }
        });

        it('workoutSessionExerciseSchema_BVA_reps29_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, reps: 29};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reps).toBe(29);
            }
        });

        it('workoutSessionExerciseSchema_BVA_reps30_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, reps: 30};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reps).toBe(30);
            }
        });

        it('workoutSessionExerciseSchema_BVA_reps31_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, reps: 31};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseSchema_BVA_weightMinus0point1_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, weight: -0.1};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExerciseSchema_BVA_weight0_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, weight: 0};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.weight).toBe(0);
            }
        });

        it('workoutSessionExerciseSchema_BVA_weight0point1_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, weight: 0.1};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.weight).toBe(0.1);
            }
        });

        it('workoutSessionExerciseSchema_BVA_weight499point9_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, weight: 499.9};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.weight).toBe(499.9);
            }
        });

        it('workoutSessionExerciseSchema_BVA_weight500_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseInput = {...VALID_EXERCISE, weight: 500};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.weight).toBe(500);
            }
        });

        it('workoutSessionExerciseSchema_BVA_weight500point1_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, weight: 500.1};

            // Act
            const result = workoutSessionExerciseSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });
});

describe('workoutSessionExercisesSchema', () => {
    describe('Equivalence Classes', () => {
        it('workoutSessionExercisesSchema_EC_singleValidExercise_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputExercises);
            }
        });

        it('workoutSessionExercisesSchema_EC_multipleValidExercises_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE},
                {...VALID_EXERCISE, exerciseId: 'exercise-456'},
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
                expect(result.data[1].exerciseId).toBe('exercise-456');
            }
        });

        it('workoutSessionExercisesSchema_EC_emptyArray_returnsValidationError', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesSchema_EC_missingExerciseId_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {sets: 3, reps: 10, weight: 80.5}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain(0);
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExercisesSchema_EC_exerciseIdWhitespace_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, exerciseId: '   '}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExercisesSchema_EC_exerciseIdWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, exerciseId: '  exercise-123  '}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].exerciseId).toBe('exercise-123');
            }
        });

        it('workoutSessionExercisesSchema_EC_invalidSetsType_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, sets: 'invalid'}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesSchema_EC_invalidRepsType_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, reps: 'invalid'}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesSchema_EC_invalidWeightType_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, weight: 'invalid'}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('workoutSessionExercisesSchema_BVA_setsMinus1_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, sets: -1}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets0_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, sets: 0}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(0);
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets1_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, sets: 1}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(1);
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets5_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, sets: 5}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(5);
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets6_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, sets: 6}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(6);
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets7_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, sets: 7}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesSchema_BVA_exerciseIdPadded1CharAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, exerciseId: ' E '}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].exerciseId).toBe('E');
            }
        });

        it('workoutSessionExercisesSchema_BVA_repsMinus1_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, reps: -1}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps0_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, reps: 0}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(0);
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps1_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, reps: 1}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(1);
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps29_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, reps: 29}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(29);
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps30_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, reps: 30}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(30);
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps31_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, reps: 31}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesSchema_BVA_weightMinus0point1_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, weight: -0.1}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight0_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, weight: 0}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(0);
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight0point1_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, weight: 0.1}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(0.1);
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight499point9_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, weight: 499.9}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(499.9);
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight500_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, weight: 500}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(500);
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight500point1_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, weight: 500.1}
            ];

            // Act
            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });
});

describe('updateWorkoutSessionSchema', () => {
    describe('Equivalence Classes', () => {
        it('updateWorkoutSessionSchema_EC_emptyObject_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {};

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({});
            }
        });

        it('updateWorkoutSessionSchema_EC_validDateOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                date: '2024-06-15'
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.date).toBe('2024-06-15');
            }
        });

        it('updateWorkoutSessionSchema_EC_validDurationOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 45
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(45);
            }
        });

        it('updateWorkoutSessionSchema_EC_validNotesOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: 'Updated notes'
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('Updated notes');
            }
        });

        it('updateWorkoutSessionSchema_EC_dateFormatWrong_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                date: '01/01/2024'
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('updateWorkoutSessionSchema_EC_notesWhitespaceOnly_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: '     '
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('updateWorkoutSessionSchema_EC_notesWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: '  updated notes  '
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('updated notes');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWorkoutSessionSchema_BVA_durationMinus1_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                duration: -1
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration0_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 0
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(0);
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration1_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 1
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(1);
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration179_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 179
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(179);
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration180_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 180
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(180);
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration181_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                duration: 181
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes0Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: ''
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes1Char_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: 'A'
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A');
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes1023Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: 'A'.repeat(1023)
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1023));
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes1024Chars_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: 'A'.repeat(1024)
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1024));
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes1025Chars_returnsValidationError', () => {
            // Arrange
            const inputUpdate = {
                notes: 'A'.repeat(1025)
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
            }
        });

        it('updateWorkoutSessionSchema_BVA_notesPadded1024CharsAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: ' ' + 'A'.repeat(1024) + ' '
            };

            // Act
            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1024));
            }
        });
    });
});

describe('workoutSessionExerciseUpdateSchema', () => {
    describe('Equivalence Classes', () => {
        it('workoutSessionExerciseUpdateSchema_EC_idAbsent_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: 'exercise-123',
                sets: 3,
                reps: 10,
                weight: 80.5,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputData);
            }
        });

        it('workoutSessionExerciseUpdateSchema_EC_idPresent_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                id: 'uuid-123',
                exerciseId: 'exercise-123',
                sets: 3,
                reps: 10,
                weight: 80.5,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.id).toBe('uuid-123');
            }
        });

        it('workoutSessionExerciseUpdateSchema_EC_idNotString_returnsValidationError', () => {
            // Arrange
            const inputData = {
                id: 123,
                exerciseId: 'exercise-123',
                sets: 3,
                reps: 10,
                weight: 80.5,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('id');
            }
        });

        it('workoutSessionExerciseUpdateSchema_EC_missingExerciseId_returnsValidationError', () => {
            // Arrange
            const inputData = {sets: 3, reps: 10, weight: 80.5};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExerciseUpdateSchema_EC_exerciseIdWhitespace_returnsValidationError', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: '   ',
                sets: 3,
                reps: 10,
                weight: 80.5,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExerciseUpdateSchema_EC_exerciseIdWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {
                exerciseId: '  exercise-123  ',
                sets: 3,
                reps: 10,
                weight: 80.5,
            };

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exerciseId).toBe('exercise-123');
            }
        });

        it('workoutSessionExerciseUpdateSchema_EC_invalidSetsType_returnsValidationError', () => {
            // Arrange
            const inputData = {exerciseId: 'exercise-123', sets: 'invalid', reps: 10, weight: 80.5};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseUpdateSchema_EC_invalidRepsType_returnsValidationError', () => {
            // Arrange
            const inputData = {exerciseId: 'exercise-123', sets: 3, reps: 'invalid', weight: 80.5};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseUpdateSchema_EC_invalidWeightType_returnsValidationError', () => {
            // Arrange
            const inputData = {exerciseId: 'exercise-123', sets: 3, reps: 10, weight: 'invalid'};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('workoutSessionExerciseUpdateSchema_BVA_setsMinus1_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, sets: -1};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_sets0_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, sets: 0};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sets).toBe(0);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_sets1_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, sets: 1};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sets).toBe(1);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_sets5_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, sets: 5};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sets).toBe(5);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_sets6_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, sets: 6};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.sets).toBe(6);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_sets7_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, sets: 7};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_exerciseIdPadded1CharAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, exerciseId: ' E '};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.exerciseId).toBe('E');
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_repsMinus1_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, reps: -1};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_reps0_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, reps: 0};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reps).toBe(0);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_reps1_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, reps: 1};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reps).toBe(1);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_reps29_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, reps: 29};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reps).toBe(29);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_reps30_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, reps: 30};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.reps).toBe(30);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_reps31_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, reps: 31};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_weightMinus0point1_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, weight: -0.1};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_weight0_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, weight: 0};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.weight).toBe(0);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_weight0point1_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, weight: 0.1};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.weight).toBe(0.1);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_weight499point9_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, weight: 499.9};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.weight).toBe(499.9);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_weight500_parsesSuccessfully', () => {
            // Arrange
            const inputData: WorkoutSessionExerciseUpdateInput = {...VALID_EXERCISE, weight: 500};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.weight).toBe(500);
            }
        });

        it('workoutSessionExerciseUpdateSchema_BVA_weight500point1_returnsValidationError', () => {
            // Arrange
            const inputData = {...VALID_EXERCISE, weight: 500.1};

            // Act
            const result = workoutSessionExerciseUpdateSchema.safeParse(inputData);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });
});

describe('workoutSessionExercisesUpdateSchema', () => {
    describe('Equivalence Classes', () => {
        it('workoutSessionExercisesUpdateSchema_EC_validWithoutId_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputExercises);
            }
        });

        it('workoutSessionExercisesUpdateSchema_EC_validWithId_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {id: 'uuid-123', ...VALID_EXERCISE}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].id).toBe('uuid-123');
            }
        });

        it('workoutSessionExercisesUpdateSchema_EC_emptyArray_returnsValidationError', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesUpdateSchema_EC_missingExerciseId_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {sets: 3, reps: 10, weight: 80.5}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExercisesUpdateSchema_EC_exerciseIdWithSurroundingWhitespace_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, exerciseId: '  exercise-123  '}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].exerciseId).toBe('exercise-123');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('workoutSessionExercisesUpdateSchema_BVA_setsMinus1_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, sets: -1}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets0_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, sets: 0}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(0);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets1_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, sets: 1}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(1);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets5_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, sets: 5}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(5);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets6_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, sets: 6}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(6);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets7_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, sets: 7}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_exerciseIdPadded1CharAfterTrim_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, exerciseId: ' E '}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].exerciseId).toBe('E');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_repsMinus1_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, reps: -1}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps0_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, reps: 0}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(0);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps1_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, reps: 1}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(1);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps29_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, reps: 29}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(29);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps30_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, reps: 30}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(30);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps31_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, reps: 31}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weightMinus0point1_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, weight: -0.1}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight0_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, weight: 0}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(0);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight0point1_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, weight: 0.1}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(0.1);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight499point9_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, weight: 499.9}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(499.9);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight500_parsesSuccessfully', () => {
            // Arrange
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, weight: 500}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(500);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight500point1_returnsValidationError', () => {
            // Arrange
            const inputExercises = [
                {...VALID_EXERCISE, weight: 500.1}
            ];

            // Act
            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            // Assert
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });
});
