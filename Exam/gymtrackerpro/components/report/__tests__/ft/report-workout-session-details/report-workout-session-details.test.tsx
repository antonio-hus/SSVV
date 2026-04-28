import {render, screen} from '@testing-library/react';
import type {Report} from '@/lib/domain/report';
import {ReportWorkoutSessionDetails} from '@/components/report/report-workout-session-details';

type Session = Report['sessionDetails'][number];

const mockSession: Session = {
    sessionId: 'sess-1',
    date: new Date('2024-01-15'),
    durationMinutes: 45,
    totalVolume: 10000,
    notes: 'Felt strong today',
    exercises: [
        {
            exerciseId: 'ex-1',
            exerciseName: 'Bench Press',
            sets: 3,
            reps: 10,
            weight: 80,
            volume: 2400
        },
    ],
};

const mockSecondSession: Session = {
    sessionId: 'sess-2',
    date: new Date('2024-01-22'),
    durationMinutes: 60,
    totalVolume: 12000,
    notes: undefined,
    exercises: [
        {
            exerciseId: 'ex-2',
            exerciseName: 'Deadlift',
            sets: 4,
            reps: 5,
            weight: 120,
            volume: 2400
        },
    ],
};

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ReportWorkoutSessionDetails', () => {

    describe('empty state', () => {

        it('reportWorkoutSessionDetails_emptySessions_rendersNothing', () => {
            // Arrange
            const {container} = render(<ReportWorkoutSessionDetails sessions={[]}/>);

            // Assert
            expect(container.firstChild).toBeNull();
        });

    });

    describe('default rendering', () => {

        it('reportWorkoutSessionDetails_nonEmptySessions_rendersSessionDetailsHeading', () => {
            // Arrange
            render(<ReportWorkoutSessionDetails sessions={[mockSession]}/>);

            // Assert
            expect(screen.getByRole('heading', {name: 'Session Details'})).toBeInTheDocument();
        });

        it('reportWorkoutSessionDetails_sessionDate_formattedWithToLocaleDateString', () => {
            // Arrange
            render(<ReportWorkoutSessionDetails sessions={[mockSession]}/>);

            // Assert
            expect(
                screen.getByText(new Date('2024-01-15').toLocaleDateString()),
            ).toBeInTheDocument();
        });

        it('reportWorkoutSessionDetails_sessionDurationAndVolume_renderedInCorrectFormat', () => {
            // Arrange
            render(<ReportWorkoutSessionDetails sessions={[mockSession]}/>);

            // Assert
            expect(
                screen.getByText(`45 min · ${(10000).toLocaleString()} kg`),
            ).toBeInTheDocument();
        });

    });

    describe('notes', () => {

        it('reportWorkoutSessionDetails_sessionNotesPresent_rendersNotesText', () => {
            // Arrange
            render(<ReportWorkoutSessionDetails sessions={[mockSession]}/>);

            // Assert
            expect(screen.getByText('Felt strong today')).toBeInTheDocument();
        });

        it('reportWorkoutSessionDetails_sessionNotesAbsent_doesNotRenderNotesParagraph', () => {
            // Arrange
            render(
                <ReportWorkoutSessionDetails
                    sessions={[{...mockSession, notes: undefined}]}
                />,
            );

            // Assert
            expect(screen.queryByText('Felt strong today')).toBeNull();
        });

    });

    describe('exercise rows', () => {

        it('reportWorkoutSessionDetails_exerciseRow_rendersNameAndSetsRepsWeightFormat', () => {
            // Arrange
            render(<ReportWorkoutSessionDetails sessions={[mockSession]}/>);

            // Assert
            expect(screen.getByText('Bench Press')).toBeInTheDocument();
            expect(screen.getByText('3×10 @ 80 kg')).toBeInTheDocument();
        });

    });

    describe('multiple sessions', () => {

        it('reportWorkoutSessionDetails_multipleSessions_rendersOneCardPerSession', () => {
            // Arrange
            render(
                <ReportWorkoutSessionDetails sessions={[mockSession, mockSecondSession]}/>,
            );

            // Assert
            expect(
                screen.getByText(new Date(mockSession.date).toLocaleDateString()),
            ).toBeInTheDocument();
            expect(
                screen.getByText(new Date(mockSecondSession.date).toLocaleDateString()),
            ).toBeInTheDocument();
        });

    });

});