import {render, screen} from '@testing-library/react';
import type {Report} from '@/lib/domain/report';
import {ReportExerciseBreakdown} from '@/components/report/report-exercise-breakdown';

const mockSingleBreakdown: Report['exerciseBreakdown'] = [
    {
        exerciseId: 'ex-1',
        exerciseName: 'Bench Press',
        muscleGroup: 'Chest',
        sessionCount: 3,
        totalSets: 9,
        totalReps: 81,
        totalVolume: 100,
    },
];

const mockMultiBreakdown: Report['exerciseBreakdown'] = [
    {
        exerciseId: 'ex-1',
        exerciseName: 'Bench Press',
        muscleGroup: 'Chest',
        sessionCount: 3,
        totalSets: 9,
        totalReps: 81,
        totalVolume: 100,
    },
    {
        exerciseId: 'ex-2',
        exerciseName: 'Deadlift',
        muscleGroup: 'Back',
        sessionCount: 2,
        totalSets: 6,
        totalReps: 30,
        totalVolume: 200,
    },
];

describe('ReportExerciseBreakdown', () => {

    it('reportExerciseBreakdown_emptyBreakdown_rendersNothing', () => {
        // Arrange
        const {container} = render(<ReportExerciseBreakdown breakdown={[]}/>);

        // Assert
        expect(container.firstChild).toBeNull();
    });

    it('reportExerciseBreakdown_nonEmptyBreakdown_rendersHeadingAndTable', () => {
        // Arrange
        render(<ReportExerciseBreakdown breakdown={mockSingleBreakdown}/>);

        // Assert
        expect(screen.getByRole('heading', {name: 'Exercise Breakdown'})).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('reportExerciseBreakdown_nonEmptyBreakdown_rendersAllColumnHeaders', () => {
        // Arrange
        render(<ReportExerciseBreakdown breakdown={mockSingleBreakdown}/>);

        // Assert
        expect(screen.getByRole('columnheader', {name: 'Exercise'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Muscle Group'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Sessions'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Sets'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Reps'})).toBeInTheDocument();
        expect(screen.getByRole('columnheader', {name: 'Volume'})).toBeInTheDocument();
    });

    it('reportExerciseBreakdown_singleItem_rendersAllCellValuesForThatRow', () => {
        // Arrange
        render(<ReportExerciseBreakdown breakdown={mockSingleBreakdown}/>);

        // Assert
        expect(screen.getByRole('cell', {name: 'Bench Press'})).toBeInTheDocument();
        expect(screen.getByRole('cell', {name: 'Chest'})).toBeInTheDocument();
        expect(screen.getByRole('cell', {name: '3'})).toBeInTheDocument();
        expect(screen.getByRole('cell', {name: '9'})).toBeInTheDocument();
        expect(screen.getByRole('cell', {name: '81'})).toBeInTheDocument();
        expect(screen.getByRole('cell', {name: '100'})).toBeInTheDocument();
    });

    it('reportExerciseBreakdown_multipleItems_rendersOneRowPerEntry', () => {
        // Arrange
        render(<ReportExerciseBreakdown breakdown={mockMultiBreakdown}/>);

        // Assert
        expect(screen.getByRole('cell', {name: 'Bench Press'})).toBeInTheDocument();
        expect(screen.getByRole('cell', {name: 'Deadlift'})).toBeInTheDocument();
    });

    it('reportExerciseBreakdown_totalVolume_isRenderedWithLocaleFormatting', () => {
        // Arrange
        const breakdown: Report['exerciseBreakdown'] = [
            {...mockSingleBreakdown[0], totalVolume: 10000},
        ];
        render(<ReportExerciseBreakdown breakdown={breakdown}/>);

        // Assert
        expect(
            screen.getByRole('cell', {name: (10000).toLocaleString()}),
        ).toBeInTheDocument();
    });

});