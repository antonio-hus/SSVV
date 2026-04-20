import {
    CreateWorkoutSessionInput,
    createWorkoutSessionSchema,
    updateWorkoutSessionSchema, WorkoutSessionExerciseInput,
    workoutSessionExercisesSchema,
    workoutSessionExercisesUpdateSchema,
} from '@/lib/schema/workout-session-schema';

const VALID_SESSION: CreateWorkoutSessionInput = {
    memberId: 'member-abc-123',
    date: '2024-06-15',
    duration: 60,
    notes: 'Great session – personal record on squats.',
} as const;

const VALID_EXERCISE_ENTRY: WorkoutSessionExerciseInput = {
    exerciseId: 'exercise-xyz-456',
    sets: 3,
    reps: 10,
    weight: 80.0,
} as const;

describe('createWorkoutSessionSchema', () => {
    it('createWorkoutSessionSchema_allFieldsValid_parsesSuccessfully', () => {
        const inputValidSession = {...VALID_SESSION};

        const result = createWorkoutSessionSchema.safeParse(inputValidSession);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_notesAbsent_parsesSuccessfully', () => {
        const {notes, ...inputWithoutNotes} = VALID_SESSION;

        const result = createWorkoutSessionSchema.safeParse(inputWithoutNotes);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_emptyMemberId_returnsValidationError', () => {
        const inputEmptyMemberId = {...VALID_SESSION, memberId: ''};

        const result = createWorkoutSessionSchema.safeParse(inputEmptyMemberId);

        expect(result.success).toBe(false);
    });

    it('createWorkoutSessionSchema_missingMemberId_returnsValidationError', () => {
        const {memberId, ...inputWithoutMemberId} = VALID_SESSION;

        const result = createWorkoutSessionSchema.safeParse(inputWithoutMemberId);

        expect(result.success).toBe(false);
    });

    it('createWorkoutSessionSchema_dateWrongFormat_returnsValidationError', () => {
        const inputSlashDate = {...VALID_SESSION, date: '15/06/2024'};

        const result = createWorkoutSessionSchema.safeParse(inputSlashDate);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Date must be in YYYY-MM-DD format')).toBe(true);
    });

    it('createWorkoutSessionSchema_missingDate_returnsValidationError', () => {
        const {date, ...inputWithoutDate} = VALID_SESSION;

        const result = createWorkoutSessionSchema.safeParse(inputWithoutDate);

        expect(result.success).toBe(false);
    });

    it('createWorkoutSessionSchema_durationAtLowerBoundary0_parsesSuccessfully', () => {
        const inputMinDuration = {...VALID_SESSION, duration: 0};

        const result = createWorkoutSessionSchema.safeParse(inputMinDuration);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_durationBelowLowerBoundaryMinus1_returnsValidationError', () => {
        const inputNegativeDuration = {...VALID_SESSION, duration: -1};

        const result = createWorkoutSessionSchema.safeParse(inputNegativeDuration);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Duration must be greater or equal to 0')).toBe(true);
    });

    it('createWorkoutSessionSchema_durationAtUpperBoundary180_parsesSuccessfully', () => {
        const inputMaxDuration = {...VALID_SESSION, duration: 180};

        const result = createWorkoutSessionSchema.safeParse(inputMaxDuration);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_durationAboveUpperBoundary181_returnsValidationError', () => {
        const inputExceedingDuration = {...VALID_SESSION, duration: 181};

        const result = createWorkoutSessionSchema.safeParse(inputExceedingDuration);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Duration must be at most 180 minutes')).toBe(true);
    });

    it('createWorkoutSessionSchema_notesAtUpperBoundary1024Chars_parsesSuccessfully', () => {
        const inputMaxNotes = {...VALID_SESSION, notes: 'N'.repeat(1024)};

        const result = createWorkoutSessionSchema.safeParse(inputMaxNotes);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_notesAboveUpperBoundary1025Chars_returnsValidationError', () => {
        const inputLongNotes = {...VALID_SESSION, notes: 'N'.repeat(1025)};

        const result = createWorkoutSessionSchema.safeParse(inputLongNotes);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Notes must be at most 1024 characters')).toBe(true);
    });

    it('createWorkoutSessionSchema_notesEmptyString_parsesSuccessfully', () => {
        const inputEmptyNotes = {...VALID_SESSION, notes: ''};

        const result = createWorkoutSessionSchema.safeParse(inputEmptyNotes);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_missingDuration_returnsValidationError', () => {
        const {duration, ...inputWithoutDuration} = VALID_SESSION;

        const result = createWorkoutSessionSchema.safeParse(inputWithoutDuration);

        expect(result.success).toBe(false);
    });

    it('createWorkoutSessionSchema_memberIdWhitespaceOnly_returnsValidationError', () => {
        const inputWhitespaceMemberId = {...VALID_SESSION, memberId: '   '};

        const result = createWorkoutSessionSchema.safeParse(inputWhitespaceMemberId);

        expect(result.success).toBe(false);
    });

    it('createWorkoutSessionSchema_durationExactly1_parsesSuccessfully', () => {
        const inputOneDuration = {...VALID_SESSION, duration: 1};

        const result = createWorkoutSessionSchema.safeParse(inputOneDuration);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_durationExactly179_parsesSuccessfully', () => {
        const inputNearMaxDuration = {...VALID_SESSION, duration: 179};

        const result = createWorkoutSessionSchema.safeParse(inputNearMaxDuration);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_notesExactly1Char_parsesSuccessfully', () => {
        const inputOneCharNotes = {...VALID_SESSION, notes: 'X'};

        const result = createWorkoutSessionSchema.safeParse(inputOneCharNotes);

        expect(result.success).toBe(true);
    });

    it('createWorkoutSessionSchema_memberIdMinLength1Char_parsesSuccessfully', () => {
        const inputMinMemberId = {...VALID_SESSION, memberId: 'a'};

        const result = createWorkoutSessionSchema.safeParse(inputMinMemberId);

        expect(result.success).toBe(true);
    });
});

