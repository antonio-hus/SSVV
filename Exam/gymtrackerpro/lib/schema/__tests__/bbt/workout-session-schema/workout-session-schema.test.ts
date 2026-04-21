import {
    CreateWorkoutSessionInput,
    createWorkoutSessionSchema,
    UpdateWorkoutSessionInput,
    updateWorkoutSessionSchema,
    WorkoutSessionExerciseInput,
    workoutSessionExercisesSchema,
    WorkoutSessionExerciseUpdateInput,
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
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputSession);
            }
        });

        it('createWorkoutSessionSchema_EC_notesAbsent_parsesSuccessfully', () => {
            const inputSession = {
                memberId: 'member-123',
                date: '2024-01-01',
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe(inputSession.memberId);
                expect(result.data.notes).toBeUndefined();
            }
        });

        it('createWorkoutSessionSchema_EC_notesEmptyString_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: ''
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('createWorkoutSessionSchema_EC_missingMemberId_returnsValidationError', () => {
            const inputSession = {
                date: '2024-01-01',
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
            }
        });

        it('createWorkoutSessionSchema_EC_missingDate_returnsValidationError', () => {
            const inputSession = {
                memberId: 'member-123',
                duration: 60,
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('createWorkoutSessionSchema_EC_missingDuration_returnsValidationError', () => {
            const inputSession = {
                memberId: 'member-123',
                date: '2024-01-01',
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('createWorkoutSessionSchema_EC_memberIdWhitespace_returnsValidationError', () => {
            const inputSession = {
                ...VALID_SESSION,
                memberId: '   '
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
            }
        });

        it('createWorkoutSessionSchema_EC_memberIdWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                memberId: '  member-123  '
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('member-123');
            }
        });

        it('createWorkoutSessionSchema_EC_dateWrongFormat_returnsValidationError', () => {
            const inputSession = {
                ...VALID_SESSION,
                date: '01/01/2024'
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('createWorkoutSessionSchema_EC_notesWhitespaceOnly_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: '     '
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('createWorkoutSessionSchema_EC_notesWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: '  some notes  '
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('some notes');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('createWorkoutSessionSchema_BVA_memberId0Chars_returnsValidationError', () => {
            const inputSession = {
                ...VALID_SESSION,
                memberId: ''
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('memberId');
            }
        });

        it('createWorkoutSessionSchema_BVA_memberId1Char_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                memberId: 'A'
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('A');
            }
        });

        it('createWorkoutSessionSchema_BVA_memberId2Chars_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                memberId: 'AB'
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('AB');
            }
        });

        it('createWorkoutSessionSchema_BVA_memberIdPadded1CharAfterTrim_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                memberId: ' A '
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.memberId).toBe('A');
            }
        });

        it('createWorkoutSessionSchema_BVA_durationMinus1_returnsValidationError', () => {
            const inputSession = {
                ...VALID_SESSION,
                duration: -1
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('createWorkoutSessionSchema_BVA_duration0_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                duration: 0
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(0);
            }
        });

        it('createWorkoutSessionSchema_BVA_duration1_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                duration: 1
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(1);
            }
        });

        it('createWorkoutSessionSchema_BVA_duration179_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                duration: 179
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(179);
            }
        });

        it('createWorkoutSessionSchema_BVA_duration180_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                duration: 180
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(180);
            }
        });

        it('createWorkoutSessionSchema_BVA_duration181_returnsValidationError', () => {
            const inputSession = {
                ...VALID_SESSION,
                duration: 181
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('createWorkoutSessionSchema_BVA_notes0Chars_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: ''
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('createWorkoutSessionSchema_BVA_notes1Char_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: 'A'
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A');
            }
        });

        it('createWorkoutSessionSchema_BVA_notes1023Chars_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: 'A'.repeat(1023)
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1023));
            }
        });

        it('createWorkoutSessionSchema_BVA_notes1024Chars_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: 'A'.repeat(1024)
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1024));
            }
        });

        it('createWorkoutSessionSchema_BVA_notes1025Chars_returnsValidationError', () => {
            const inputSession = {
                ...VALID_SESSION,
                notes: 'A'.repeat(1025)
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
            }
        });

        it('createWorkoutSessionSchema_BVA_notesPadded1024CharsAfterTrim_parsesSuccessfully', () => {
            const inputSession: CreateWorkoutSessionInput = {
                ...VALID_SESSION,
                notes: ' ' + 'A'.repeat(1024) + ' '
            };

            const result = createWorkoutSessionSchema.safeParse(inputSession);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1024));
            }
        });
    });
});

