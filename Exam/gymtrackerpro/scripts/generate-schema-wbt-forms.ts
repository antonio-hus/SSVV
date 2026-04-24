import * as path from 'path';
import { writeWbt, WbtDescriptor } from './generate-wbt-forms';

const ROOT  = path.resolve(__dirname, '..');
const BASE  = path.join(ROOT, 'lib', 'schema', '__tests__', 'wbt');

const createExerciseSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-01',
    statement: 'createExerciseSchema.safeParse(inputData) - validates the exercise data structure for creation.',
    data: 'Input: any',
    precondition: 'inputData is an object containing exercise fields.',
    results: 'Output: SafeParseSuccess<CreateExerciseInput> | SafeParseError<CreateExerciseInput>',
    postcondition: 'Return success result if all fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="name = name.trim()"   shape=box];
  S2       [label="description = description.trim()" shape=box];
  D1       [label="name is string?"      shape=diamond];
  D2       [label="name length >= 8?"    shape=diamond];
  D3       [label="name length <= 64?"   shape=diamond];
  D4       [label="description is string?" shape=diamond];
  D5       [label="description length <= 1024?" shape=diamond];
  D6       [label="description is undefined?" shape=diamond];
  D7       [label="muscleGroup in MuscleGroup?" shape=diamond];
  D8       [label="equipmentNeeded in Equipment?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mD7      [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> S1:n    [label="True"];
  D1:e     -> mFail:ne [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n    [label="True"];
  D2:e     -> mFail:ne [label="False"];
  D3:w     -> D4:n    [label="True"];
  D3:e     -> mFail:ne [label="False"];
  D4:w     -> S2:n    [label="True"];
  D4:e     -> D6:n    [label="False"];
  S2:s     -> D5:n;
  D5:w     -> mD7:nw  [label="True"];
  D5:e     -> mFail:ne [label="False"];
  D6:w     -> mD7:ne  [label="True"];
  D6:e     -> mFail:ne [label="False"];
  mD7      -> D7:n;
  D7:w     -> D8:n    [label="True"];
  D7:e     -> mFail:ne [label="False"];
  D8:w     -> retOk:n [label="True"];
  D8:e     -> mFail:ne [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const createExerciseSchema = z.object({',
        '    name: z.string().trim().min(8).max(64),',
        '    description: z.string().trim().max(1024).optional(),',
        '    muscleGroup: z.enum(Object.values(MuscleGroup)),',
        '    equipmentNeeded: z.enum(Object.values(Equipment)),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 9, cc2EdgeNodePlus2: 9, cc3PredicatePlus1: 9 },
    predicates: [
        'name is string (D1)', 'name length >= 8 (D2)', 'name length <= 64 (D3)',
        'description is string (D4)', 'description length <= 1024 (D5)', 'description is undefined (D6)',
        'muscleGroup is valid (D7)', 'equipmentNeeded is valid (D8)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> S2 -> D5(T) -> mD7 -> D7(T) -> D8(T) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> S2 -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(F) -> D6(T) -> mD7 -> D7(T) -> D8(T) -> retOk -> mExit -> exit' },
        { id: '7', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(F) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> S2 -> D5(T) -> mD7 -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> S2 -> D5(T) -> mD7 -> D7(T) -> D8(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'Valid CreateExerciseInput', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [false, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: 'name=123 (invalid type)', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'name="Short"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'name="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '5', inputData: 'description="A".repeat(1025)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '6', inputData: 'description=undefined', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [false, true], [false, false], [true, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '7', inputData: 'description=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [false, true], [false, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '8', inputData: 'muscleGroup="INVALID"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [false, false], [false, true], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '9', inputData: 'equipmentNeeded="INVALID"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [false, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is marked true for TC1 and TC2 as they reach retOk and retErr for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const updateExerciseSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-02',
    statement: 'updateExerciseSchema.safeParse(inputData) - validates partial exercise data for updates.',
    data: 'Input: any',
    precondition: 'inputData is an object containing optional exercise fields.',
    results: 'Output: SafeParseSuccess<UpdateExerciseInput> | SafeParseError<UpdateExerciseInput>',
    postcondition: 'Return success result if all provided fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="name = name.trim()"   shape=box];
  S2       [label="description = description.trim()" shape=box];
  D1       [label="name is undefined?"   shape=diamond];
  D2       [label="name is string?"      shape=diamond];
  D3       [label="name length >= 8?"    shape=diamond];
  D4       [label="name length <= 64?"   shape=diamond];
  D5       [label="description is undefined?" shape=diamond];
  D6       [label="description is string?" shape=diamond];
  D7       [label="description length <= 1024?" shape=diamond];
  D8       [label="muscleGroup is undefined?" shape=diamond];
  D9       [label="muscleGroup in MuscleGroup?" shape=diamond];
  D10      [label="equipmentNeeded is undefined?" shape=diamond];
  D11      [label="equipmentNeeded in Equipment?" shape=diamond];
  mName    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mDesc    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mMuscle  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mEquip   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> mName:nw [label="True"];
  D1:e     -> D2:n     [label="False"];
  D2:w     -> S1:n     [label="True"];
  D2:e     -> mFail:ne [label="False"];
  S1:s     -> D3:n;
  D3:w     -> D4:n     [label="True"];
  D3:e     -> mFail:ne [label="False"];
  D4:w     -> mName:ne [label="True"];
  D4:e     -> mFail:ne [label="False"];
  mName    -> D5:n;
  D5:w     -> mDesc:nw [label="True"];
  D5:e     -> D6:n     [label="False"];
  D6:w     -> S2:n     [label="True"];
  D6:e     -> mFail:ne [label="False"];
  S2:s     -> D7:n;
  D7:w     -> mDesc:ne [label="True"];
  D7:e     -> mFail:ne [label="False"];
  mDesc    -> D8:n;
  D8:w     -> mMuscle:nw [label="True"];
  D8:e     -> D9:n       [label="False"];
  D9:w     -> mMuscle:ne [label="True"];
  D9:e     -> mFail:ne   [label="False"];
  mMuscle  -> D10:n;
  D10:w    -> mEquip:nw  [label="True"];
  D10:e    -> D11:n      [label="False"];
  D11:w    -> mEquip:ne  [label="True"];
  D11:e    -> mFail:ne   [label="False"];
  mEquip   -> retOk:n;
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const updateExerciseSchema = z.object({',
        '    name: exerciseFields.name.optional(),',
        '    description: exerciseFields.description,',
        '    muscleGroup: exerciseFields.muscleGroup.optional(),',
        '    equipmentNeeded: exerciseFields.equipmentNeeded.optional(),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 12, cc2EdgeNodePlus2: 12, cc3PredicatePlus1: 12 },
    predicates: [
        'name undefined (D1)', 'name string (D2)', 'name min 8 (D3)', 'name max 64 (D4)',
        'desc undefined (D5)', 'desc string (D6)', 'desc max 1024 (D7)',
        'muscle undef (D8)', 'muscle valid (D9)', 'equip undef (D10)', 'equip valid (D11)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> mName -> D5(T) -> mDesc -> D8(T) -> mMuscle -> D10(T) -> mEquip -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(T) -> D4(T) -> mName -> D5(T) -> mDesc -> D8(T) -> mMuscle -> D10(T) -> mEquip -> retOk -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> mName -> D5(F) -> D6(T) -> S2 -> D7(T) -> mDesc -> D8(T) -> mMuscle -> D10(T) -> mEquip -> retOk -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> mName -> D5(T) -> mDesc -> D8(F) -> D9(T) -> mMuscle -> D10(T) -> mEquip -> retOk -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> mName -> D5(T) -> mDesc -> D8(T) -> mMuscle -> D10(F) -> D11(T) -> mEquip -> retOk -> mExit -> exit' },
        { id: '6', description: 'start -> D1(F) -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(T) -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9', description: 'start -> D1(T) -> mName -> D5(F) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> mName -> D5(F) -> D6(T) -> S2 -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> mName -> D5(T) -> mDesc -> D8(F) -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D1(T) -> mName -> D5(T) -> mDesc -> D8(T) -> mMuscle -> D10(F) -> D11(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'Empty object {}', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [true, false], [false, false]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: 'name="Bicep Curls"', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false], [true, false], [true, false], [false, false], [false, false], [true, false], [false, false], [true, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'description="Updated"', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [false, false], [true, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'muscleGroup=ARMS', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5', inputData: 'equipmentNeeded=DUMBBELL', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '6', inputData: 'name=123', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '7', inputData: 'name="Short"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '8', inputData: 'name="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '9', inputData: 'description=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '10', inputData: 'description="A".repeat(1025)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '11', inputData: 'muscleGroup="INVALID"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '12', inputData: 'equipmentNeeded="INVALID"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, true], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1, TC2, TC3, and TC6 as they reach retOk/retErr and S1/S2 for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const memberProgressReportSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-03',
    statement: 'memberProgressReportSchema.safeParse(inputData) - validates the progress report query parameters.',
    data: 'Input: any',
    precondition: 'inputData is an object containing memberId, startDate, and endDate.',
    results: 'Output: SafeParseSuccess<MemberProgressReportInput> | SafeParseError<MemberProgressReportInput>',
    postcondition: 'Return success result if all fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="memberId = memberId.trim()"   shape=box];
  D1       [label="memberId is string?"  shape=diamond];
  D2       [label="memberId length >= 1?" shape=diamond];
  D3       [label="startDate is string?" shape=diamond];
  D4       [label="startDate matches YYYY-MM-DD?" shape=diamond];
  D5       [label="endDate is string?"   shape=diamond];
  D6       [label="endDate matches YYYY-MM-DD?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> S1:n    [label="True"];
  D1:e     -> mFail:ne [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n    [label="True"];
  D2:e     -> mFail:ne [label="False"];
  D3:w     -> D4:n    [label="True"];
  D3:e     -> mFail:ne [label="False"];
  D4:w     -> D5:n    [label="True"];
  D4:e     -> mFail:ne [label="False"];
  D5:w     -> D6:n    [label="True"];
  D5:e     -> mFail:ne [label="False"];
  D6:w     -> retOk:n [label="True"];
  D6:e     -> mFail:ne [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const memberProgressReportSchema = z.object({',
        '    memberId: z.string().trim().min(1),',
        '    startDate: z.string().regex(isoDateRegex),',
        '    endDate: z.string().regex(isoDateRegex),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 7, cc2EdgeNodePlus2: 7, cc3PredicatePlus1: 7 },
    predicates: [
        'memberId is string (D1)', 'memberId not empty (D2)', 'startDate is string (D3)',
        'startDate matches YYYY-MM-DD (D4)', 'endDate is string (D5)', 'endDate matches YYYY-MM-DD (D6)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'memberId="m-123", startDate="2026-01-01", endDate="2026-01-31"', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: 'memberId=123', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'memberId="   "', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'startDate=2026', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false],
        },
        {
            noTc: '5', inputData: 'startDate="bad"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, true, false, false],
        },
        {
            noTc: '6', inputData: 'endDate=null', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [false, true], [false, false]],
            pathCoverage: [false, false, false, false, false, true, false],
        },
        {
            noTc: '7', inputData: 'endDate="bad"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is marked true for TC1 and TC2 as they reach retOk/retErr and S1 for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const createMemberSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-04',
    statement: 'createMemberSchema.safeParse(inputData) - validates member registration data including password strength.',
    data: 'Input: any',
    precondition: 'inputData is an object containing member fields.',
    results: 'Output: SafeParseSuccess<CreateMemberInput> | SafeParseError<CreateMemberInput>',
    postcondition: 'Return success result if all fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start  [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr [label="return {success: false, error}" shape=box];
  retOk  [label="return {success: true, data}"  shape=box];
  S1     [label="email = email.trim()"            shape=box];
  S2     [label="fullName = fullName.trim()"       shape=box];
  S3     [label="phone = phone.trim()"             shape=box];
  D1     [label="email is string?"                 shape=diamond];
  D2     [label="email matches emailRegex?"        shape=diamond];
  D3     [label="fullName is string?"              shape=diamond];
  D4     [label="fullName length >= 8?"            shape=diamond];
  D5     [label="fullName length <= 64?"           shape=diamond];
  D6     [label="phone is string?"                 shape=diamond];
  D7     [label="phone matches e164Regex?"         shape=diamond];
  D8     [label="dateOfBirth is string?"           shape=diamond];
  D9     [label="dateOfBirth matches isoRegex?"    shape=diamond];
  D10    [label="dateOfBirth is in past?"          shape=diamond];
  D11    [label="password is string?"              shape=diamond];
  D12    [label="password length >= 8?"            shape=diamond];
  D13    [label="password length <= 64?"           shape=diamond];
  D14    [label="password has uppercase?"          shape=diamond];
  D15    [label="password has digit?"              shape=diamond];
  D16    [label="password has special char?"       shape=diamond];
  D17    [label="membershipStart is string?"       shape=diamond];
  D18    [label="membershipStart matches isoRegex?" shape=diamond];
  mFail  [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit  [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start   -> D1:n;
  D1:w    -> S1:n      [label="True"];
  D1:e    -> mFail:ne  [label="False"];
  S1:s    -> D2:n;
  D2:w    -> D3:n      [label="True"];
  D2:e    -> mFail:ne  [label="False"];
  D3:w    -> S2:n      [label="True"];
  D3:e    -> mFail:ne  [label="False"];
  S2:s    -> D4:n;
  D4:w    -> D5:n      [label="True"];
  D4:e    -> mFail:ne  [label="False"];
  D5:w    -> D6:n      [label="True"];
  D5:e    -> mFail:ne  [label="False"];
  D6:w    -> S3:n      [label="True"];
  D6:e    -> mFail:ne  [label="False"];
  S3:s    -> D7:n;
  D7:w    -> D8:n      [label="True"];
  D7:e    -> mFail:ne  [label="False"];
  D8:w    -> D9:n      [label="True"];
  D8:e    -> mFail:ne  [label="False"];
  D9:w    -> D10:n     [label="True"];
  D9:e    -> mFail:ne  [label="False"];
  D10:w   -> D11:n     [label="True"];
  D10:e   -> mFail:ne  [label="False"];
  D11:w   -> D12:n     [label="True"];
  D11:e   -> mFail:ne  [label="False"];
  D12:w   -> D13:n     [label="True"];
  D12:e   -> mFail:ne  [label="False"];
  D13:w   -> D14:n     [label="True"];
  D13:e   -> mFail:ne  [label="False"];
  D14:w   -> D15:n     [label="True"];
  D14:e   -> mFail:ne  [label="False"];
  D15:w   -> D16:n     [label="True"];
  D15:e   -> mFail:ne  [label="False"];
  D16:w   -> D17:n     [label="True"];
  D16:e   -> mFail:ne  [label="False"];
  D17:w   -> D18:n     [label="True"];
  D17:e   -> mFail:ne  [label="False"];
  D18:w   -> retOk:n   [label="True"];
  D18:e   -> mFail:ne  [label="False"];
  mFail   -> retErr:n;
  retOk:s -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit   -> exit;
}`,
    cfgSourceCode: [
        'export const createMemberSchema = z.object({',
        '    email: z.string().trim().regex(emailRegex, "Invalid email address"),',
        '    fullName: z.string().trim().min(8, "Full name must be at least 8 characters").max(64, "Full name must be at most 64 characters"),',
        '    phone: z.string().trim().regex(e164PhoneRegex, "Phone number format is incorrect"),',
        '    dateOfBirth: z.string().regex(isoDateRegex, "Date of birth must be in YYYY-MM-DD format").refine(date => new Date(date) < new Date(), "Date of birth must be in the past"),',
        '    password: z.string().min(8).max(64).regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one digit").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),',
        '    membershipStart: z.string().regex(isoDateRegex, "Membership start date must be in YYYY-MM-DD format"),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 19, cc2EdgeNodePlus2: 19, cc3PredicatePlus1: 19 },
    predicates: [
        'email is string (D1)', 'email matches emailRegex (D2)',
        'fullName is string (D3)', 'fullName length >= 8 (D4)', 'fullName length <= 64 (D5)',
        'phone is string (D6)', 'phone matches e164Regex (D7)',
        'dateOfBirth is string (D8)', 'dateOfBirth matches isoRegex (D9)', 'dateOfBirth is in past (D10)',
        'password is string (D11)', 'password length >= 8 (D12)', 'password length <= 64 (D13)',
        'password has uppercase (D14)', 'password has digit (D15)', 'password has special char (D16)',
        'membershipStart is string (D17)', 'membershipStart matches isoRegex (D18)',
    ],
    paths: [
        { id: '1',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(T) -> D16(T) -> D17(T) -> D18(T) -> retOk -> exit' },
        { id: '2',  description: 'start -> D1(F) -> mFail -> retErr -> exit' },
        { id: '3',  description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> exit' },
        { id: '4',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> exit' },
        { id: '5',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(F) -> mFail -> retErr -> exit' },
        { id: '6',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(F) -> mFail -> retErr -> exit' },
        { id: '7',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> exit' },
        { id: '8',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(F) -> mFail -> retErr -> exit' },
        { id: '9',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(F) -> mFail -> retErr -> exit' },
        { id: '10', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(F) -> mFail -> retErr -> exit' },
        { id: '11', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(F) -> mFail -> retErr -> exit' },
        { id: '12', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(F) -> mFail -> retErr -> exit' },
        { id: '13', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(F) -> mFail -> retErr -> exit' },
        { id: '14', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(F) -> mFail -> retErr -> exit' },
        { id: '15', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(F) -> mFail -> retErr -> exit' },
        { id: '16', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(F) -> mFail -> retErr -> exit' },
        { id: '17', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(T) -> D16(F) -> mFail -> retErr -> exit' },
        { id: '18', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(T) -> D16(T) -> D17(F) -> mFail -> retErr -> exit' },
        { id: '19', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(T) -> D16(T) -> D17(T) -> D18(F) -> mFail -> retErr -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'All fields valid: email="test@example.com", fullName="John Doe Junior", phone="+1234567890", dateOfBirth="1990-01-01", password="Password1!", membershipStart="2026-01-01"',
            expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false]],
            pathCoverage: [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '2', inputData: 'email=123 (not a string)',
            expected: 'success: false, error: email', statementCoverage: true,
            conditionDecision: [[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '3', inputData: 'email="bad" (invalid format)',
            expected: 'success: false, error: email regex', statementCoverage: false,
            conditionDecision: [[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '4', inputData: 'fullName=123 (not a string)',
            expected: 'success: false, error: fullName', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '5', inputData: 'fullName="Short" (5 chars < 8)',
            expected: 'success: false, error: fullName min', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '6', inputData: 'fullName="A".repeat(65) (65 chars > 64)',
            expected: 'success: false, error: fullName max', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '7', inputData: 'phone=123 (not a string)',
            expected: 'success: false, error: phone', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '8', inputData: 'phone="abc" (invalid e164 format)',
            expected: 'success: false, error: phone regex', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '9', inputData: 'dateOfBirth=123 (not a string)',
            expected: 'success: false, error: dateOfBirth', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '10', inputData: 'dateOfBirth="01-01-1990" (wrong ISO format)',
            expected: 'success: false, error: dateOfBirth regex', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '11', inputData: 'dateOfBirth="2099-01-01" (future date)',
            expected: 'success: false, error: dateOfBirth refine', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '12', inputData: 'password=123 (not a string)',
            expected: 'success: false, error: password', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false],
        },
        {
            noTc: '13', inputData: 'password="Short1!" (7 chars < 8)',
            expected: 'success: false, error: password min', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false],
        },
        {
            noTc: '14', inputData: 'password="A".repeat(65) (65 chars > 64)',
            expected: 'success: false, error: password max', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false],
        },
        {
            noTc: '15', inputData: 'password="lowercase1!" (no uppercase)',
            expected: 'success: false, error: password uppercase regex', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false],
        },
        {
            noTc: '16', inputData: 'password="Uppercase!" (no digit)',
            expected: 'success: false, error: password digit regex', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false],
        },
        {
            noTc: '17', inputData: 'password="Uppercase1" (no special char)',
            expected: 'success: false, error: password special char regex', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false],
        },
        {
            noTc: '18', inputData: 'membershipStart=123 (not a string)',
            expected: 'success: false, error: membershipStart', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false],
        },
        {
            noTc: '19', inputData: 'membershipStart="01-01-2026" (wrong ISO format)',
            expected: 'success: false, error: membershipStart regex', statementCoverage: false,
            conditionDecision: [[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
        },
    ],
    remarks: [
        '1) statementCoverage is marked true for TC1 (S1, S2, S3, retOk - first to reach those statements) and TC2 (retErr - first to reach the error branch).',
    ],
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0, coveragePercent: '100%',
};

const updateMemberSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-05',
    statement: 'updateMemberSchema.safeParse(inputData) - validates partial member data for updates.',
    data: 'Input: any',
    precondition: 'inputData is an object containing optional member fields.',
    results: 'Output: SafeParseSuccess<UpdateMemberInput> | SafeParseError<UpdateMemberInput>',
    postcondition: 'Return success result if all provided fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="email = email.trim()"      shape=box];
  S2       [label="fullName = fullName.trim()" shape=box];
  S3       [label="phone = phone.trim()"       shape=box];
  D1       [label="email is undefined?"        shape=diamond];
  D2       [label="email is string?"           shape=diamond];
  D3       [label="email matches emailRegex?"  shape=diamond];
  D4       [label="fullName is undefined?"     shape=diamond];
  D5       [label="fullName is string?"        shape=diamond];
  D6       [label="fullName length >= 8?"      shape=diamond];
  D7       [label="fullName length <= 64?"     shape=diamond];
  D8       [label="phone is undefined?"        shape=diamond];
  D9       [label="phone is string?"           shape=diamond];
  D10      [label="phone matches e164Regex?"   shape=diamond];
  D11      [label="dateOfBirth is undefined?"  shape=diamond];
  D12      [label="dateOfBirth is string?"     shape=diamond];
  D13      [label="dateOfBirth matches isoRegex?" shape=diamond];
  D14      [label="dateOfBirth is in past?"    shape=diamond];
  D15      [label="password is undefined?"     shape=diamond];
  D16      [label="password is string?"        shape=diamond];
  D17      [label="password length >= 8?"      shape=diamond];
  D18      [label="password length <= 64?"     shape=diamond];
  D19      [label="password has uppercase?"    shape=diamond];
  D20      [label="password has digit?"        shape=diamond];
  D21      [label="password has special char?" shape=diamond];
  D22      [label="membershipStart is undefined?" shape=diamond];
  D23      [label="membershipStart is string?" shape=diamond];
  D24      [label="membershipStart matches isoRegex?" shape=diamond];
  mEmail   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mName    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mPhone   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mDob     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mPwd     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mStart   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> mEmail:nw  [label="True"];
  D1:e     -> D2:n       [label="False"];
  D2:w     -> S1:n       [label="True"];
  D2:e     -> mFail:ne   [label="False"];
  S1:s     -> D3:n;
  D3:w     -> mEmail:ne  [label="True"];
  D3:e     -> mFail:ne   [label="False"];
  mEmail   -> D4:n;
  D4:w     -> mName:nw   [label="True"];
  D4:e     -> D5:n       [label="False"];
  D5:w     -> S2:n       [label="True"];
  D5:e     -> mFail:ne   [label="False"];
  S2:s     -> D6:n;
  D6:w     -> D7:n       [label="True"];
  D6:e     -> mFail:ne   [label="False"];
  D7:w     -> mName:ne   [label="True"];
  D7:e     -> mFail:ne   [label="False"];
  mName    -> D8:n;
  D8:w     -> mPhone:nw  [label="True"];
  D8:e     -> D9:n       [label="False"];
  D9:w     -> S3:n       [label="True"];
  D9:e     -> mFail:ne   [label="False"];
  S3:s     -> D10:n;
  D10:w    -> mPhone:ne  [label="True"];
  D10:e    -> mFail:ne   [label="False"];
  mPhone   -> D11:n;
  D11:w    -> mDob:nw    [label="True"];
  D11:e    -> D12:n      [label="False"];
  D12:w    -> D13:n      [label="True"];
  D12:e    -> mFail:ne   [label="False"];
  D13:w    -> D14:n      [label="True"];
  D13:e    -> mFail:ne   [label="False"];
  D14:w    -> mDob:ne    [label="True"];
  D14:e    -> mFail:ne   [label="False"];
  mDob     -> D15:n;
  D15:w    -> mPwd:nw    [label="True"];
  D15:e    -> D16:n      [label="False"];
  D16:w    -> D17:n      [label="True"];
  D16:e    -> mFail:ne   [label="False"];
  D17:w    -> D18:n      [label="True"];
  D17:e    -> mFail:ne   [label="False"];
  D18:w    -> D19:n      [label="True"];
  D18:e    -> mFail:ne   [label="False"];
  D19:w    -> D20:n      [label="True"];
  D19:e    -> mFail:ne   [label="False"];
  D20:w    -> D21:n      [label="True"];
  D20:e    -> mFail:ne   [label="False"];
  D21:w    -> mPwd:ne    [label="True"];
  D21:e    -> mFail:ne   [label="False"];
  mPwd     -> D22:n;
  D22:w    -> mStart:nw  [label="True"];
  D22:e    -> D23:n      [label="False"];
  D23:w    -> D24:n      [label="True"];
  D23:e    -> mFail:ne   [label="False"];
  D24:w    -> mStart:ne  [label="True"];
  D24:e    -> mFail:ne   [label="False"];
  mStart   -> retOk:n;
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const updateMemberSchema = createMemberSchema.partial();',
    ],
    cyclomaticComplexity: { cc1Regions: 25, cc2EdgeNodePlus2: 25, cc3PredicatePlus1: 25 },
    predicates: [
        'email is undefined (D1)', 'email is string (D2)', 'email matches emailRegex (D3)',
        'fullName is undefined (D4)', 'fullName is string (D5)', 'fullName length >= 8 (D6)', 'fullName length <= 64 (D7)',
        'phone is undefined (D8)', 'phone is string (D9)', 'phone matches e164Regex (D10)',
        'dateOfBirth is undefined (D11)', 'dateOfBirth is string (D12)', 'dateOfBirth matches isoRegex (D13)', 'dateOfBirth is in past (D14)',
        'password is undefined (D15)', 'password is string (D16)', 'password length >= 8 (D17)', 'password length <= 64 (D18)',
        'password has uppercase (D19)', 'password has digit (D20)', 'password has special char (D21)',
        'membershipStart is undefined (D22)', 'membershipStart is string (D23)', 'membershipStart matches isoRegex (D24)',
    ],
    paths: [
        { id: '1',  description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(T) -> mPwd -> D22(T) -> mStart -> retOk -> exit  (empty object, all skipped)' },
        { id: '2',  description: 'start -> D1(F) -> D2(T) -> S1 -> D3(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(T) -> mPwd -> D22(T) -> mStart -> retOk -> exit  (email only, valid)' },
        { id: '3',  description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(T) -> D7(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(T) -> mPwd -> D22(T) -> mStart -> retOk -> exit  (fullName only, valid)' },
        { id: '4',  description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(T) -> S3 -> D10(T) -> mPhone -> D11(T) -> mDob -> D15(T) -> mPwd -> D22(T) -> mStart -> retOk -> exit  (phone only, valid)' },
        { id: '5',  description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(T) -> D14(T) -> mDob -> D15(T) -> mPwd -> D22(T) -> mStart -> retOk -> exit  (DOB only, valid)' },
        { id: '6',  description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(T) -> D21(T) -> mPwd -> D22(T) -> mStart -> retOk -> exit  (password only, valid)' },
        { id: '7',  description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(T) -> mPwd -> D22(F) -> D23(T) -> D24(T) -> mStart -> retOk -> exit  (membershipStart only, valid)' },
        { id: '8',  description: 'start -> D1(F) -> D2(F) -> mFail -> retErr -> exit  (email not a string)' },
        { id: '9',  description: 'start -> D1(F) -> D2(T) -> S1 -> D3(F) -> mFail -> retErr -> exit  (email invalid format)' },
        { id: '10', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(F) -> mFail -> retErr -> exit  (fullName not a string)' },
        { id: '11', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(F) -> mFail -> retErr -> exit  (fullName too short)' },
        { id: '12', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(T) -> D7(F) -> mFail -> retErr -> exit  (fullName too long)' },
        { id: '13', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(F) -> mFail -> retErr -> exit  (phone not a string)' },
        { id: '14', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(T) -> S3 -> D10(F) -> mFail -> retErr -> exit  (phone invalid format)' },
        { id: '15', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(F) -> mFail -> retErr -> exit  (DOB not a string)' },
        { id: '16', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(F) -> mFail -> retErr -> exit  (DOB invalid format)' },
        { id: '17', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(T) -> D14(F) -> mFail -> retErr -> exit  (DOB not in past)' },
        { id: '18', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(F) -> D16(F) -> mFail -> retErr -> exit  (password not a string)' },
        { id: '19', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(F) -> D16(T) -> D17(F) -> mFail -> retErr -> exit  (password too short)' },
        { id: '20', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(F) -> D16(T) -> D17(T) -> D18(F) -> mFail -> retErr -> exit  (password too long)' },
        { id: '21', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(F) -> mFail -> retErr -> exit  (password no uppercase)' },
        { id: '22', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(F) -> mFail -> retErr -> exit  (password no digit)' },
        { id: '23', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(T) -> D21(F) -> mFail -> retErr -> exit  (password no special)' },
        { id: '24', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(T) -> mPwd -> D22(F) -> D23(F) -> mFail -> retErr -> exit  (membershipStart not a string)' },
        { id: '25', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDob -> D15(T) -> mPwd -> D22(F) -> D23(T) -> D24(F) -> mFail -> retErr -> exit  (membershipStart invalid format)' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'Empty object {}',
            expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false]],
            pathCoverage: [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '2', inputData: 'email="test@example.com" only (valid)',
            expected: 'success: true', statementCoverage: true,
            conditionDecision: [[false,true],[true,false],[true,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false]],
            pathCoverage: [false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '3', inputData: 'fullName="John Doe Junior" only (valid)',
            expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true,false],[false,false],[false,false],[false,true],[true,false],[true,false],[true,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false]],
            pathCoverage: [false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '4', inputData: 'phone="+1234567890" only (valid)',
            expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[true,false],[true,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '5', inputData: 'dateOfBirth="1990-01-01" only (valid)',
            expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,true],[true,false],[true,false],[true,false],[true,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '6', inputData: 'password="Password1!" only (valid)',
            expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '7', inputData: 'membershipStart="2026-01-01" only (valid)',
            expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,true],[true,false],[true,false]],
            pathCoverage: [false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '8', inputData: 'email=123 (not a string)',
            expected: 'success: false, error: email', statementCoverage: true,
            conditionDecision: [[false,true],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '9', inputData: 'email="bad" (invalid format)',
            expected: 'success: false, error: email regex', statementCoverage: false,
            conditionDecision: [[false,true],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '10', inputData: 'fullName=123 (not a string)',
            expected: 'success: false, error: fullName', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[false,true],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '11', inputData: 'fullName="Short" (5 chars < 8)',
            expected: 'success: false, error: fullName min', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[false,true],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '12', inputData: 'fullName="A".repeat(65) (65 chars > 64)',
            expected: 'success: false, error: fullName max', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[false,true],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '13', inputData: 'phone=123 (not a string)',
            expected: 'success: false, error: phone', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '14', inputData: 'phone="abc" (invalid e164 format)',
            expected: 'success: false, error: phone regex', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '15', inputData: 'dateOfBirth=123 (not a string)',
            expected: 'success: false, error: dateOfBirth', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,true],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '16', inputData: 'dateOfBirth="01-01-1990" (wrong ISO format)',
            expected: 'success: false, error: dateOfBirth regex', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,true],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '17', inputData: 'dateOfBirth="2099-01-01" (future date)',
            expected: 'success: false, error: dateOfBirth refine', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,true],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false],
        },
        {
            noTc: '18', inputData: 'password=123 (not a string)',
            expected: 'success: false, error: password', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false],
        },
        {
            noTc: '19', inputData: 'password="S" (too short)',
            expected: 'success: false, error: password min', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false],
        },
        {
            noTc: '20', inputData: 'password="A".repeat(65) (too long)',
            expected: 'success: false, error: password max', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false,false],
        },
        {
            noTc: '21', inputData: 'password="low1!" (no uppercase)',
            expected: 'success: false, error: password uppercase', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false,false],
        },
        {
            noTc: '22', inputData: 'password="UP!" (no digit)',
            expected: 'success: false, error: password digit', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false],
        },
        {
            noTc: '23', inputData: 'password="UP1" (no special char)',
            expected: 'success: false, error: password special', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,true],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[false,false],[false,false],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false],
        },
        {
            noTc: '24', inputData: 'membershipStart=123 (not a string)',
            expected: 'success: false, error: membershipStart', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,true],[false,true],[false,false]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false],
        },
        {
            noTc: '25', inputData: 'membershipStart="bad" (invalid format)',
            expected: 'success: false, error: membershipStart regex', statementCoverage: false,
            conditionDecision: [[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[true,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,false],[false,true],[true,false],[false,true]],
            pathCoverage: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
        },
        {
            noTc: '26', inputData: 'All fields valid (full object)',
            expected: 'success: true', statementCoverage: false,
            conditionDecision: [[false,true],[true,false],[true,false],[false,true],[true,false],[true,false],[true,false],[false,true],[true,false],[true,false],[false,true],[true,false],[true,false],[true,false],[false,true],[true,false],[true,false],[true,false],[true,false],[true,false],[true,false],[false,true],[true,false],[true,false]],
            pathCoverage: [false,true,true,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        },
    ],
    remarks: [
        '1) statementCoverage is marked true for TC1 (retOk - first to reach it via empty object), TC2 (S1 - first trim of email), TC3 (S2 - first trim of fullName), TC4 (S3 - first trim of phone), and TC8 (retErr - first to reach the error branch).',
    ],
    tcsFailed: 0, bugsFound: 0, bugsFixed: 'n/a', retested: 'not yet', retestRun: 0, coveragePercent: '100%',
};

const loginUserSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-06',
    statement: 'loginUserSchema.safeParse(inputData) - validates user login credentials.',
    data: 'Input: any',
    precondition: 'inputData is an object containing email and password.',
    results: 'Output: SafeParseSuccess<LoginUserInput> | SafeParseError<LoginUserInput>',
    postcondition: 'Return success result if both fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="email = email.trim()"   shape=box];
  D1       [label="email is string?"       shape=diamond];
  D2       [label="email matches emailRegex?" shape=diamond];
  D3       [label="password is string?"    shape=diamond];
  D4       [label="password length >= 8?"  shape=diamond];
  D5       [label="password length <= 64?"  shape=diamond];
  D6       [label="password has Uppercase?" shape=diamond];
  D7       [label="password has Number?"    shape=diamond];
  D8       [label="password has Special char?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> S1:n    [label="True"];
  D1:e     -> mFail:ne [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n    [label="True"];
  D2:e     -> mFail:ne [label="False"];
  D3:w     -> D4:n    [label="True"];
  D3:e     -> mFail:ne [label="False"];
  D4:w     -> D5:n    [label="True"];
  D4:e     -> mFail:ne [label="False"];
  D5:w     -> D6:n    [label="True"];
  D5:e     -> mFail:ne [label="False"];
  D6:w     -> D7:n    [label="True"];
  D6:e     -> mFail:ne [label="False"];
  D7:w     -> D8:n    [label="True"];
  D7:e     -> mFail:ne [label="False"];
  D8:w     -> retOk:n [label="True"];
  D8:e     -> mFail:ne [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const loginUserSchema = z.object({',
        '    email: z.string().trim().regex(emailRegex, "Invalid email address"),',
        '    password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters").regex(/[A-Z]/, "Password must contain at least one uppercase character").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 9, cc2EdgeNodePlus2: 9, cc3PredicatePlus1: 9 },
    predicates: [
        'email is string (D1)', 'email matches regex (D2)', 'password is string (D3)',
        'password length >= 8 (D4)', 'password length <= 64 (D5)', 'password has uppercase (D6)',
        'password has number (D7)', 'password has special (D8)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'email="test@example.com", password="Password1!"', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: 'email=123', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'email="bad"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'password=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '5', inputData: 'password="Short1!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '6', inputData: 'password="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '7', inputData: 'password="lowercase1!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '8', inputData: 'password="Uppercase!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '9', inputData: 'password="Uppercase1"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 (S1, retOk) and TC2 (retErr) as they reach those statements for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const createUserSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-07',
    statement: 'createUserSchema.safeParse(inputData) - validates user data for creation.',
    data: 'Input: any',
    precondition: 'inputData is an object containing basic user fields.',
    results: 'Output: SafeParseSuccess<CreateUserInput> | SafeParseError<CreateUserInput>',
    postcondition: 'Return success result if all fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="email = email.trim()"   shape=box];
  S2       [label="fullName = fullName.trim()" shape=box];
  S3       [label="phone = phone.trim()"   shape=box];
  D1       [label="email string?"          shape=diamond];
  D2       [label="email matches emailRegex?" shape=diamond];
  D3       [label="fullName string?"       shape=diamond];
  D4       [label="fullName length >= 8?"  shape=diamond];
  D5       [label="fullName length <= 64?"  shape=diamond];
  D6       [label="phone string?"          shape=diamond];
  D7       [label="phone matches e164Regex?" shape=diamond];
  D8       [label="dateOfBirth string?"    shape=diamond];
  D9       [label="dateOfBirth matches isoRegex?" shape=diamond];
  D10      [label="dateOfBirth is in past?" shape=diamond];
  D11      [label="password string?"       shape=diamond];
  D12      [label="password length >= 8?"  shape=diamond];
  D13      [label="password length <= 64?"  shape=diamond];
  D14      [label="password has Uppercase?" shape=diamond];
  D15      [label="password has Number?"    shape=diamond];
  D16      [label="password has Special char?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> S1:n    [label="True"];
  D1:e     -> mFail:ne [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n    [label="True"];
  D2:e     -> mFail:ne [label="False"];
  D3:w     -> S2:n    [label="True"];
  D3:e     -> mFail:ne [label="False"];
  S2:s     -> D4:n;
  D4:w     -> D5:n    [label="True"];
  D4:e     -> mFail:ne [label="False"];
  D5:w     -> D6:n    [label="True"];
  D5:e     -> mFail:ne [label="False"];
  D6:w     -> S3:n    [label="True"];
  D6:e     -> mFail:ne [label="False"];
  S3:s     -> D7:n;
  D7:w     -> D8:n    [label="True"];
  D7:e     -> mFail:ne [label="False"];
  D8:w     -> D9:n    [label="True"];
  D8:e     -> mFail:ne [label="False"];
  D9:w     -> D10:n   [label="True"];
  D9:e     -> mFail:ne [label="False"];
  D10:w    -> D11:n   [label="True"];
  D10:e    -> mFail:ne [label="False"];
  D11:w    -> D12:n   [label="True"];
  D11:e    -> mFail:ne [label="False"];
  D12:w    -> D13:n   [label="True"];
  D12:e    -> mFail:ne [label="False"];
  D13:w    -> D14:n   [label="True"];
  D13:e    -> mFail:ne [label="False"];
  D14:w    -> D15:n   [label="True"];
  D14:e    -> mFail:ne [label="False"];
  D15:w    -> D16:n   [label="True"];
  D15:e    -> mFail:ne [label="False"];
  D16:w    -> retOk:n [label="True"];
  D16:e    -> mFail:ne [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const createUserSchema = z.object({',
        '    email: z.string().trim().regex(emailRegex, "Invalid email address"),',
        '    fullName: z.string().trim().min(8, "Full name must be at least 8 characters").max(64, "Full name must be at most 64 characters"),',
        '    phone: z.string().trim().regex(e164PhoneRegex, "Phone number format is incorrect"),',
        '    dateOfBirth: z.string().regex(isoDateRegex, "Date of birth must be in YYYY-MM-DD format").refine(date => new Date(date) < new Date(), "Date of birth must be in the past"),',
        '    password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters").regex(/[A-Z]/, "Password must contain at least one uppercase character").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 17, cc2EdgeNodePlus2: 17, cc3PredicatePlus1: 17 },
    predicates: [
        'email is string (D1)', 'email matches regex (D2)', 'fullName is string (D3)', 'fullName length >= 8 (D4)', 'fullName length <= 64 (D5)',
        'phone is string (D6)', 'phone matches regex (D7)', 'DOB is string (D8)', 'DOB matches regex (D9)', 'DOB in past (D10)',
        'password is string (D11)', 'password length >= 8 (D12)', 'password length <= 64 (D13)', 'password has upper (D14)', 'password has digit (D15)', 'password has special (D16)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(T) -> D16(T) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '13', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '14', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '15', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '16', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '17', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(T) -> D16(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'Valid CreateUserInput', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: 'email=123', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'email="bad"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'fullName=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5', inputData: 'fullName="Short"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '6', inputData: 'fullName="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '7', inputData: 'phone=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '8', inputData: 'phone="abc"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '9', inputData: 'DOB=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '10', inputData: 'DOB="01-01-1990"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '11', inputData: 'DOB="2099-01-01"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '12', inputData: 'password=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '13', inputData: 'password="Short1!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '14', inputData: 'password="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '15', inputData: 'password="lowercase1!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '16', inputData: 'password="Uppercase!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '17', inputData: 'password="Uppercase1"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 (S1-S3, retOk) and TC2 (retErr) as they reach those statements for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const updateUserSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-08',
    statement: 'updateUserSchema.safeParse(inputData) - validates partial user data for updates.',
    data: 'Input: any',
    precondition: 'inputData is an object containing optional basic user fields.',
    results: 'Output: SafeParseSuccess<UpdateUserInput> | SafeParseError<UpdateUserInput>',
    postcondition: 'Return success result if all provided fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="email = email.trim()"   shape=box];
  S2       [label="fullName = fullName.trim()" shape=box];
  S3       [label="phone = phone.trim()"   shape=box];
  D1       [label="email is undefined?"       shape=diamond];
  D2       [label="email is string?"          shape=diamond];
  D3       [label="email matches emailRegex?" shape=diamond];
  D4       [label="fullName is undefined?"    shape=diamond];
  D5       [label="fullName is string?"       shape=diamond];
  D6       [label="fullName length >= 8?"     shape=diamond];
  D7       [label="fullName length <= 64?"     shape=diamond];
  D8       [label="phone is undefined?"       shape=diamond];
  D9       [label="phone is string?"          shape=diamond];
  D10      [label="phone matches e164Regex?" shape=diamond];
  D11      [label="dateOfBirth is undefined?" shape=diamond];
  D12      [label="dateOfBirth is string?"    shape=diamond];
  D13      [label="dateOfBirth matches isoRegex?" shape=diamond];
  D14      [label="dateOfBirth is in past?"   shape=diamond];
  D15      [label="password is undefined?"    shape=diamond];
  D16      [label="password is string?"       shape=diamond];
  D17      [label="password length >= 8?"     shape=diamond];
  D18      [label="password length <= 64?"     shape=diamond];
  D19      [label="password has Uppercase?"   shape=diamond];
  D20      [label="password has Number?"      shape=diamond];
  D21      [label="password has Special char?" shape=diamond];
  mEmail   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mName    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mPhone   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mDOB     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mPwd     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> mEmail:nw  [label="True"];
  D1:e     -> D2:n       [label="False"];
  D2:w     -> S1:n       [label="True"];
  D2:e     -> mFail:ne   [label="False"];
  S1:s     -> D3:n;
  D3:w     -> mEmail:ne  [label="True"];
  D3:e     -> mFail:ne   [label="False"];
  mEmail   -> D4:n;
  D4:w     -> mName:nw   [label="True"];
  D4:e     -> D5:n       [label="False"];
  D5:w     -> S2:n       [label="True"];
  D5:e     -> mFail:ne   [label="False"];
  S2:s     -> D6:n;
  D6:w     -> D7:n       [label="True"];
  D6:e     -> mFail:ne   [label="False"];
  D7:w     -> mName:ne   [label="True"];
  D7:e     -> mFail:ne   [label="False"];
  mName    -> D8:n;
  D8:w     -> mPhone:nw  [label="True"];
  D8:e     -> D9:n       [label="False"];
  D9:w     -> S3:n       [label="True"];
  D9:e     -> mFail:ne   [label="False"];
  S3:s     -> D10:n;
  D10:w    -> mPhone:ne  [label="True"];
  D10:e    -> mFail:ne   [label="False"];
  mPhone   -> D11:n;
  D11:w    -> mDOB:nw    [label="True"];
  D11:e    -> D12:n      [label="False"];
  D12:w    -> D13:n      [label="True"];
  D12:e    -> mFail:ne   [label="False"];
  D13:w    -> D14:n      [label="True"];
  D13:e    -> mFail:ne   [label="False"];
  D14:w    -> mDOB:ne    [label="True"];
  D14:e    -> mFail:ne   [label="False"];
  mDOB     -> D15:n;
  D15:w    -> mPwd:nw    [label="True"];
  D15:e    -> D16:n      [label="False"];
  D16:w    -> D17:n      [label="True"];
  D16:e    -> mFail:ne   [label="False"];
  D17:w    -> D18:n      [label="True"];
  D17:e    -> mFail:ne   [label="False"];
  D18:w    -> D19:n      [label="True"];
  D18:e    -> mFail:ne   [label="False"];
  D19:w    -> D20:n      [label="True"];
  D19:e    -> mFail:ne   [label="False"];
  D20:w    -> D21:n      [label="True"];
  D20:e    -> mFail:ne   [label="False"];
  D21:w    -> mPwd:ne    [label="True"];
  D21:e    -> mFail:ne   [label="False"];
  mPwd     -> retOk:n;
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const updateUserSchema = z.object({',
        '    email: z.string().trim().regex(emailRegex, "Invalid email address").optional(),',
        '    fullName: z.string().trim().min(8, "Full name must be at least 8 characters").max(64, "Full name must be at most 64 characters").optional(),',
        '    phone: z.string().trim().regex(e164PhoneRegex, "Phone number format is incorrect").optional(),',
        '    dateOfBirth: z.string().regex(isoDateRegex, "Date of birth must be in YYYY-MM-DD format").refine(date => new Date(date) < new Date(), "Date of birth must be in the past").optional(),',
        '    password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters").regex(/[A-Z]/, "Password must contain at least one uppercase character").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character").optional(),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 23, cc2EdgeNodePlus2: 23, cc3PredicatePlus1: 23 },
    predicates: [
        'email undef (D1)', 'email string (D2)', 'email regex (D3)',
        'name undef (D4)', 'name string (D5)', 'name min 8 (D6)', 'name max 64 (D7)',
        'phone undef (D8)', 'phone string (D9)', 'phone regex (D10)',
        'DOB undef (D11)', 'DOB string (D12)', 'DOB regex (D13)', 'DOB past (D14)',
        'pwd undef (D15)', 'pwd string (D16)', 'pwd min 8 (D17)', 'pwd max 64 (D18)', 'pwd upper (D19)', 'pwd digit (D20)', 'pwd special (D21)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(T) -> D7(T) -> mName -> D8(F) -> D9(T) -> S3 -> D10(T) -> mPhone -> D11(F) -> D12(T) -> D13(T) -> D14(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(T) -> D21(T) -> mPwd -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(T) -> mPwd -> retOk -> mExit -> exit' },
        { id: '3', description: 'start -> D1(F) -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(T) -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(T) -> S3 -> D10(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(T) -> D14(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '13', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '14', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '15', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '16', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '17', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '18', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(T) -> D21(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '19', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(T) -> mPwd -> retOk -> mExit -> exit' },
        { id: '20', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(T) -> D7(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(T) -> mPwd -> retOk -> mExit -> exit' },
        { id: '21', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(T) -> S3 -> D10(T) -> mPhone -> D11(T) -> mDOB -> D15(T) -> mPwd -> retOk -> mExit -> exit' },
        { id: '22', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(T) -> D14(T) -> mDOB -> D15(T) -> mPwd -> retOk -> mExit -> exit' },
        { id: '23', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(T) -> D21(T) -> mPwd -> retOk -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'All fields valid', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false], [false, true], [true, false], [true, false], [true, false], [false, true], [true, false], [true, false], [false, true], [true, false], [true, false], [true, false], [false, true], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: '{} (empty object)', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'email=123', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'email="bad"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5', inputData: 'fullName=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '6', inputData: 'fullName="Short"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '7', inputData: 'fullName="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '8', inputData: 'phone=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '9', inputData: 'phone="abc"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '10', inputData: 'DOB=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '11', inputData: 'DOB="01-01"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '12', inputData: 'DOB="2099-01-01"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '13', inputData: 'password=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '14', inputData: 'password="S"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '15', inputData: 'password="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '16', inputData: 'password="low1!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '17', inputData: 'password="UP!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '18', inputData: 'password="UP1"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '19', inputData: 'email only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [true, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '20', inputData: 'fullName only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '21', inputData: 'phone only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '22', inputData: 'DOB only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '23', inputData: 'password only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1, TC2, TC3, and TC5 as they reach retOk/retErr and S1/S2/S3 for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const createMemberWithTempPasswordSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-09',
    statement: 'createMemberWithTempPasswordSchema.safeParse(inputData) - validates member data when using an auto-generated password.',
    data: 'Input: any',
    precondition: 'inputData is an object containing email, fullName, phone, dateOfBirth, and membershipStart.',
    results: 'Output: SafeParseSuccess<CreateMemberWithTempPasswordInput> | SafeParseError<CreateMemberWithTempPasswordInput>',
    postcondition: 'Return success result if all fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="email = email.trim()"   shape=box];
  S2       [label="fullName = fullName.trim()" shape=box];
  S3       [label="phone = phone.trim()"   shape=box];
  D1       [label="email string?"          shape=diamond];
  D2       [label="email matches emailRegex?" shape=diamond];
  D3       [label="fullName string?"       shape=diamond];
  D4       [label="fullName length >= 8?"  shape=diamond];
  D5       [label="fullName length <= 64?"  shape=diamond];
  D6       [label="phone string?"          shape=diamond];
  D7       [label="phone matches e164Regex?" shape=diamond];
  D8       [label="dateOfBirth string?"    shape=diamond];
  D9       [label="dateOfBirth matches isoRegex?" shape=diamond];
  D10      [label="dateOfBirth is in past?" shape=diamond];
  D11      [label="membershipStart string?" shape=diamond];
  D12      [label="membershipStart matches isoRegex?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> S1:n    [label="True"];
  D1:e     -> mFail:ne [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n    [label="True"];
  D2:e     -> mFail:ne [label="False"];
  D3:w     -> S2:n    [label="True"];
  D3:e     -> mFail:ne [label="False"];
  S2:s     -> D4:n;
  D4:w     -> D5:n    [label="True"];
  D4:e     -> mFail:ne [label="False"];
  D5:w     -> D6:n    [label="True"];
  D5:e     -> mFail:ne [label="False"];
  D6:w     -> S3:n    [label="True"];
  D6:e     -> mFail:ne [label="False"];
  S3:s     -> D7:n;
  D7:w     -> D8:n    [label="True"];
  D7:e     -> mFail:ne [label="False"];
  D8:w     -> D9:n    [label="True"];
  D8:e     -> mFail:ne [label="False"];
  D9:w     -> D10:n   [label="True"];
  D9:e     -> mFail:ne [label="False"];
  D10:w    -> D11:n   [label="True"];
  D10:e    -> mFail:ne [label="False"];
  D11:w    -> D12:n   [label="True"];
  D11:e    -> mFail:ne [label="False"];
  D12:w    -> retOk:n [label="True"];
  D12:e    -> mFail:ne [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const createMemberWithTempPasswordSchema = z.object({',
        '    email: z.string().trim().regex(emailRegex, "Invalid email address"),',
        '    fullName: z.string().trim().min(8, "Full name must be at least 8 characters").max(64, "Full name must be at most 64 characters"),',
        '    phone: z.string().trim().regex(e164PhoneRegex, "Phone number format is incorrect"),',
        '    dateOfBirth: z.string().regex(isoDateRegex, "Date of birth must be in YYYY-MM-DD format").refine(date => new Date(date) < new Date(), "Date of birth must be in the past"),',
        '    membershipStart: z.string().regex(isoDateRegex, "Membership start date must be in YYYY-MM-DD format"),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 13, cc2EdgeNodePlus2: 13, cc3PredicatePlus1: 13 },
    predicates: [
        'email is string (D1)', 'email matches regex (D2)', 'fullName is string (D3)', 'fullName length >= 8 (D4)', 'fullName length <= 64 (D5)',
        'phone is string (D6)', 'phone matches regex (D7)', 'DOB is string (D8)', 'DOB matches regex (D9)', 'DOB in past (D10)',
        'mStart is string (D11)', 'mStart matches regex (D12)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '13', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'Valid CreateMemberWithTempPasswordInput', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: 'email=123', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'email="bad"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'fullName=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5', inputData: 'fullName="Short"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '6', inputData: 'fullName="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '7', inputData: 'phone=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '8', inputData: 'phone="abc"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '9', inputData: 'DOB=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '10', inputData: 'DOB="01-01-1990"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '11', inputData: 'DOB="2099-01-01"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '12', inputData: 'membershipStart=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '13', inputData: 'membershipStart="01-01-2026"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 (S1-S3, retOk) and TC2 (retErr) as they reach those statements for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const createAdminSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-10',
    statement: 'createAdminSchema.safeParse(inputData) - validates admin user data for creation.',
    data: 'Input: any',
    precondition: 'inputData is an object containing admin user fields.',
    results: 'Output: SafeParseSuccess<CreateAdminInput> | SafeParseError<CreateAdminInput>',
    postcondition: 'Return success result if all fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="email = email.trim()"   shape=box];
  S2       [label="fullName = fullName.trim()" shape=box];
  S3       [label="phone = phone.trim()"   shape=box];
  D1       [label="email string?"          shape=diamond];
  D2       [label="email matches emailRegex?" shape=diamond];
  D3       [label="fullName string?"       shape=diamond];
  D4       [label="fullName length >= 8?"  shape=diamond];
  D5       [label="fullName length <= 64?"  shape=diamond];
  D6       [label="phone string?"          shape=diamond];
  D7       [label="phone matches e164Regex?" shape=diamond];
  D8       [label="dateOfBirth string?"    shape=diamond];
  D9       [label="dateOfBirth matches isoRegex?" shape=diamond];
  D10      [label="dateOfBirth is in past?" shape=diamond];
  D11      [label="password string?"       shape=diamond];
  D12      [label="password length >= 8?"  shape=diamond];
  D13      [label="password length <= 64?"  shape=diamond];
  D14      [label="password has Uppercase?" shape=diamond];
  D15      [label="password has Number?"    shape=diamond];
  D16      [label="password has Special char?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> S1:n    [label="True"];
  D1:e     -> mFail:ne [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n    [label="True"];
  D2:e     -> mFail:ne [label="False"];
  D3:w     -> S2:n    [label="True"];
  D3:e     -> mFail:ne [label="False"];
  S2:s     -> D4:n;
  D4:w     -> D5:n    [label="True"];
  D4:e     -> mFail:ne [label="False"];
  D5:w     -> D6:n    [label="True"];
  D5:e     -> mFail:ne [label="False"];
  D6:w     -> S3:n    [label="True"];
  D6:e     -> mFail:ne [label="False"];
  S3:s     -> D7:n;
  D7:w     -> D8:n    [label="True"];
  D7:e     -> mFail:ne [label="False"];
  D8:w     -> D9:n    [label="True"];
  D8:e     -> mFail:ne [label="False"];
  D9:w     -> D10:n   [label="True"];
  D9:e     -> mFail:ne [label="False"];
  D10:w    -> D11:n   [label="True"];
  D10:e    -> mFail:ne [label="False"];
  D11:w    -> D12:n   [label="True"];
  D11:e    -> mFail:ne [label="False"];
  D12:w    -> D13:n   [label="True"];
  D12:e    -> mFail:ne [label="False"];
  D13:w    -> D14:n   [label="True"];
  D13:e    -> mFail:ne [label="False"];
  D14:w    -> D15:n   [label="True"];
  D14:e    -> mFail:ne [label="False"];
  D15:w    -> D16:n   [label="True"];
  D15:e    -> mFail:ne [label="False"];
  D16:w    -> retOk:n [label="True"];
  D16:e    -> mFail:ne [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const createAdminSchema = z.object({',
        '    email: z.string().trim().regex(emailRegex, "Invalid email address"),',
        '    fullName: z.string().trim().min(8, "Full name must be at least 8 characters").max(64, "Full name must be at most 64 characters"),',
        '    phone: z.string().trim().regex(e164PhoneRegex, "Phone number format is incorrect"),',
        '    dateOfBirth: z.string().regex(isoDateRegex, "Date of birth must be in YYYY-MM-DD format").refine(date => new Date(date) < new Date(), "Date of birth must be in the past"),',
        '    password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters").regex(/[A-Z]/, "Password must contain at least one uppercase character").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 17, cc2EdgeNodePlus2: 17, cc3PredicatePlus1: 17 },
    predicates: [
        'email is string (D1)', 'email matches regex (D2)', 'fullName is string (D3)', 'fullName length >= 8 (D4)', 'fullName length <= 64 (D5)',
        'phone is string (D6)', 'phone matches regex (D7)', 'DOB is string (D8)', 'DOB matches regex (D9)', 'DOB in past (D10)',
        'password is string (D11)', 'password length >= 8 (D12)', 'password length <= 64 (D13)', 'password has upper (D14)', 'password has digit (D15)', 'password has special (D16)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(T) -> D16(T) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '13', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '14', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '15', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '16', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '17', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> S2 -> D4(T) -> D5(T) -> D6(T) -> S3 -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> D12(T) -> D13(T) -> D14(T) -> D15(T) -> D16(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'Valid CreateAdminInput', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: 'email=123', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'email="bad"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'fullName=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5', inputData: 'fullName="Short"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '6', inputData: 'fullName="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '7', inputData: 'phone=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '8', inputData: 'phone="abc"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '9', inputData: 'DOB=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '10', inputData: 'DOB="01-01-1990"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '11', inputData: 'DOB="2099-01-01"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '12', inputData: 'password=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '13', inputData: 'password="Short1!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '14', inputData: 'password="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '15', inputData: 'password="lowercase1!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '16', inputData: 'password="Uppercase!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '17', inputData: 'password="Uppercase1"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 (S1-S3, retOk) and TC2 (retErr) as they reach those statements for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const updateAdminSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-11',
    statement: 'updateAdminSchema.safeParse(inputData) - validates partial admin data for updates.',
    data: 'Input: any',
    precondition: 'inputData is an object containing optional admin user fields.',
    results: 'Output: SafeParseSuccess<UpdateAdminInput> | SafeParseError<UpdateAdminInput>',
    postcondition: 'Return success result if all provided fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  S1       [label="email = email.trim()"   shape=box];
  S2       [label="fullName = fullName.trim()" shape=box];
  S3       [label="phone = phone.trim()"   shape=box];
  D1       [label="email undefined?"       shape=diamond];
  D2       [label="email is string?"          shape=diamond];
  D3       [label="email matches emailRegex?" shape=diamond];
  D4       [label="fullName is undefined?"    shape=diamond];
  D5       [label="fullName is string?"       shape=diamond];
  D6       [label="fullName length >= 8?"     shape=diamond];
  D7       [label="fullName length <= 64?"     shape=diamond];
  D8       [label="phone is undefined?"       shape=diamond];
  D9       [label="phone is string?"          shape=diamond];
  D10      [label="phone matches e164Regex?" shape=diamond];
  D11      [label="dateOfBirth is undefined?" shape=diamond];
  D12      [label="dateOfBirth is string?"    shape=diamond];
  D13      [label="dateOfBirth matches isoRegex?" shape=diamond];
  D14      [label="dateOfBirth is in past?"   shape=diamond];
  D15      [label="password is undefined?"    shape=diamond];
  D16      [label="password is string?"       shape=diamond];
  D17      [label="password length >= 8?"     shape=diamond];
  D18      [label="password length <= 64?"     shape=diamond];
  D19      [label="password has Uppercase?"   shape=diamond];
  D20      [label="password has Number?"      shape=diamond];
  D21      [label="password has Special char?" shape=diamond];
  mEmail   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mName    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mPhone   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mDOB     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mPwd     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> mEmail:nw  [label="True"];
  D1:e     -> D2:n       [label="False"];
  D2:w     -> S1:n       [label="True"];
  D2:e     -> mFail:ne   [label="False"];
  S1:s     -> D3:n;
  D3:w     -> mEmail:ne  [label="True"];
  D3:e     -> mFail:ne   [label="False"];
  mEmail   -> D4:n;
  D4:w     -> mName:nw   [label="True"];
  D4:e     -> D5:n       [label="False"];
  D5:w     -> S2:n       [label="True"];
  D5:e     -> mFail:ne   [label="False"];
  S2:s     -> D6:n;
  D6:w     -> D7:n       [label="True"];
  D6:e     -> mFail:ne   [label="False"];
  D7:w     -> mName:ne   [label="True"];
  D7:e     -> mFail:ne   [label="False"];
  mName    -> D8:n;
  D8:w     -> mPhone:nw  [label="True"];
  D8:e     -> D9:n       [label="False"];
  D9:w     -> S3:n       [label="True"];
  D9:e     -> mFail:ne   [label="False"];
  S3:s     -> D10:n;
  D10:w    -> mPhone:ne  [label="True"];
  D10:e    -> mFail:ne   [label="False"];
  mPhone   -> D11:n;
  D11:w    -> mDOB:nw    [label="True"];
  D11:e    -> D12:n      [label="False"];
  D12:w    -> D13:n      [label="True"];
  D12:e    -> mFail:ne   [label="False"];
  D13:w    -> D14:n      [label="True"];
  D13:e    -> mFail:ne   [label="False"];
  D14:w    -> mDOB:ne    [label="True"];
  D14:e    -> mFail:ne   [label="False"];
  mDOB     -> D15:n;
  D15:w    -> mPwd:nw    [label="True"];
  D15:e    -> D16:n      [label="False"];
  D16:w    -> D17:n      [label="True"];
  D16:e    -> mFail:ne   [label="False"];
  D17:w    -> D18:n      [label="True"];
  D17:e    -> mFail:ne   [label="False"];
  D18:w    -> D19:n      [label="True"];
  D18:e    -> mFail:ne   [label="False"];
  D19:w    -> D20:n      [label="True"];
  D19:e    -> mFail:ne   [label="False"];
  D20:w    -> D21:n      [label="True"];
  D20:e    -> mFail:ne   [label="False"];
  D21:w    -> mPwd:ne    [label="True"];
  D21:e    -> mFail:ne   [label="False"];
  mPwd     -> retOk:n;
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const updateAdminSchema = z.object({',
        '    email: z.string().trim().regex(emailRegex, "Invalid email address").optional(),',
        '    fullName: z.string().trim().min(8, "Full name must be at least 8 characters").max(64, "Full name must be at most 64 characters").optional(),',
        '    phone: z.string().trim().regex(e164PhoneRegex, "Phone number format is incorrect").optional(),',
        '    dateOfBirth: z.string().regex(isoDateRegex, "Date of birth must be in YYYY-MM-DD format").refine(date => new Date(date) < new Date(), "Date of birth must be in the past").optional(),',
        '    password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters").regex(/[A-Z]/, "Password must contain at least one uppercase character").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character").optional(),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 23, cc2EdgeNodePlus2: 23, cc3PredicatePlus1: 23 },
    predicates: [
        'email undef (D1)', 'email string (D2)', 'email regex (D3)',
        'name undef (D4)', 'name string (D5)', 'name min 8 (D6)', 'name max 64 (D7)',
        'phone undef (D8)', 'phone string (D9)', 'phone regex (D10)',
        'DOB undef (D11)', 'DOB string (D12)', 'DOB regex (D13)', 'DOB past (D14)',
        'pwd undef (D15)', 'pwd string (D16)', 'pwd min 8 (D17)', 'pwd max 64 (D18)', 'pwd upper (D19)', 'pwd digit (D20)', 'pwd special (D21)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(T) -> D7(T) -> mName -> D8(F) -> D9(T) -> S3 -> D10(T) -> mPhone -> D11(F) -> D12(T) -> D13(T) -> D14(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(T) -> D21(T) -> mPwd -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(T) -> mPwd -> retOk -> mExit -> exit' },
        { id: '3', description: 'start -> D1(F) -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(T) -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(T) -> S3 -> D10(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(T) -> D14(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '13', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '14', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '15', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '16', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '17', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '18', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(T) -> D21(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '19', description: 'start -> D1(F) -> D2(T) -> S1 -> D3(T) -> mEmail -> D4(T) -> D8(T) -> D11(T) -> D15(T) -> retOk -> mExit -> exit' },
        { id: '20', description: 'start -> D1(T) -> mEmail -> D4(F) -> D5(T) -> S2 -> D6(T) -> D7(T) -> mName -> D8(T) -> D11(T) -> D15(T) -> retOk -> mExit -> exit' },
        { id: '21', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(F) -> D9(T) -> S3 -> D10(T) -> mPhone -> D11(T) -> D15(T) -> retOk -> mExit -> exit' },
        { id: '22', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(F) -> D12(T) -> D13(T) -> D14(T) -> mDOB -> D15(T) -> retOk -> mExit -> exi)' },
        { id: '23', description: 'start -> D1(T) -> mEmail -> D4(T) -> mName -> D8(T) -> mPhone -> D11(T) -> mDOB -> D15(F) -> D16(T) -> D17(T) -> D18(T) -> D19(T) -> D20(T) -> D21(T) -> mPwd -> retOk -> mExit -> exit' },
    ],
    tcRows: [
        {
            noTc: '1', inputData: 'All fields valid', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[false, true], [true, false], [true, false], [false, true], [true, false], [true, false], [true, false], [false, true], [true, false], [true, false], [false, true], [true, false], [true, false], [true, false], [false, true], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2', inputData: '{} (empty object)', expected: 'success: true', statementCoverage: true,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3', inputData: 'email=123', expected: 'success: false', statementCoverage: true,
            conditionDecision: [[false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4', inputData: 'email="bad"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5', inputData: 'fullName=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '6', inputData: 'fullName="Short"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '7', inputData: 'fullName="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '8', inputData: 'phone=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '9', inputData: 'phone="abc"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '10', inputData: 'DOB=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '11', inputData: 'DOB="01-01"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '12', inputData: 'DOB="2099-01-01"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '13', inputData: 'password=123', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '14', inputData: 'password="S"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '15', inputData: 'password="A".repeat(65)', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '16', inputData: 'password="low1!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '17', inputData: 'password="UP!"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '18', inputData: 'password="UP1"', expected: 'success: false', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '19', inputData: 'email only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[false, true], [true, false], [true, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '20', inputData: 'fullName only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '21', inputData: 'phone only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '22', inputData: 'DOB only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '23', inputData: 'password only', expected: 'success: true', statementCoverage: false,
            conditionDecision: [[true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [true, false], [false, false], [false, false], [true, false], [false, false], [false, false], [false, false], [false, true], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false]],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1, TC2, TC3, and TC5 as they reach retOk/retErr and S1/S2/S3 for the first time.',
    ],
    tcsFailed: 0, bugsFound: 0, coveragePercent: '100%',
};

const createWorkoutSessionSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-12',
    statement: 'createWorkoutSessionSchema.safeParse(inputData) - validates the workout session data structure for creation.',
    data: 'Input: any',
    precondition: 'inputData is an object containing workout session fields.',
    results: 'Output: SafeParseSuccess<CreateWorkoutSessionInput> | SafeParseError<CreateWorkoutSessionInput>',
    postcondition: 'Return success result if all fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  D1       [label="memberId is string?" shape=diamond];
  S1       [label="memberId = memberId.trim()" shape=box];
  D2       [label="memberId length >= 1?" shape=diamond];
  D3       [label="date is string?" shape=diamond];
  D4       [label="date matches isoDateRegex?" shape=diamond];
  D5       [label="date length >= 1?" shape=diamond];
  D6       [label="duration coercible to number?" shape=diamond];
  D7       [label="duration >= 0?" shape=diamond];
  D8       [label="duration <= 180?" shape=diamond];
  D9       [label="notes is string?" shape=diamond];
  S2       [label="notes = notes.trim()" shape=box];
  D10      [label="notes length <= 1024?" shape=diamond];
  D11      [label="notes is undefined?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mNotes   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> S1:n      [label="True"];
  D1:e     -> mFail:ne  [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n      [label="True"];
  D2:e     -> mFail:ne  [label="False"];
  D3:w     -> D4:n      [label="True"];
  D3:e     -> mFail:ne  [label="False"];
  D4:w     -> D5:n      [label="True"];
  D4:e     -> mFail:ne  [label="False"];
  D5:w     -> D6:n      [label="True"];
  D5:e     -> mFail:ne  [label="False"];
  D6:w     -> D7:n      [label="True"];
  D6:e     -> mFail:ne  [label="False"];
  D7:w     -> D8:n      [label="True"];
  D7:e     -> mFail:ne  [label="False"];
  D8:w     -> D9:n      [label="True"];
  D8:e     -> mFail:ne  [label="False"];
  D9:w     -> S2:n      [label="True"];
  D9:e     -> D11:n     [label="False"];
  S2:s     -> D10:n;
  D10:w    -> mNotes:nw [label="True"];
  D10:e    -> mFail:ne  [label="False"];
  D11:w    -> mNotes:ne [label="True"];
  D11:e    -> mFail:ne  [label="False"];
  mNotes   -> retOk:n;
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const createWorkoutSessionSchema = z.object({',
        '    memberId: z.string().trim().min(1, \'Member is required\'),',
        '    date: z.string().regex(isoDateRegex, \'Date must be in YYYY-MM-DD format\').min(1, \'Date is required\'),',
        '    duration: z.coerce.number().min(0, \'Duration must be greater or equal to 0\').max(180, \'Duration must be at most 180 minutes\'),',
        '    notes: z.string().trim().max(1024, \'Notes must be at most 1024 characters\').optional(),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 12, cc2EdgeNodePlus2: 12, cc3PredicatePlus1: 12 },
    predicates: [
        'memberId is string (D1)',
        'memberId length >= 1 after trim (D2)',
        'date is string (D3)',
        'date matches isoDateRegex (D4)',
        'date length >= 1 (D5)',
        'duration coercible to number (D6)',
        'duration >= 0 (D7)',
        'duration <= 180 (D8)',
        'notes is string (D9)',
        'notes length <= 1024 after trim (D10)',
        'notes is undefined (D11)',
    ],
    paths: [
        { id: '1',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> S2 -> D10(T) -> mNotes -> retOk -> mExit -> exit' },
        { id: '2',  description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3',  description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(F) -> D11(T) -> mNotes -> retOk -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> S2 -> D10(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(F) -> D11(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'Valid session: memberId="member-1", date="2024-12-31", duration=60, notes="Great session"',
            expected: 'success: true',
            statementCoverage: true,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [true, false], [false, false],
            ],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'memberId=123 (not a string)',
            expected: 'success: false',
            statementCoverage: true,
            conditionDecision: [
                [false, true], [false, false], [false, false], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'memberId="   " (whitespace-only, trims to empty)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, true], [false, false], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'date=123 (not a string)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [false, true], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5',
            inputData: 'date="31-12-2024" (fails isoDateRegex)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [false, true], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '6',
            inputData: 'date="" (empty string, passes type check but fails min(1))',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [false, true], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '7',
            inputData: 'duration="abc" (not coercible to number)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [false, true],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '8',
            inputData: 'duration=-1 (below min 0)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [false, true], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '9',
            inputData: 'duration=181 (above max 180)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [false, true], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '10',
            inputData: 'notes=undefined (omitted)',
            expected: 'success: true',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [false, true], [false, false], [true, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '11',
            inputData: 'notes="A".repeat(1025) (above max 1024)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [false, true], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '12',
            inputData: 'notes=123 (not a string and not undefined)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [false, true], [false, false], [false, true],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2 as TC1 is the first to reach retOk executing S1 and S2, and TC2 is the first to reach retErr.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

const updateWorkoutSessionSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-13',
    statement: 'updateWorkoutSessionSchema.safeParse(inputData) - validates partial workout session data for updates.',
    data: 'Input: any',
    precondition: 'inputData is an object containing optional session fields.',
    results: 'Output: SafeParseSuccess<UpdateWorkoutSessionInput> | SafeParseError<UpdateWorkoutSessionInput>',
    postcondition: 'Return success result if all provided fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  D1       [label="date is undefined?" shape=diamond];
  D2       [label="date is string?" shape=diamond];
  D3       [label="date matches isoDateRegex?" shape=diamond];
  D4       [label="duration is undefined?" shape=diamond];
  D5       [label="duration coercible to number?" shape=diamond];
  D6       [label="duration >= 0?" shape=diamond];
  D7       [label="duration <= 180?" shape=diamond];
  D8       [label="notes is string?" shape=diamond];
  S1       [label="notes = notes.trim()" shape=box];
  D9       [label="notes length <= 1024?" shape=diamond];
  D10      [label="notes is undefined?" shape=diamond];
  mDate    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mDur     [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mNotes   [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> mDate:nw  [label="True"];
  D1:e     -> D2:n      [label="False"];
  D2:w     -> D3:n      [label="True"];
  D2:e     -> mFail:ne  [label="False"];
  D3:w     -> mDate:ne  [label="True"];
  D3:e     -> mFail:ne  [label="False"];
  mDate    -> D4:n;
  D4:w     -> mDur:nw   [label="True"];
  D4:e     -> D5:n      [label="False"];
  D5:w     -> D6:n      [label="True"];
  D5:e     -> mFail:ne  [label="False"];
  D6:w     -> D7:n      [label="True"];
  D6:e     -> mFail:ne  [label="False"];
  D7:w     -> mDur:ne   [label="True"];
  D7:e     -> mFail:ne  [label="False"];
  mDur     -> D8:n;
  D8:w     -> S1:n      [label="True"];
  D8:e     -> D10:n     [label="False"];
  S1:s     -> D9:n;
  D9:w     -> mNotes:nw [label="True"];
  D9:e     -> mFail:ne  [label="False"];
  D10:w    -> mNotes:ne [label="True"];
  D10:e    -> mFail:ne  [label="False"];
  mNotes   -> retOk:n;
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const updateWorkoutSessionSchema = z.object({',
        '    date: z.string().regex(isoDateRegex, \'Date must be in YYYY-MM-DD format\').optional(),',
        '    duration: z.coerce.number().min(0, \'Duration must be greater or equal to 0\').max(180, \'Duration must be at most 180 minutes\').optional(),',
        '    notes: z.string().trim().max(1024, \'Notes must be at most 1024 characters\').optional(),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 11, cc2EdgeNodePlus2: 11, cc3PredicatePlus1: 11 },
    predicates: [
        'date is undefined (D1)',
        'date is string (D2)',
        'date matches isoDateRegex (D3)',
        'duration is undefined (D4)',
        'duration coercible to number (D5)',
        'duration >= 0 (D6)',
        'duration <= 180 (D7)',
        'notes is string (D8)',
        'notes length <= 1024 after trim (D9)',
        'notes is undefined (D10)',
    ],
    paths: [
        { id: '1',  description: 'start -> D1(T) -> mDate -> D4(T) -> mDur -> D8(F) -> D10(T) -> mNotes -> retOk -> mExit -> exit' },
        { id: '2',  description: 'start -> D1(F) -> D2(T) -> D3(T) -> mDate -> D4(T) -> mDur -> D8(F) -> D10(T) -> mNotes -> retOk -> mExit -> exit' },
        { id: '3',  description: 'start -> D1(T) -> mDate -> D4(F) -> D5(T) -> D6(T) -> D7(T) -> mDur -> D8(F) -> D10(T) -> mNotes -> retOk -> mExit -> exit' },
        { id: '4',  description: 'start -> D1(T) -> mDate -> D4(T) -> mDur -> D8(T) -> S1 -> D9(T) -> mNotes -> retOk -> mExit -> exit' },
        { id: '5',  description: 'start -> D1(F) -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6',  description: 'start -> D1(F) -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7',  description: 'start -> D1(T) -> mDate -> D4(F) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8',  description: 'start -> D1(T) -> mDate -> D4(F) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9',  description: 'start -> D1(T) -> mDate -> D4(F) -> D5(T) -> D6(T) -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> mDate -> D4(T) -> mDur -> D8(T) -> S1 -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> mDate -> D4(T) -> mDur -> D8(F) -> D10(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'Empty object {}',
            expected: 'success: true',
            statementCoverage: true,
            conditionDecision: [
                [true, false], [false, false], [false, false], [true, false], [false, false],
                [false, false], [false, false], [false, true], [false, false], [true, false],
            ],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'date="2024-12-31" (valid format)',
            expected: 'success: true',
            statementCoverage: false,
            conditionDecision: [
                [false, true], [true, false], [true, false], [true, false], [false, false],
                [false, false], [false, false], [false, true], [false, false], [true, false],
            ],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'duration=60',
            expected: 'success: true',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [false, false], [false, true], [true, false],
                [true, false], [true, false], [false, true], [false, false], [true, false],
            ],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'notes="Updated notes"',
            expected: 'success: true',
            statementCoverage: true,
            conditionDecision: [
                [true, false], [false, false], [false, false], [true, false], [false, false],
                [false, false], [false, false], [true, false], [true, false], [false, false],
            ],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '5',
            inputData: 'date=123 (not a string)',
            expected: 'success: false',
            statementCoverage: true,
            conditionDecision: [
                [false, true], [false, true], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '6',
            inputData: 'date="31-12-2024" (fails isoDateRegex)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [false, true], [true, false], [false, true], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '7',
            inputData: 'duration="abc" (not coercible to number)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [false, false], [false, true], [false, true],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '8',
            inputData: 'duration=-1 (below min 0)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [false, false], [false, true], [true, false],
                [false, true], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '9',
            inputData: 'duration=181 (above max 180)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [false, false], [false, true], [true, false],
                [true, false], [false, true], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '10',
            inputData: 'notes="A".repeat(1025) (above max 1024)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [false, false], [true, false], [false, false],
                [false, false], [false, false], [true, false], [false, true], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '11',
            inputData: 'notes=123 (not a string and not undefined)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [false, false], [true, false], [false, false],
                [false, false], [false, false], [false, true], [false, false], [false, true],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 (first to reach retOk, exercises empty object path), TC4 (first to execute S1 — notes.trim()), and TC5 (first to reach retErr).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

const workoutSessionExerciseSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-14',
    statement: 'workoutSessionExerciseSchema.safeParse(inputData) - validates a single exercise entry in a workout session.',
    data: 'Input: any',
    precondition: 'inputData is an object containing exercise entry fields.',
    results: 'Output: SafeParseSuccess<WorkoutSessionExerciseInput> | SafeParseError<WorkoutSessionExerciseInput>',
    postcondition: 'Return success result if all fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  D1       [label="exerciseId is string?" shape=diamond];
  S1       [label="exerciseId = exerciseId.trim()" shape=box];
  D2       [label="exerciseId length >= 1?" shape=diamond];
  D3       [label="sets coercible to number?" shape=diamond];
  D4       [label="sets >= 0?" shape=diamond];
  D5       [label="sets <= 6?" shape=diamond];
  D6       [label="reps coercible to number?" shape=diamond];
  D7       [label="reps >= 0?" shape=diamond];
  D8       [label="reps <= 30?" shape=diamond];
  D9       [label="weight coercible to number?" shape=diamond];
  D10      [label="weight >= 0?" shape=diamond];
  D11      [label="weight <= 500?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> S1:n      [label="True"];
  D1:e     -> mFail:ne  [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n      [label="True"];
  D2:e     -> mFail:ne  [label="False"];
  D3:w     -> D4:n      [label="True"];
  D3:e     -> mFail:ne  [label="False"];
  D4:w     -> D5:n      [label="True"];
  D4:e     -> mFail:ne  [label="False"];
  D5:w     -> D6:n      [label="True"];
  D5:e     -> mFail:ne  [label="False"];
  D6:w     -> D7:n      [label="True"];
  D6:e     -> mFail:ne  [label="False"];
  D7:w     -> D8:n      [label="True"];
  D7:e     -> mFail:ne  [label="False"];
  D8:w     -> D9:n      [label="True"];
  D8:e     -> mFail:ne  [label="False"];
  D9:w     -> D10:n     [label="True"];
  D9:e     -> mFail:ne  [label="False"];
  D10:w    -> D11:n     [label="True"];
  D10:e    -> mFail:ne  [label="False"];
  D11:w    -> retOk:n   [label="True"];
  D11:e    -> mFail:ne  [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const workoutSessionExerciseSchema = z.object({',
        '    exerciseId: z.string().trim().min(1, \'Exercise is required\'),',
        '    sets: z.coerce.number().min(0, \'Sets must be greater or equal to 0\').max(6, \'Sets must be at most 6\'),',
        '    reps: z.coerce.number().min(0, \'Reps must be greater or equal to 0\').max(30, \'Reps must be at most 30\'),',
        '    weight: z.coerce.number().min(0, \'Weight must be greater or equal to 0.0\').max(500, \'Weight must be at most 500.0\'),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 12, cc2EdgeNodePlus2: 12, cc3PredicatePlus1: 12 },
    predicates: [
        'exerciseId is string (D1)',
        'exerciseId length >= 1 after trim (D2)',
        'sets coercible to number (D3)',
        'sets >= 0 (D4)',
        'sets <= 6 (D5)',
        'reps coercible to number (D6)',
        'reps >= 0 (D7)',
        'reps <= 30 (D8)',
        'weight coercible to number (D9)',
        'weight >= 0 (D10)',
        'weight <= 500 (D11)',
    ],
    paths: [
        { id: '1',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> retOk -> mExit -> exit' },
        { id: '2',  description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3',  description: 'start -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9',  description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> D10(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'Valid exercise: exerciseId="exercise-1", sets=3, reps=10, weight=50',
            expected: 'success: true',
            statementCoverage: true,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [true, false], [true, false],
            ],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'exerciseId=123 (not a string)',
            expected: 'success: false',
            statementCoverage: true,
            conditionDecision: [
                [false, true], [false, false], [false, false], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'exerciseId="   " (whitespace-only, trims to empty)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, true], [false, false], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'sets="abc" (not coercible to number)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [false, true], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5',
            inputData: 'sets=-1 (below min 0)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [false, true], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '6',
            inputData: 'sets=7 (above max 6)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [false, true], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '7',
            inputData: 'reps="abc" (not coercible to number)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [false, true],
                [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '8',
            inputData: 'reps=-1 (below min 0)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [false, true], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '9',
            inputData: 'reps=31 (above max 30)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [false, true], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '10',
            inputData: 'weight="abc" (not coercible to number)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [false, true], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '11',
            inputData: 'weight=-1 (below min 0)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [false, true], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '12',
            inputData: 'weight=501 (above max 500)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [true, false], [false, true],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 (first to reach retOk, executes S1) and TC2 (first to reach retErr).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

const workoutSessionExercisesSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-15',
    statement: 'workoutSessionExercisesSchema.safeParse(inputData) - validates a list of exercise entries, requiring at least one.',
    data: 'Input: any',
    precondition: 'inputData is an array of exercise entry objects.',
    results: 'Output: SafeParseSuccess<WorkoutSessionExerciseInput[]> | SafeParseError<WorkoutSessionExerciseInput[]>',
    postcondition: 'Return success result if the array has at least one valid entry; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  D1       [label="input is array?" shape=diamond];
  D2       [label="array length >= 1?" shape=diamond];
  D3       [label="all items valid per workoutSessionExerciseSchema?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> D2:n      [label="True"];
  D1:e     -> mFail:ne  [label="False"];
  D2:w     -> D3:n      [label="True"];
  D2:e     -> mFail:ne  [label="False"];
  D3:w     -> retOk:n   [label="True"];
  D3:e     -> mFail:ne  [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const workoutSessionExercisesSchema = z',
        '    .array(workoutSessionExerciseSchema)',
        '    .min(1, \'At least one exercise is required\');',
    ],
    cyclomaticComplexity: { cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4 },
    predicates: [
        'input is array (D1)',
        'array length >= 1 (D2)',
        'all items valid per workoutSessionExerciseSchema (D3)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> D2(T) -> D3(T) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    hasLoopCoverage: true,
    tcRows: [
        {
            noTc: '1',
            inputData: '[VALID_EXERCISE] (one valid entry)',
            expected: 'success: true',
            statementCoverage: true,
            conditionDecision: [
                [true, false], [true, false], [true, false],
            ],
            pathCoverage: [true, false, false, false],
            loopCoverage: { once: true },
        },
        {
            noTc: '2',
            inputData: '"not-an-array" (non-array primitive)',
            expected: 'success: false',
            statementCoverage: true,
            conditionDecision: [
                [false, true], [false, false], [false, false],
            ],
            pathCoverage: [false, true, false, false],
            loopCoverage: { no: true },
        },
        {
            noTc: '3',
            inputData: '[] (empty array)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, true], [false, false],
            ],
            pathCoverage: [false, false, true, false],
            loopCoverage: { no: true },
        },
        {
            noTc: '4',
            inputData: '[INVALID_EXERCISE] (one invalid entry)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [false, true],
            ],
            pathCoverage: [false, false, false, true],
            loopCoverage: { once: true },
        },
        {
            noTc: '5',
            inputData: '[VALID_EXERCISE, VALID_EXERCISE] (two valid entries)',
            expected: 'success: true',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false],
            ],
            pathCoverage: [true, false, false, false],
            loopCoverage: { twice: true },
        },
        {
            noTc: '6',
            inputData: 'Array of 6 valid entries',
            expected: 'success: true',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false],
            ],
            pathCoverage: [true, false, false, false],
            loopCoverage: { n: true },
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2 as they are the first to reach retOk and retErr respectively.',
        '2) The array schema iterates internally over each element via the Zod engine — the CFG models this as a single D3 predicate node. The loop coverage TCs (once, twice, n) exercise different iteration counts through that internal loop.',
        '3) n is set to 6 as a practical upper bound matching the max sets value in workoutSessionExerciseSchema. The schema imposes no upper bound on array length so nMinus1 and nPlus1 variants exercise no new CFG edges and are omitted.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

const workoutSessionExerciseUpdateSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-16',
    statement: 'workoutSessionExerciseUpdateSchema.safeParse(inputData) - validates a single exercise update entry; id is optional, all exercise metric fields are required.',
    data: 'Input: any',
    precondition: 'inputData is an object that may contain an optional id string plus exercise metric fields.',
    results: 'Output: SafeParseSuccess<WorkoutSessionExerciseUpdateInput> | SafeParseError<WorkoutSessionExerciseUpdateInput>',
    postcondition: 'Return success result if id is absent or a string and all exercise fields are valid; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  D0a      [label="id absent?" shape=diamond];
  D0b      [label="id is string?" shape=diamond];
  m0       [label="" shape=circle width=0.18 style=filled fillcolor=black];
  D1       [label="exerciseId is string?" shape=diamond];
  S1       [label="exerciseId = exerciseId.trim()" shape=box];
  D2       [label="exerciseId length >= 1?" shape=diamond];
  D3       [label="sets coercible to number?" shape=diamond];
  D4       [label="sets >= 0?" shape=diamond];
  D5       [label="sets <= 6?" shape=diamond];
  D6       [label="reps coercible to number?" shape=diamond];
  D7       [label="reps >= 0?" shape=diamond];
  D8       [label="reps <= 30?" shape=diamond];
  D9       [label="weight coercible to number?" shape=diamond];
  D10      [label="weight >= 0?" shape=diamond];
  D11      [label="weight <= 500?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D0a:n;
  D0a:w    -> m0:nw     [label="True"];
  D0a:e    -> D0b:n     [label="False"];
  D0b:w    -> m0:ne     [label="True"];
  D0b:e    -> mFail:ne  [label="False"];
  m0       -> D1:n;
  D1:w     -> S1:n      [label="True"];
  D1:e     -> mFail:ne  [label="False"];
  S1:s     -> D2:n;
  D2:w     -> D3:n      [label="True"];
  D2:e     -> mFail:ne  [label="False"];
  D3:w     -> D4:n      [label="True"];
  D3:e     -> mFail:ne  [label="False"];
  D4:w     -> D5:n      [label="True"];
  D4:e     -> mFail:ne  [label="False"];
  D5:w     -> D6:n      [label="True"];
  D5:e     -> mFail:ne  [label="False"];
  D6:w     -> D7:n      [label="True"];
  D6:e     -> mFail:ne  [label="False"];
  D7:w     -> D8:n      [label="True"];
  D7:e     -> mFail:ne  [label="False"];
  D8:w     -> D9:n      [label="True"];
  D8:e     -> mFail:ne  [label="False"];
  D9:w     -> D10:n     [label="True"];
  D9:e     -> mFail:ne  [label="False"];
  D10:w    -> D11:n     [label="True"];
  D10:e    -> mFail:ne  [label="False"];
  D11:w    -> retOk:n   [label="True"];
  D11:e    -> mFail:ne  [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const workoutSessionExerciseUpdateSchema = z.object({',
        '    id: z.string().optional(),',
        '    exerciseId: z.string().trim().min(1, \'Exercise is required\'),',
        '    sets: z.coerce.number().min(0, \'Sets must be greater or equal to 0\').max(6, \'Sets must be at most 6\'),',
        '    reps: z.coerce.number().min(0, \'Reps must be greater or equal to 0\').max(30, \'Reps must be at most 30\'),',
        '    weight: z.coerce.number().min(0, \'Weight must be greater or equal to 0.0\').max(500, \'Weight must be at most 500.0\'),',
        '});',
    ],
    cyclomaticComplexity: { cc1Regions: 14, cc2EdgeNodePlus2: 14, cc3PredicatePlus1: 14 },
    predicates: [
        'id absent (D0a)',
        'id is string (D0b)',
        'exerciseId is string (D1)',
        'exerciseId length >= 1 after trim (D2)',
        'sets coercible to number (D3)',
        'sets >= 0 (D4)',
        'sets <= 6 (D5)',
        'reps coercible to number (D6)',
        'reps >= 0 (D7)',
        'reps <= 30 (D8)',
        'weight coercible to number (D9)',
        'weight >= 0 (D10)',
        'weight <= 500 (D11)',
    ],
    paths: [
        { id: '1',  description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> retOk -> mExit -> exit' },
        { id: '2',  description: 'start -> D0a(F) -> D0b(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3',  description: 'start -> D0a(F) -> D0b(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(T) -> retOk -> mExit -> exit' },
        { id: '4',  description: 'start -> D0a(T) -> m0 -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '5',  description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '6',  description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '7',  description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '8',  description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '9',  description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '10', description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '11', description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '12', description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '13', description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> D10(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '14', description: 'start -> D0a(T) -> m0 -> D1(T) -> S1 -> D2(T) -> D3(T) -> D4(T) -> D5(T) -> D6(T) -> D7(T) -> D8(T) -> D9(T) -> D10(T) -> D11(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: 'No id field, exerciseId="exercise-1", sets=3, reps=10, weight=50 (id absent)',
            expected: 'success: true',
            statementCoverage: true,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
            ],
            pathCoverage: [true, false, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '2',
            inputData: 'id=123 (not a string)',
            expected: 'success: false, error on id',
            statementCoverage: true,
            conditionDecision: [
                [false, true], [false, true], [false, false], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, true, false, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '3',
            inputData: 'id="existing-row-id", exerciseId="exercise-1", sets=3, reps=10, weight=50 (id is string)',
            expected: 'success: true',
            statementCoverage: false,
            conditionDecision: [
                [false, true], [true, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [true, false],
            ],
            pathCoverage: [false, false, true, false, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '4',
            inputData: 'exerciseId=123 (not a string), no id',
            expected: 'success: false, error on exerciseId',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [false, true], [false, false], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, true, false, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '5',
            inputData: 'exerciseId="   " (whitespace-only, trims to empty)',
            expected: 'success: false, error on exerciseId',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [false, true], [false, false], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, true, false, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '6',
            inputData: 'sets="abc" (not coercible to number)',
            expected: 'success: false, error on sets',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [false, true], [false, false],
                [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, true, false, false, false, false, false, false, false, false],
        },
        {
            noTc: '7',
            inputData: 'sets=-1 (below min 0)',
            expected: 'success: false, error on sets',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [false, true],
                [false, false], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, true, false, false, false, false, false, false, false],
        },
        {
            noTc: '8',
            inputData: 'sets=7 (above max 6)',
            expected: 'success: false, error on sets',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [true, false],
                [false, true], [false, false], [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, true, false, false, false, false, false, false],
        },
        {
            noTc: '9',
            inputData: 'reps="abc" (not coercible to number)',
            expected: 'success: false, error on reps',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [false, true], [false, false], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, true, false, false, false, false, false],
        },
        {
            noTc: '10',
            inputData: 'reps=-1 (below min 0)',
            expected: 'success: false, error on reps',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [false, true], [false, false], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, true, false, false, false, false],
        },
        {
            noTc: '11',
            inputData: 'reps=31 (above max 30)',
            expected: 'success: false, error on reps',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [false, true], [false, false], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, true, false, false, false],
        },
        {
            noTc: '12',
            inputData: 'weight="abc" (not coercible to number)',
            expected: 'success: false, error on weight',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [true, false], [false, true], [false, false], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, true, false, false],
        },
        {
            noTc: '13',
            inputData: 'weight=-1 (below min 0)',
            expected: 'success: false, error on weight',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [true, false], [true, false], [false, true], [false, false],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, true, false],
        },
        {
            noTc: '14',
            inputData: 'weight=501 (above max 500)',
            expected: 'success: false, error on weight',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, false], [true, false], [true, false], [true, false], [true, false],
                [true, false], [true, false], [true, false], [true, false], [true, false], [true, false], [false, true],
            ],
            pathCoverage: [false, false, false, false, false, false, false, false, false, false, false, false, false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 (first to reach retOk via D0a=True, executing S1) and TC2 (first to reach retErr via D0b=False → mFail).',
        '2) D0 is split into two separate diamonds: D0a ("id absent?") and D0b ("id is string?"). D0a=True skips id validation and merges directly into D1 via m0. D0a=False evaluates D0b; D0b=True merges into D1 via m0; D0b=False routes to mFail.',
        '3) All three predicate combinations are covered: TC1 (D0a=T), TC2 (D0a=F, D0b=F), TC3 (D0a=F, D0b=T). TC3 is an independent path in its own right because it exercises the distinct D0a→D0b→m0 edge sequence.',
        '4) TC4–TC14 all reach mFail and retErr, already covered by TC2; statementCoverage is false for those TCs.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

const workoutSessionExercisesUpdateSchemaWbt: WbtDescriptor = {
    reqId: 'SCHEMA-17',
    statement: 'workoutSessionExercisesUpdateSchema.safeParse(inputData) - validates a list of exercise update entries, requiring at least one.',
    data: 'Input: any',
    precondition: 'inputData is an array of exercise update entry objects.',
    results: 'Output: SafeParseSuccess<WorkoutSessionExerciseUpdateInput[]> | SafeParseError<WorkoutSessionExerciseUpdateInput[]>',
    postcondition: 'Return success result if the array has at least one valid entry; otherwise return error result.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit     [label="" shape=circle width=0.25 style=filled fillcolor=black];
  retErr   [label="return {success: false, error}" shape=box];
  retOk    [label="return {success: true, data}"  shape=box];
  D1       [label="input is array?" shape=diamond];
  D2       [label="array length >= 1?" shape=diamond];
  D3       [label="all items valid per workoutSessionExerciseUpdateSchema?" shape=diamond];
  mFail    [label="" shape=circle width=0.18 style=filled fillcolor=black];
  mExit    [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> D2:n      [label="True"];
  D1:e     -> mFail:ne  [label="False"];
  D2:w     -> D3:n      [label="True"];
  D2:e     -> mFail:ne  [label="False"];
  D3:w     -> retOk:n   [label="True"];
  D3:e     -> mFail:ne  [label="False"];
  mFail    -> retErr:n;
  retOk:s  -> mExit:nw;
  retErr:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const workoutSessionExercisesUpdateSchema = z',
        '    .array(workoutSessionExerciseUpdateSchema)',
        '    .min(1, \'At least one exercise is required\');',
    ],
    cyclomaticComplexity: { cc1Regions: 4, cc2EdgeNodePlus2: 4, cc3PredicatePlus1: 4 },
    predicates: [
        'input is array (D1)',
        'array length >= 1 (D2)',
        'all items valid per workoutSessionExerciseUpdateSchema (D3)',
    ],
    paths: [
        { id: '1', description: 'start -> D1(T) -> D2(T) -> D3(T) -> retOk -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '3', description: 'start -> D1(T) -> D2(F) -> mFail -> retErr -> mExit -> exit' },
        { id: '4', description: 'start -> D1(T) -> D2(T) -> D3(F) -> mFail -> retErr -> mExit -> exit' },
    ],
    hasLoopCoverage: true,
    tcRows: [
        {
            noTc: '1',
            inputData: '[{id="row-1", exerciseId="exercise-1", sets=3, reps=10, weight=50}] (one valid entry with id)',
            expected: 'success: true',
            statementCoverage: true,
            conditionDecision: [
                [true, false], [true, false], [true, false],
            ],
            pathCoverage: [true, false, false, false],
            loopCoverage: { once: true },
        },
        {
            noTc: '2',
            inputData: '"not-an-array" (non-array primitive)',
            expected: 'success: false',
            statementCoverage: true,
            conditionDecision: [
                [false, true], [false, false], [false, false],
            ],
            pathCoverage: [false, true, false, false],
            loopCoverage: { no: true },
        },
        {
            noTc: '3',
            inputData: '[] (empty array)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [false, true], [false, false],
            ],
            pathCoverage: [false, false, true, false],
            loopCoverage: { no: true },
        },
        {
            noTc: '4',
            inputData: '[{exerciseId="", sets=3, reps=10, weight=50}] (one invalid entry — empty exerciseId)',
            expected: 'success: false',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [false, true],
            ],
            pathCoverage: [false, false, false, true],
            loopCoverage: { once: true },
        },
        {
            noTc: '5',
            inputData: 'Two valid entries',
            expected: 'success: true',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false],
            ],
            pathCoverage: [true, false, false, false],
            loopCoverage: { twice: true },
        },
        {
            noTc: '6',
            inputData: 'Six valid entries',
            expected: 'success: true',
            statementCoverage: false,
            conditionDecision: [
                [true, false], [true, false], [true, false],
            ],
            pathCoverage: [true, false, false, false],
            loopCoverage: { n: true },
        },
    ],
    remarks: [
        '1) statementCoverage is true for TC1 and TC2 as they are the first to reach retOk and retErr respectively.',
        '2) The array schema iterates internally over each element via the Zod engine — the CFG models this as a single D3 predicate node. The loop coverage TCs (once, twice, n) exercise different iteration counts through that internal loop.',
        '3) n is set to 6 as a practical upper bound matching the max sets value in workoutSessionExerciseUpdateSchema. The schema imposes no upper bound on array length so nMinus1 and nPlus1 variants exercise no new CFG edges and are omitted.',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    coveragePercent: '100%',
};

const isoDateRegexWbt: WbtDescriptor = {
    reqId: 'SCHEMA-18',
    statement: 'isoDateRegex.test(input) - validates that a string matches the YYYY-MM-DD ISO date format.',
    data: 'Input: string',
    precondition: 'input is any string value.',
    results: 'Output: boolean',
    postcondition: 'Return true if input matches /^\\d{4}-\\d{2}-\\d{2}$/; otherwise return false.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  D1      [label="input matches /^\\\\d{4}-\\\\d{2}-\\\\d{2}$/?" shape=diamond];
  retTrue [label="return true"  shape=box];
  retFalse[label="return false" shape=box];
  mExit   [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> retTrue:n  [label="True"];
  D1:e     -> retFalse:n [label="False"];
  retTrue:s  -> mExit:nw;
  retFalse:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const isoDateRegex = /^\\d{4}-\\d{2}-\\d{2}$/;',
    ],
    cyclomaticComplexity: { cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2 },
    predicates: ['input matches /^\\d{4}-\\d{2}-\\d{2}$/ (D1)'],
    paths: [
        { id: '1', description: 'start -> D1(T) -> retTrue -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> retFalse -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: '"2024-01-15" - valid YYYY-MM-DD string',
            expected: 'true',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: '"20240115" - missing hyphens',
            expected: 'false',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '3',
            inputData: '"2024-1-5" - single-digit month and day',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '4',
            inputData: '"2024-01-15T00:00:00" - has trailing timestamp',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '5',
            inputData: '"" - empty string',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '6',
            inputData: '"abcd-ef-gh" - non-digit characters in correct positions',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is marked true for TC1 (first to reach retTrue) and TC2 (first to reach retFalse). TC3–TC6 re-execute already-covered statements and add no new SC.',
        '2) TC3–TC6 are boundary inputs for the False branch, each targeting a distinct structural reason the regex can fail (missing separators, short groups, trailing content, empty input, non-digit chars).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    coveragePercent: '100%',
};

const e164PhoneRegexWbt: WbtDescriptor = {
    reqId: 'SCHEMA-19',
    statement: 'e164PhoneRegex.test(input) - validates that a string matches the E.164 phone number format.',
    data: 'Input: string',
    precondition: 'input is any string value.',
    results: 'Output: boolean',
    postcondition: 'Return true if input matches /^\\+?[1-9]\\d{1,14}$/; otherwise return false.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  D1      [label="input matches /^\\\\+?[1-9]\\\\d{1,14}$/?" shape=diamond];
  retTrue [label="return true"  shape=box];
  retFalse[label="return false" shape=box];
  mExit   [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> retTrue:n  [label="True"];
  D1:e     -> retFalse:n [label="False"];
  retTrue:s  -> mExit:nw;
  retFalse:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const e164PhoneRegex = /^\\+?[1-9]\\d{1,14}$/;',
    ],
    cyclomaticComplexity: { cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2 },
    predicates: ['input matches /^\\+?[1-9]\\d{1,14}$/ (D1)'],
    paths: [
        { id: '1', description: 'start -> D1(T) -> retTrue -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> retFalse -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: '"+14155552671" - valid E.164 with leading plus',
            expected: 'true',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: '"14155552671" - valid E.164 without leading plus',
            expected: 'true',
            statementCoverage: false,
            conditionDecision: [[true, false]],
            pathCoverage: [true, false],
        },
        {
            noTc: '3',
            inputData: '"1" - single digit, below minimum length (d{1,14} requires at least 1 digit after first)',
            expected: 'false',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '4',
            inputData: '"+01234567890" - starts with 0 after plus, violates [1-9]',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '5',
            inputData: '"+1415555267100000" - 17 digits total, exceeds max length',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '6',
            inputData: '"+1-415-555-2671" - contains hyphens',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '7',
            inputData: '"" - empty string',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is marked true for TC1 (first to reach retTrue) and TC3 (first to reach retFalse). TC2 re-executes retTrue with no plus variant; TC4–TC7 re-execute retFalse - none add new SC.',
        '2) TC3–TC7 are boundary inputs for the False branch, each targeting a distinct structural reason the regex can fail (too short, leading zero, too long, non-digit separators, empty input).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    coveragePercent: '100%',
};

const emailRegexWbt: WbtDescriptor = {
    reqId: 'SCHEMA-20',
    statement: 'emailRegex.test(input) - validates that a string matches the simplified RFC 5321 email format.',
    data: 'Input: string',
    precondition: 'input is any string value.',
    results: 'Output: boolean',
    postcondition: 'Return true if input matches /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/; otherwise return false.',
    cfgDot: `digraph CFG {
  rankdir=TB;
  splines=polyline;
  node [fontname="Helvetica" fontsize=11 margin="0.2,0.1"];
  edge [fontname="Helvetica" fontsize=10 arrowsize=0.8];

  start   [label="" shape=circle width=0.25 style=filled fillcolor=black];
  exit    [label="" shape=circle width=0.25 style=filled fillcolor=black];
  D1      [label="input matches /^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$/?" shape=diamond];
  retTrue [label="return true"  shape=box];
  retFalse[label="return false" shape=box];
  mExit   [label="" shape=circle width=0.18 style=filled fillcolor=black];

  start    -> D1:n;
  D1:w     -> retTrue:n  [label="True"];
  D1:e     -> retFalse:n [label="False"];
  retTrue:s  -> mExit:nw;
  retFalse:s -> mExit:ne;
  mExit    -> exit;
}`,
    cfgSourceCode: [
        'export const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;',
    ],
    cyclomaticComplexity: { cc1Regions: 2, cc2EdgeNodePlus2: 2, cc3PredicatePlus1: 2 },
    predicates: ['input matches /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ (D1)'],
    paths: [
        { id: '1', description: 'start -> D1(T) -> retTrue -> mExit -> exit' },
        { id: '2', description: 'start -> D1(F) -> retFalse -> mExit -> exit' },
    ],
    hasLoopCoverage: false,
    tcRows: [
        {
            noTc: '1',
            inputData: '"user@example.com" - valid standard email',
            expected: 'true',
            statementCoverage: true,
            conditionDecision: [[true, false]],
            pathCoverage: [true, false],
        },
        {
            noTc: '2',
            inputData: '"user+tag@sub.domain.org" - valid email with plus tag and subdomain',
            expected: 'true',
            statementCoverage: false,
            conditionDecision: [[true, false]],
            pathCoverage: [true, false],
        },
        {
            noTc: '3',
            inputData: '"userexample.com" - missing @ symbol',
            expected: 'false',
            statementCoverage: true,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '4',
            inputData: '"user@" - missing domain part entirely',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '5',
            inputData: '"user@example" - missing dot and TLD',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '6',
            inputData: '"user @example.com" - space in local part',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '7',
            inputData: '"@example.com" - empty local part',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '8',
            inputData: '"user@.com" - empty domain label before dot',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
        {
            noTc: '9',
            inputData: '"" - empty string',
            expected: 'false',
            statementCoverage: false,
            conditionDecision: [[false, true]],
            pathCoverage: [false, true],
        },
    ],
    remarks: [
        '1) statementCoverage is marked true for TC1 (first to reach retTrue) and TC3 (first to reach retFalse). TC2 and TC4–TC9 re-execute already-covered statements and add no new SC.',
        '2) TC3–TC9 are boundary inputs for the False branch, each targeting a distinct structural reason the regex can fail (missing @, empty domain, missing TLD, whitespace in local part, empty local part, empty domain label, empty string).',
    ],
    tcsFailed: 0,
    bugsFound: 0,
    bugsFixed: 'n/a',
    retested: 'not yet',
    retestRun: 0,
    coveragePercent: '100%',
};

async function main(): Promise<void> {
    console.log('Generating schema WBT forms…');
    await writeWbt(createExerciseSchemaWbt, path.join(BASE, 'exercise-schema', 'createExerciseSchema-wbt-form.xlsx'));
    await writeWbt(updateExerciseSchemaWbt, path.join(BASE, 'exercise-schema', 'updateExerciseSchema-wbt-form.xlsx'));
    await writeWbt(memberProgressReportSchemaWbt, path.join(BASE, 'report-schema', 'memberProgressReportSchema-wbt-form.xlsx'));
    await writeWbt(createMemberSchemaWbt, path.join(BASE, 'user-schema', 'createMemberSchema-wbt-form.xlsx'));
    await writeWbt(updateMemberSchemaWbt, path.join(BASE, 'user-schema', 'updateMemberSchema-wbt-form.xlsx'));
    await writeWbt(loginUserSchemaWbt, path.join(BASE, 'user-schema', 'loginUserSchema-wbt-form.xlsx'));
    await writeWbt(createMemberWithTempPasswordSchemaWbt, path.join(BASE, 'user-schema', 'createMemberWithTempPasswordSchema-wbt-form.xlsx'));
    await writeWbt(createUserSchemaWbt, path.join(BASE, 'user-schema', 'createUserSchema-wbt-form.xlsx'));
    await writeWbt(updateUserSchemaWbt, path.join(BASE, 'user-schema', 'updateUserSchema-wbt-form.xlsx'));
    await writeWbt(createAdminSchemaWbt, path.join(BASE, 'user-schema', 'createAdminSchema-wbt-form.xlsx'));
    await writeWbt(updateAdminSchemaWbt, path.join(BASE, 'user-schema', 'updateAdminSchema-wbt-form.xlsx'));
    await writeWbt(createWorkoutSessionSchemaWbt, path.join(BASE, 'workout-session-schema', 'createWorkoutSessionSchema-wbt-form.xlsx'));
    await writeWbt(updateWorkoutSessionSchemaWbt, path.join(BASE, 'workout-session-schema', 'updateWorkoutSessionSchema-wbt-form.xlsx'));
    await writeWbt(workoutSessionExerciseSchemaWbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExerciseSchema-wbt-form.xlsx'));
    await writeWbt(workoutSessionExercisesSchemaWbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExercisesSchema-wbt-form.xlsx'));
    await writeWbt(workoutSessionExerciseUpdateSchemaWbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExerciseUpdateSchema-wbt-form.xlsx'));
    await writeWbt(workoutSessionExercisesUpdateSchemaWbt, path.join(BASE, 'workout-session-schema', 'workoutSessionExercisesUpdateSchema-wbt-form.xlsx'));
    await writeWbt(isoDateRegexWbt, path.join(BASE, 'utils', 'isoDateRegexWbt-wbt-form.xlsx'));
    await writeWbt(e164PhoneRegexWbt, path.join(BASE, 'utils', 'e164PhoneRegexWbt-wbt-form.xlsx'));
    await writeWbt(emailRegexWbt, path.join(BASE, 'utils', 'emailRegexWbt-wbt-form.xlsx'));
    console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