describe('workoutSessionExercisesSchema', () => {
    it('workoutSessionExercisesSchema_singleValidExercise_parsesSuccessfully', () => {
        const inputSingleExercise = [{...VALID_EXERCISE_ENTRY}];

        const result = workoutSessionExercisesSchema.safeParse(inputSingleExercise);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_multipleValidExercises_parsesSuccessfully', () => {
        const inputMultipleExercises = [
            {...VALID_EXERCISE_ENTRY},
            {exerciseId: 'ex-2', sets: 4, reps: 8, weight: 100.0},
            {exerciseId: 'ex-3', sets: 2, reps: 15, weight: 20.5},
        ];

        const result = workoutSessionExercisesSchema.safeParse(inputMultipleExercises);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_emptyArray_returnsValidationError', () => {
        const inputEmptyArray: never[] = [];

        const result = workoutSessionExercisesSchema.safeParse(inputEmptyArray);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'At least one exercise is required')).toBe(true);
    });

    it('workoutSessionExercisesSchema_setsAtLowerBoundary0_parsesSuccessfully', () => {
        const inputMinSets = [{...VALID_EXERCISE_ENTRY, sets: 0}];

        const result = workoutSessionExercisesSchema.safeParse(inputMinSets);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_setsBelowLowerBoundaryMinus1_returnsValidationError', () => {
        const inputNegativeSets = [{...VALID_EXERCISE_ENTRY, sets: -1}];

        const result = workoutSessionExercisesSchema.safeParse(inputNegativeSets);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Sets must be greater or equal to 0')).toBe(true);
    });

    it('workoutSessionExercisesSchema_setsAtUpperBoundary6_parsesSuccessfully', () => {
        const inputMaxSets = [{...VALID_EXERCISE_ENTRY, sets: 6}];

        const result = workoutSessionExercisesSchema.safeParse(inputMaxSets);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_setsAboveUpperBoundary7_returnsValidationError', () => {
        const inputExceedingSets = [{...VALID_EXERCISE_ENTRY, sets: 7}];

        const result = workoutSessionExercisesSchema.safeParse(inputExceedingSets);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Sets must be at most 6')).toBe(true);
    });

    it('workoutSessionExercisesSchema_repsAtLowerBoundary0_parsesSuccessfully', () => {
        const inputMinReps = [{...VALID_EXERCISE_ENTRY, reps: 0}];

        const result = workoutSessionExercisesSchema.safeParse(inputMinReps);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_repsBelowLowerBoundaryMinus1_returnsValidationError', () => {
        const inputNegativeReps = [{...VALID_EXERCISE_ENTRY, reps: -1}];

        const result = workoutSessionExercisesSchema.safeParse(inputNegativeReps);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Reps must be greater or equal to 0')).toBe(true);
    });

    it('workoutSessionExercisesSchema_repsAtUpperBoundary30_parsesSuccessfully', () => {
        const inputMaxReps = [{...VALID_EXERCISE_ENTRY, reps: 30}];

        const result = workoutSessionExercisesSchema.safeParse(inputMaxReps);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_repsAboveUpperBoundary31_returnsValidationError', () => {
        const inputExceedingReps = [{...VALID_EXERCISE_ENTRY, reps: 31}];

        const result = workoutSessionExercisesSchema.safeParse(inputExceedingReps);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Reps must be at most 30')).toBe(true);
    });

    it('workoutSessionExercisesSchema_weightAtLowerBoundary0_parsesSuccessfully', () => {
        const inputMinWeight = [{...VALID_EXERCISE_ENTRY, weight: 0}];

        const result = workoutSessionExercisesSchema.safeParse(inputMinWeight);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_weightAtUpperBoundary500_parsesSuccessfully', () => {
        const inputMaxWeight = [{...VALID_EXERCISE_ENTRY, weight: 500.0}];

        const result = workoutSessionExercisesSchema.safeParse(inputMaxWeight);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_weightAboveUpperBoundary500point1_returnsValidationError', () => {
        const inputExceedingWeight = [{...VALID_EXERCISE_ENTRY, weight: 500.1}];

        const result = workoutSessionExercisesSchema.safeParse(inputExceedingWeight);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Weight must be at most 500.0')).toBe(true);
    });

    it('workoutSessionExercisesSchema_weightBelowLowerBoundaryNegative_returnsValidationError', () => {
        const inputNegativeWeight = [{...VALID_EXERCISE_ENTRY, weight: -0.1}];

        const result = workoutSessionExercisesSchema.safeParse(inputNegativeWeight);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Weight must be greater or equal to 0.0')).toBe(true);
    });

    it('workoutSessionExercisesSchema_emptyExerciseId_returnsValidationError', () => {
        const inputEmptyExerciseId = [{...VALID_EXERCISE_ENTRY, exerciseId: ''}];

        const result = workoutSessionExercisesSchema.safeParse(inputEmptyExerciseId);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Exercise is required')).toBe(true);
    });

    it('workoutSessionExercisesSchema_missingExerciseId_returnsValidationError', () => {
        const {exerciseId, ...entryWithoutExerciseId} = VALID_EXERCISE_ENTRY;

        const result = workoutSessionExercisesSchema.safeParse([entryWithoutExerciseId]);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesSchema_missingSets_returnsValidationError', () => {
        const {sets, ...entryWithoutSets} = VALID_EXERCISE_ENTRY;

        const result = workoutSessionExercisesSchema.safeParse([entryWithoutSets]);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesSchema_missingReps_returnsValidationError', () => {
        const {reps, ...entryWithoutReps} = VALID_EXERCISE_ENTRY;

        const result = workoutSessionExercisesSchema.safeParse([entryWithoutReps]);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesSchema_missingWeight_returnsValidationError', () => {
        const {weight, ...entryWithoutWeight} = VALID_EXERCISE_ENTRY;

        const result = workoutSessionExercisesSchema.safeParse([entryWithoutWeight]);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesSchema_exerciseIdWhitespaceOnly_returnsValidationError', () => {
        const inputWhitespaceExerciseId = [{...VALID_EXERCISE_ENTRY, exerciseId: '   '}];

        const result = workoutSessionExercisesSchema.safeParse(inputWhitespaceExerciseId);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesSchema_setsJustAboveMin1_parsesSuccessfully', () => {
        const inputSets1 = [{...VALID_EXERCISE_ENTRY, sets: 1}];

        const result = workoutSessionExercisesSchema.safeParse(inputSets1);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_setsJustBelowMax5_parsesSuccessfully', () => {
        const inputSets5 = [{...VALID_EXERCISE_ENTRY, sets: 5}];

        const result = workoutSessionExercisesSchema.safeParse(inputSets5);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_repsJustAboveMin1_parsesSuccessfully', () => {
        const inputReps1 = [{...VALID_EXERCISE_ENTRY, reps: 1}];

        const result = workoutSessionExercisesSchema.safeParse(inputReps1);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_repsJustBelowMax29_parsesSuccessfully', () => {
        const inputReps29 = [{...VALID_EXERCISE_ENTRY, reps: 29}];

        const result = workoutSessionExercisesSchema.safeParse(inputReps29);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_weightJustAboveMin0point1_parsesSuccessfully', () => {
        const inputWeight0point1 = [{...VALID_EXERCISE_ENTRY, weight: 0.1}];

        const result = workoutSessionExercisesSchema.safeParse(inputWeight0point1);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesSchema_weightJustBelowMax499point9_parsesSuccessfully', () => {
        const inputWeight499point9 = [{...VALID_EXERCISE_ENTRY, weight: 499.9}];

        const result = workoutSessionExercisesSchema.safeParse(inputWeight499point9);

        expect(result.success).toBe(true);
    });
});

