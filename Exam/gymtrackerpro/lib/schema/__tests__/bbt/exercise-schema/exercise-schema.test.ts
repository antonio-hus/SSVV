import {Equipment, MuscleGroup} from "@/lib/domain/exercise";
import {CreateExerciseInput, createExerciseSchema, updateExerciseSchema} from '@/lib/schema/exercise-schema';

const VALID_EXERCISE: CreateExerciseInput = {
    name: 'Bench Press',
    description: 'Classic chest compound exercise with a barbell',
    muscleGroup: MuscleGroup.CHEST,
    equipmentNeeded: Equipment.BARBELL,
} as const;

describe('createExerciseSchema', () => {
    it('createExerciseSchema_allFieldsValid_parsesSuccessfully', () => {
        const inputValidExercise = {...VALID_EXERCISE};

        const result = createExerciseSchema.safeParse(inputValidExercise);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_descriptionAbsent_parsesSuccessfully', () => {
        const {description, ...inputWithoutDescription} = VALID_EXERCISE;

        const result = createExerciseSchema.safeParse(inputWithoutDescription);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_descriptionEmptyString_parsesSuccessfully', () => {
        const inputEmptyDescription = {...VALID_EXERCISE, description: ''};

        const result = createExerciseSchema.safeParse(inputEmptyDescription);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_nameAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinName = {...VALID_EXERCISE, name: 'PullDown'};

        const result = createExerciseSchema.safeParse(inputMinName);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_nameBelowLowerBoundary7Chars_returnsValidationError', () => {
        const inputShortName = {...VALID_EXERCISE, name: 'Squat-X'};

        const result = createExerciseSchema.safeParse(inputShortName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Name must be at least 8 characters')).toBe(true);
    });

    it('createExerciseSchema_nameAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxName = {...VALID_EXERCISE, name: 'E'.repeat(64)};

        const result = createExerciseSchema.safeParse(inputMaxName);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_nameAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongName = {...VALID_EXERCISE, name: 'E'.repeat(65)};

        const result = createExerciseSchema.safeParse(inputLongName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Name must be at most 64 characters')).toBe(true);
    });

    it('createExerciseSchema_descriptionAtUpperBoundary1024Chars_parsesSuccessfully', () => {
        const inputMaxDescription = {...VALID_EXERCISE, description: 'D'.repeat(1024)};

        const result = createExerciseSchema.safeParse(inputMaxDescription);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_descriptionAboveUpperBoundary1025Chars_returnsValidationError', () => {
        const inputLongDescription = {...VALID_EXERCISE, description: 'D'.repeat(1025)};

        const result = createExerciseSchema.safeParse(inputLongDescription);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Description must be at most 1024 characters')).toBe(true);
    });

    it('createExerciseSchema_muscleGroupCHEST_parsesSuccessfully', () => {
        const inputMuscleGroupChest = {...VALID_EXERCISE, muscleGroup: MuscleGroup.CHEST};

        const result = createExerciseSchema.safeParse(inputMuscleGroupChest);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_muscleGroupSHOULDERS_parsesSuccessfully', () => {
        const inputMuscleGroupShoulders = {...VALID_EXERCISE, muscleGroup: MuscleGroup.SHOULDERS};

        const result = createExerciseSchema.safeParse(inputMuscleGroupShoulders);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_muscleGroupARMS_parsesSuccessfully', () => {
        const inputMuscleGroupArms = {...VALID_EXERCISE, muscleGroup: MuscleGroup.ARMS};

        const result = createExerciseSchema.safeParse(inputMuscleGroupArms);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_muscleGroupBACK_parsesSuccessfully', () => {
        const inputMuscleGroupBack = {...VALID_EXERCISE, muscleGroup: MuscleGroup.BACK};

        const result = createExerciseSchema.safeParse(inputMuscleGroupBack);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_muscleGroupCORE_parsesSuccessfully', () => {
        const inputMuscleGroupCore = {...VALID_EXERCISE, muscleGroup: MuscleGroup.CORE};

        const result = createExerciseSchema.safeParse(inputMuscleGroupCore);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_muscleGroupLEGS_parsesSuccessfully', () => {
        const inputMuscleGroupLegs = {...VALID_EXERCISE, muscleGroup: MuscleGroup.LEGS};

        const result = createExerciseSchema.safeParse(inputMuscleGroupLegs);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_invalidMuscleGroup_returnsValidationError', () => {
        const inputInvalidMuscleGroup = {...VALID_EXERCISE, muscleGroup: 'GLUTES'};

        const result = createExerciseSchema.safeParse(inputInvalidMuscleGroup);

        expect(result.success).toBe(false);
    });

    it('createExerciseSchema_equipmentCABLE_parsesSuccessfully', () => {
        const inputEquipmentCable = {...VALID_EXERCISE, equipmentNeeded: Equipment.CABLE};

        const result = createExerciseSchema.safeParse(inputEquipmentCable);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_equipmentDUMBBELL_parsesSuccessfully', () => {
        const inputEquipmentDumbbell = {...VALID_EXERCISE, equipmentNeeded: Equipment.DUMBBELL};

        const result = createExerciseSchema.safeParse(inputEquipmentDumbbell);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_equipmentBARBELL_parsesSuccessfully', () => {
        const inputEquipmentBarbell = {...VALID_EXERCISE, equipmentNeeded: Equipment.BARBELL};

        const result = createExerciseSchema.safeParse(inputEquipmentBarbell);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_equipmentMACHINE_parsesSuccessfully', () => {
        const inputEquipmentMachine = {...VALID_EXERCISE, equipmentNeeded: Equipment.MACHINE};

        const result = createExerciseSchema.safeParse(inputEquipmentMachine);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_invalidEquipment_returnsValidationError', () => {
        const inputInvalidEquipment = {...VALID_EXERCISE, equipmentNeeded: 'KETTLEBELL'};

        const result = createExerciseSchema.safeParse(inputInvalidEquipment);

        expect(result.success).toBe(false);
    });

    it('createExerciseSchema_missingName_returnsValidationError', () => {
        const {name, ...inputWithoutName} = VALID_EXERCISE;

        const result = createExerciseSchema.safeParse(inputWithoutName);

        expect(result.success).toBe(false);
    });

    it('createExerciseSchema_missingMuscleGroup_returnsValidationError', () => {
        const {muscleGroup, ...inputWithoutMuscleGroup} = VALID_EXERCISE;

        const result = createExerciseSchema.safeParse(inputWithoutMuscleGroup);

        expect(result.success).toBe(false);
    });

    it('createExerciseSchema_missingEquipment_returnsValidationError', () => {
        const {equipmentNeeded, ...inputWithoutEquipment} = VALID_EXERCISE;

        const result = createExerciseSchema.safeParse(inputWithoutEquipment);

        expect(result.success).toBe(false);
    });

    it('createExerciseSchema_nameEmptyString_returnsValidationError', () => {
        const inputEmptyName = {...VALID_EXERCISE, name: ''};

        const result = createExerciseSchema.safeParse(inputEmptyName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Name must be at least 8 characters')).toBe(true);
    });

    it('createExerciseSchema_descriptionExactly1Char_parsesSuccessfully', () => {
        const inputOneCharDescription = {...VALID_EXERCISE, description: 'X'};

        const result = createExerciseSchema.safeParse(inputOneCharDescription);

        expect(result.success).toBe(true);
    });

    it('createExerciseSchema_descriptionExactly1023Chars_parsesSuccessfully', () => {
        const inputNearMaxDescription = {...VALID_EXERCISE, description: 'D'.repeat(1023)};

        const result = createExerciseSchema.safeParse(inputNearMaxDescription);

        expect(result.success).toBe(true);
    });
});

describe('updateExerciseSchema', () => {
    it('updateExerciseSchema_emptyObject_parsesSuccessfully', () => {
        const inputEmpty = {};

        const result = updateExerciseSchema.safeParse(inputEmpty);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_validNameProvided_parsesSuccessfully', () => {
        const inputName = {name: 'Overhead Press'};

        const result = updateExerciseSchema.safeParse(inputName);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_validDescriptionProvided_parsesSuccessfully', () => {
        const inputDescription = {description: 'Updated description for this exercise'};

        const result = updateExerciseSchema.safeParse(inputDescription);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_nameAtLowerBoundary8Chars_parsesSuccessfully', () => {
        const inputMinName = {name: 'LegPress'};

        const result = updateExerciseSchema.safeParse(inputMinName);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_nameBelowLowerBoundary7Chars_returnsValidationError', () => {
        const inputShortName = {name: 'RowExr'};

        const result = updateExerciseSchema.safeParse(inputShortName);

        expect(result.success).toBe(false);
    });

    it('updateExerciseSchema_nameAtUpperBoundary64Chars_parsesSuccessfully', () => {
        const inputMaxName = {name: 'E'.repeat(64)};

        const result = updateExerciseSchema.safeParse(inputMaxName);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_nameAboveUpperBoundary65Chars_returnsValidationError', () => {
        const inputLongName = {name: 'E'.repeat(65)};

        const result = updateExerciseSchema.safeParse(inputLongName);

        expect(result.success).toBe(false);
        expect(result.error?.issues.some(i => i.message === 'Name must be at most 64 characters')).toBe(true);
    });

    it('updateExerciseSchema_descriptionAt1024Chars_parsesSuccessfully', () => {
        const inputMaxDescription = {description: 'X'.repeat(1024)};

        const result = updateExerciseSchema.safeParse(inputMaxDescription);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_descriptionAbove1024Chars_returnsValidationError', () => {
        const inputLongDescription = {description: 'X'.repeat(1025)};

        const result = updateExerciseSchema.safeParse(inputLongDescription);

        expect(result.success).toBe(false);
    });

    it('updateExerciseSchema_validMuscleGroup_parsesSuccessfully', () => {
        const inputMuscleGroup = {muscleGroup: MuscleGroup.CHEST};

        const result = updateExerciseSchema.safeParse(inputMuscleGroup);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_invalidMuscleGroup_returnsValidationError', () => {
        const inputInvalidMuscleGroup = {muscleGroup: 'BICEP'};

        const result = updateExerciseSchema.safeParse(inputInvalidMuscleGroup);

        expect(result.success).toBe(false);
    });

    it('updateExerciseSchema_validEquipment_parsesSuccessfully', () => {
        const inputEquipment = {equipmentNeeded: Equipment.BARBELL};

        const result = updateExerciseSchema.safeParse(inputEquipment);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_invalidEquipment_returnsValidationError', () => {
        const inputInvalidEquipment = {equipmentNeeded: 'RESISTANCE_BAND'};

        const result = updateExerciseSchema.safeParse(inputInvalidEquipment);

        expect(result.success).toBe(false);
    });

    it('updateExerciseSchema_descriptionEmptyString_parsesSuccessfully', () => {
        const inputEmptyDescription = {description: ''};

        const result = updateExerciseSchema.safeParse(inputEmptyDescription);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_descriptionAbsent_parsesSuccessfully', () => {
        const inputUndefinedDescription = {description: undefined};

        const result = updateExerciseSchema.safeParse(inputUndefinedDescription);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_muscleGroupSHOULDERS_parsesSuccessfully', () => {
        const inputMuscleGroupShoulders = {muscleGroup: MuscleGroup.SHOULDERS};

        const result = updateExerciseSchema.safeParse(inputMuscleGroupShoulders);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_muscleGroupARMS_parsesSuccessfully', () => {
        const inputMuscleGroupArms = {muscleGroup: MuscleGroup.ARMS};

        const result = updateExerciseSchema.safeParse(inputMuscleGroupArms);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_muscleGroupBACK_parsesSuccessfully', () => {
        const inputMuscleGroupBack = {muscleGroup: MuscleGroup.BACK};

        const result = updateExerciseSchema.safeParse(inputMuscleGroupBack);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_muscleGroupCORE_parsesSuccessfully', () => {
        const inputMuscleGroupCore = {muscleGroup: MuscleGroup.CORE};

        const result = updateExerciseSchema.safeParse(inputMuscleGroupCore);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_muscleGroupLEGS_parsesSuccessfully', () => {
        const inputMuscleGroupLegs = {muscleGroup: MuscleGroup.LEGS};

        const result = updateExerciseSchema.safeParse(inputMuscleGroupLegs);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_equipmentCABLE_parsesSuccessfully', () => {
        const inputEquipmentCable = {equipmentNeeded: Equipment.CABLE};

        const result = updateExerciseSchema.safeParse(inputEquipmentCable);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_equipmentDUMBBELL_parsesSuccessfully', () => {
        const inputEquipmentDumbbell = {equipmentNeeded: Equipment.DUMBBELL};

        const result = updateExerciseSchema.safeParse(inputEquipmentDumbbell);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_equipmentMACHINE_parsesSuccessfully', () => {
        const inputEquipmentMachine = {equipmentNeeded: Equipment.MACHINE};

        const result = updateExerciseSchema.safeParse(inputEquipmentMachine);

        expect(result.success).toBe(true);
    });

    it('updateExerciseSchema_nameEmptyString_returnsValidationError', () => {
        const inputEmptyName = {name: ''};

        const result = updateExerciseSchema.safeParse(inputEmptyName);

        expect(result.success).toBe(false);
    });
});