describe('workoutSessionExercisesSchema', () => {
    describe('Equivalence Classes', () => {
        it('workoutSessionExercisesSchema_EC_singleValidExercise_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputExercises);
            }
        });

        it('workoutSessionExercisesSchema_EC_multipleValidExercises_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE},
                {...VALID_EXERCISE, exerciseId: 'exercise-456'},
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toHaveLength(2);
                expect(result.data[1].exerciseId).toBe('exercise-456');
            }
        });

        it('workoutSessionExercisesSchema_EC_emptyArray_returnsValidationError', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesSchema_EC_missingExerciseId_returnsValidationError', () => {
            const inputExercises = [
                {sets: 3, reps: 10, weight: 80.5}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain(0);
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExercisesSchema_EC_exerciseIdWhitespace_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, exerciseId: '   '}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExercisesSchema_EC_exerciseIdWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, exerciseId: '  exercise-123  '}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].exerciseId).toBe('exercise-123');
            }
        });

        it('workoutSessionExercisesSchema_EC_invalidSetsType_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, sets: 'invalid'}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesSchema_EC_invalidRepsType_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, reps: 'invalid'}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesSchema_EC_invalidWeightType_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, weight: 'invalid'}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('workoutSessionExercisesSchema_BVA_setsMinus1_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, sets: -1}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets0_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, sets: 0}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(0);
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets1_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, sets: 1}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(1);
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets5_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, sets: 5}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(5);
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets6_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, sets: 6}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(6);
            }
        });

        it('workoutSessionExercisesSchema_BVA_sets7_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, sets: 7}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesSchema_BVA_exerciseIdPadded1CharAfterTrim_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, exerciseId: ' E '}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].exerciseId).toBe('E');
            }
        });

        it('workoutSessionExercisesSchema_BVA_repsMinus1_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, reps: -1}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps0_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, reps: 0}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(0);
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps1_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, reps: 1}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(1);
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps29_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, reps: 29}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(29);
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps30_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, reps: 30}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(30);
            }
        });

        it('workoutSessionExercisesSchema_BVA_reps31_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, reps: 31}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesSchema_BVA_weightMinus0point1_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, weight: -0.1}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight0_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, weight: 0}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(0);
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight0point1_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, weight: 0.1}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(0.1);
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight499point9_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, weight: 499.9}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(499.9);
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight500_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseInput[] = [
                {...VALID_EXERCISE, weight: 500}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(500);
            }
        });

        it('workoutSessionExercisesSchema_BVA_weight500point1_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, weight: 500.1}
            ];

            const result = workoutSessionExercisesSchema.safeParse(inputExercises);

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
            const inputUpdate: UpdateWorkoutSessionInput = {};

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual({});
            }
        });

        it('updateWorkoutSessionSchema_EC_validDateOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                date: '2024-06-15'
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.date).toBe('2024-06-15');
            }
        });

        it('updateWorkoutSessionSchema_EC_validDurationOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 45
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(45);
            }
        });

        it('updateWorkoutSessionSchema_EC_validNotesOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: 'Updated notes'
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('Updated notes');
            }
        });

        it('updateWorkoutSessionSchema_EC_dateFormatWrong_returnsValidationError', () => {
            const inputUpdate = {
                date: '01/01/2024'
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('date');
            }
        });

        it('updateWorkoutSessionSchema_EC_notesWhitespaceOnly_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: '     '
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('updateWorkoutSessionSchema_EC_notesWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: '  updated notes  '
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('updated notes');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('updateWorkoutSessionSchema_BVA_durationMinus1_returnsValidationError', () => {
            const inputUpdate = {
                duration: -1
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration0_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 0
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(0);
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration1_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 1
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(1);
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration179_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 179
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(179);
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration180_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                duration: 180
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.duration).toBe(180);
            }
        });

        it('updateWorkoutSessionSchema_BVA_duration181_returnsValidationError', () => {
            const inputUpdate = {
                duration: 181
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('duration');
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes0Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: ''
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('');
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes1Char_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: 'A'
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A');
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes1023Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: 'A'.repeat(1023)
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1023));
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes1024Chars_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: 'A'.repeat(1024)
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1024));
            }
        });

        it('updateWorkoutSessionSchema_BVA_notes1025Chars_returnsValidationError', () => {
            const inputUpdate = {
                notes: 'A'.repeat(1025)
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('notes');
            }
        });

        it('updateWorkoutSessionSchema_BVA_notesPadded1024CharsAfterTrim_parsesSuccessfully', () => {
            const inputUpdate: UpdateWorkoutSessionInput = {
                notes: ' ' + 'A'.repeat(1024) + ' '
            };

            const result = updateWorkoutSessionSchema.safeParse(inputUpdate);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.notes).toBe('A'.repeat(1024));
            }
        });
    });
});