describe('updateWorkoutSessionSchema', () => {
    it('updateWorkoutSessionSchema_emptyObject_parsesSuccessfully', () => {
        const inputEmpty = {};

        const result = updateWorkoutSessionSchema.safeParse(inputEmpty);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_validDateProvided_parsesSuccessfully', () => {
        const inputDate = {date: '2024-09-01'};

        const result = updateWorkoutSessionSchema.safeParse(inputDate);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_dateWrongFormat_returnsValidationError', () => {
        const inputReversedDate = {date: '01-09-2024'};

        const result = updateWorkoutSessionSchema.safeParse(inputReversedDate);

        expect(result.success).toBe(false);
    });

    it('updateWorkoutSessionSchema_durationAtUpperBoundary180_parsesSuccessfully', () => {
        const inputMaxDuration = {duration: 180};

        const result = updateWorkoutSessionSchema.safeParse(inputMaxDuration);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_durationAboveUpperBoundary181_returnsValidationError', () => {
        const inputExceedingDuration = {duration: 181};

        const result = updateWorkoutSessionSchema.safeParse(inputExceedingDuration);

        expect(result.success).toBe(false);
    });

    it('updateWorkoutSessionSchema_durationAtLowerBoundary0_parsesSuccessfully', () => {
        const inputMinDuration = {duration: 0};

        const result = updateWorkoutSessionSchema.safeParse(inputMinDuration);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_durationBelowLowerBoundaryMinus1_returnsValidationError', () => {
        const inputNegativeDuration = {duration: -1};

        const result = updateWorkoutSessionSchema.safeParse(inputNegativeDuration);

        expect(result.success).toBe(false);
    });

    it('updateWorkoutSessionSchema_validDuration_parsesSuccessfully', () => {
        const inputDuration = {duration: 60};

        const result = updateWorkoutSessionSchema.safeParse(inputDuration);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_notesAt1024Chars_parsesSuccessfully', () => {
        const inputMaxNotes = {notes: 'U'.repeat(1024)};

        const result = updateWorkoutSessionSchema.safeParse(inputMaxNotes);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_notesAbove1024Chars_returnsValidationError', () => {
        const inputLongNotes = {notes: 'U'.repeat(1025)};

        const result = updateWorkoutSessionSchema.safeParse(inputLongNotes);

        expect(result.success).toBe(false);
    });

    it('updateWorkoutSessionSchema_validNotes_parsesSuccessfully', () => {
        const inputNotes = {notes: 'Recovery day, took it easy.'};

        const result = updateWorkoutSessionSchema.safeParse(inputNotes);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_durationExactly1_parsesSuccessfully', () => {
        const inputOneDuration = {duration: 1};

        const result = updateWorkoutSessionSchema.safeParse(inputOneDuration);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_durationExactly179_parsesSuccessfully', () => {
        const inputNearMaxDuration = {duration: 179};

        const result = updateWorkoutSessionSchema.safeParse(inputNearMaxDuration);

        expect(result.success).toBe(true);
    });

    it('updateWorkoutSessionSchema_notesEmptyString_parsesSuccessfully', () => {
        const inputEmptyNotes = {notes: ''};

        const result = updateWorkoutSessionSchema.safeParse(inputEmptyNotes);

        expect(result.success).toBe(true);
    });
});

