import {render, screen} from '@testing-library/react';
import type {Report} from '@/lib/domain/report';
import {ReportStats} from '@/components/report/report-stats';

const mockReport = {
    totalSessions: 12,
    totalVolume: 10000,
    averageSessionDuration: 45,
} as Report;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('ReportStats', () => {

    describe('card titles', () => {

        it('reportStats_defaultRender_rendersAllThreeCardTitles', () => {
            // Arrange
            render(<ReportStats data={mockReport}/>);

            // Assert
            expect(screen.getByText('Total Sessions')).toBeInTheDocument();
            expect(screen.getByText('Total Volume')).toBeInTheDocument();
            expect(screen.getByText('Avg Duration')).toBeInTheDocument();
        });

    });

    describe('card values', () => {

        it('reportStats_totalSessions_passedDirectlyAsValue', () => {
            // Arrange
            render(<ReportStats data={mockReport}/>);

            // Assert
            expect(screen.getByText('12')).toBeInTheDocument();
        });

        it('reportStats_totalVolume_formattedWithLocaleStringAndKgSuffix', () => {
            // Arrange
            render(<ReportStats data={mockReport}/>);

            // Assert
            expect(screen.getByText(`${(10000).toLocaleString()} kg`)).toBeInTheDocument();
        });

        it('reportStats_averageSessionDuration_roundedAndFormattedWithMinSuffix', () => {
            // Arrange
            render(<ReportStats data={mockReport}/>);

            // Assert
            expect(screen.getByText('45 min')).toBeInTheDocument();
        });

        it('reportStats_averageSessionDurationDecimal_roundsToNearestInteger', () => {
            // Arrange
            render(<ReportStats data={{...mockReport, averageSessionDuration: 45.7}}/>);

            // Assert
            expect(screen.getByText('46 min')).toBeInTheDocument();
        });

    });

    describe('card descriptions', () => {

        it('reportStats_totalVolumeCard_rendersDescriptionText', () => {
            // Arrange
            render(<ReportStats data={mockReport}/>);

            // Assert
            expect(screen.getByText('sets × reps × weight')).toBeInTheDocument();
        });

        it('reportStats_avgDurationCard_rendersDescriptionText', () => {
            // Arrange
            render(<ReportStats data={mockReport}/>);

            // Assert
            expect(screen.getByText('per session')).toBeInTheDocument();
        });

    });

});