describe('workoutSessionExercisesUpdateSchema', () => {
    describe('Equivalence Classes', () => {
        it('workoutSessionExercisesUpdateSchema_EC_validWithoutId_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data).toEqual(inputExercises);
            }
        });

        it('workoutSessionExercisesUpdateSchema_EC_validWithId_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {id: 'uuid-123', ...VALID_EXERCISE}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].id).toBe('uuid-123');
            }
        });

        it('workoutSessionExercisesUpdateSchema_EC_emptyArray_returnsValidationError', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
        });

        it('workoutSessionExercisesUpdateSchema_EC_missingExerciseId_returnsValidationError', () => {
            const inputExercises = [
                {sets: 3, reps: 10, weight: 80.5}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('exerciseId');
            }
        });

        it('workoutSessionExercisesUpdateSchema_EC_exerciseIdWithSurroundingWhitespace_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, exerciseId: '  exercise-123  '}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].exerciseId).toBe('exercise-123');
            }
        });
    });

    describe('Boundary Value Analysis', () => {
        it('workoutSessionExercisesUpdateSchema_BVA_setsMinus1_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, sets: -1}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets0_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, sets: 0}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(0);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets1_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, sets: 1}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(1);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets5_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, sets: 5}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(5);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets6_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, sets: 6}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].sets).toBe(6);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_sets7_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, sets: 7}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('sets');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_exerciseIdPadded1CharAfterTrim_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, exerciseId: ' E '}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].exerciseId).toBe('E');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_repsMinus1_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, reps: -1}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps0_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, reps: 0}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(0);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps1_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, reps: 1}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(1);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps29_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, reps: 29}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(29);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps30_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, reps: 30}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].reps).toBe(30);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_reps31_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, reps: 31}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('reps');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weightMinus0point1_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, weight: -0.1}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight0_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, weight: 0}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(0);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight0point1_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, weight: 0.1}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(0.1);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight499point9_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, weight: 499.9}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(499.9);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight500_parsesSuccessfully', () => {
            const inputExercises: WorkoutSessionExerciseUpdateInput[] = [
                {...VALID_EXERCISE, weight: 500}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data[0].weight).toBe(500);
            }
        });

        it('workoutSessionExercisesUpdateSchema_BVA_weight500point1_returnsValidationError', () => {
            const inputExercises = [
                {...VALID_EXERCISE, weight: 500.1}
            ];

            const result = workoutSessionExercisesUpdateSchema.safeParse(inputExercises);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('weight');
            }
        });
    });
});