describe('workoutSessionExercisesUpdateSchema', () => {
    it('workoutSessionExercisesUpdateSchema_newExerciseWithoutId_parsesSuccessfully', () => {
        const inputNewExercise = [{...VALID_EXERCISE_ENTRY}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputNewExercise);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_existingExerciseWithId_parsesSuccessfully', () => {
        const inputExistingExercise = [{id: 'session-ex-uuid-999', ...VALID_EXERCISE_ENTRY}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputExistingExercise);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_emptyArray_returnsValidationError', () => {
        const inputEmptyArray: never[] = [];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputEmptyArray);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_setsAboveMax7_returnsValidationError', () => {
        const inputExceedingSets = [{id: 'ex-id', ...VALID_EXERCISE_ENTRY, sets: 7}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputExceedingSets);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_setsAtUpperBoundary6_parsesSuccessfully', () => {
        const inputMaxSets = [{...VALID_EXERCISE_ENTRY, sets: 6}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputMaxSets);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_setsBelowLowerBoundaryMinus1_returnsValidationError', () => {
        const inputNegativeSets = [{...VALID_EXERCISE_ENTRY, sets: -1}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputNegativeSets);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_repsAboveMax31_returnsValidationError', () => {
        const inputExceedingReps = [{...VALID_EXERCISE_ENTRY, reps: 31}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputExceedingReps);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_repsBelowLowerBoundaryMinus1_returnsValidationError', () => {
        const inputNegativeReps = [{...VALID_EXERCISE_ENTRY, reps: -1}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputNegativeReps);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_weightAboveMax500point1_returnsValidationError', () => {
        const inputExceedingWeight = [{...VALID_EXERCISE_ENTRY, weight: 500.1}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputExceedingWeight);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_weightBelowLowerBoundaryNegative_returnsValidationError', () => {
        const inputNegativeWeight = [{...VALID_EXERCISE_ENTRY, weight: -0.1}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputNegativeWeight);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_setsAtLowerBoundary0_parsesSuccessfully', () => {
        const inputMinSets = [{...VALID_EXERCISE_ENTRY, sets: 0}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputMinSets);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_repsAtLowerBoundary0_parsesSuccessfully', () => {
        const inputMinReps = [{...VALID_EXERCISE_ENTRY, reps: 0}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputMinReps);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_repsAtUpperBoundary30_parsesSuccessfully', () => {
        const inputMaxReps = [{...VALID_EXERCISE_ENTRY, reps: 30}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputMaxReps);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_weightAtLowerBoundary0_parsesSuccessfully', () => {
        const inputMinWeight = [{...VALID_EXERCISE_ENTRY, weight: 0}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputMinWeight);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_weightAtUpperBoundary500_parsesSuccessfully', () => {
        const inputMaxWeight = [{...VALID_EXERCISE_ENTRY, weight: 500.0}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputMaxWeight);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_emptyExerciseId_returnsValidationError', () => {
        const inputEmptyExerciseId = [{...VALID_EXERCISE_ENTRY, exerciseId: ''}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputEmptyExerciseId);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_exerciseIdWhitespaceOnly_returnsValidationError', () => {
        const inputWhitespaceExerciseId = [{...VALID_EXERCISE_ENTRY, exerciseId: '   '}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputWhitespaceExerciseId);

        expect(result.success).toBe(false);
    });

    it('workoutSessionExercisesUpdateSchema_multipleExercisesMixed_parsesSuccessfully', () => {
        const inputMultiple = [
            {id: 'se-001', ...VALID_EXERCISE_ENTRY},
            {...VALID_EXERCISE_ENTRY, exerciseId: 'exercise-yyy-002', sets: 1, reps: 30, weight: 500.0},
        ];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputMultiple);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_setsJustAboveMin1_parsesSuccessfully', () => {
        const inputSets1 = [{...VALID_EXERCISE_ENTRY, sets: 1}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputSets1);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_setsJustBelowMax5_parsesSuccessfully', () => {
        const inputSets5 = [{...VALID_EXERCISE_ENTRY, sets: 5}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputSets5);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_repsJustAboveMin1_parsesSuccessfully', () => {
        const inputReps1 = [{...VALID_EXERCISE_ENTRY, reps: 1}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputReps1);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_repsJustBelowMax29_parsesSuccessfully', () => {
        const inputReps29 = [{...VALID_EXERCISE_ENTRY, reps: 29}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputReps29);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_weightJustAboveMin0point1_parsesSuccessfully', () => {
        const inputWeight0point1 = [{...VALID_EXERCISE_ENTRY, weight: 0.1}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputWeight0point1);

        expect(result.success).toBe(true);
    });

    it('workoutSessionExercisesUpdateSchema_weightJustBelowMax499point9_parsesSuccessfully', () => {
        const inputWeight499point9 = [{...VALID_EXERCISE_ENTRY, weight: 499.9}];

        const result = workoutSessionExercisesUpdateSchema.safeParse(inputWeight499point9);

        expect(result.success).toBe(true);
    });
});