import {render, screen} from '@testing-library/react';
import {StatCard} from '@/components/data/stat-card';

describe('StatCard', () => {

    describe('title and value rendering', () => {

        it('statCard_defaultRender_showsTitleAndStringValue', () => {
            // Arrange
            render(<StatCard title="Total Workouts" value="42" />);

            // Assert
            expect(screen.getByText('Total Workouts')).toBeInTheDocument();
            expect(screen.getByText('42')).toBeInTheDocument();
        });

        it('statCard_numericValue_rendersAsText', () => {
            // Arrange
            render(<StatCard title="Sessions" value={7} />);

            // Assert
            expect(screen.getByText('7')).toBeInTheDocument();
        });

        it('statCard_zeroValue_rendersZeroWithoutSuppression', () => {
            // Arrange
            render(<StatCard title="Rest Days" value={0} />);

            // Assert
            expect(screen.getByText('0')).toBeInTheDocument();
        });

        it('statCard_longTitle_rendersWithoutCrash', () => {
            // Arrange
            render(<StatCard title="Average Session Duration This Week" value="52 min" />);

            // Assert
            expect(screen.getByText('Average Session Duration This Week')).toBeInTheDocument();
        });

    });

    describe('optional description prop', () => {

        it('statCard_descriptionProvided_rendersDescriptionText', () => {
            // Arrange
            render(<StatCard title="Streak" value="14 days" description="Personal best" />);

            // Assert
            expect(screen.getByText('Personal best')).toBeInTheDocument();
        });

        it('statCard_descriptionOmitted_descriptionElementAbsent', () => {
            // Arrange
            render(<StatCard title="Streak" value="14 days" />);

            // Assert
            expect(screen.queryByText('Personal best')).not.toBeInTheDocument();
            // Only two text nodes: title + value.
            expect(screen.getByText('Streak')).toBeInTheDocument();
            expect(screen.getByText('14 days')).toBeInTheDocument();
        });

    });

});