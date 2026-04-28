import {render, screen} from '@testing-library/react';
import {PageHeader} from '@/components/layout/page-header';

describe('PageHeader', () => {

    describe('title rendering', () => {

        it('pageHeader_titleOnly_rendersH1WithTitleText', () => {
            // Arrange
            render(<PageHeader title="Exercises" />);

            // Assert
            expect(screen.getByRole('heading', {level: 1, name: 'Exercises'})).toBeInTheDocument();
        });

    });

    describe('optional description prop', () => {

        it('pageHeader_descriptionProvided_rendersDescriptionText', () => {
            // Arrange
            render(<PageHeader title="Exercises" description="Browse your exercise library." />);

            // Assert
            expect(screen.getByText('Browse your exercise library.')).toBeInTheDocument();
        });

        it('pageHeader_descriptionOmitted_descriptionElementAbsent', () => {
            // Arrange
            render(<PageHeader title="Exercises" />);

            // Assert
            expect(screen.queryByText('Browse your exercise library.')).not.toBeInTheDocument();
        });

    });

    describe('optional children prop', () => {

        it('pageHeader_singleChild_rendersChildOnRight', () => {
            // Arrange
            render(
                <PageHeader title="Exercises">
                    <button>Add</button>
                </PageHeader>,
            );

            // Assert
            expect(screen.getByRole('button', {name: 'Add'})).toBeInTheDocument();
        });

        it('pageHeader_multipleChildren_rendersAllChildren', () => {
            // Arrange
            render(
                <PageHeader title="Exercises">
                    <button>Import</button>
                    <button>Add</button>
                </PageHeader>,
            );

            // Assert
            expect(screen.getByRole('button', {name: 'Import'})).toBeInTheDocument();
            expect(screen.getByRole('button', {name: 'Add'})).toBeInTheDocument();
        });

        it('pageHeader_noChildren_childrenWrapperAbsent', () => {
            // Arrange
            render(<PageHeader title="Exercises" />);

            // Assert
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

    });

    describe('description and children combined', () => {

        it('pageHeader_descriptionAndChildren_allElementsPresent', () => {
            // Arrange
            render(
                <PageHeader title="Exercises" description="Browse your library.">
                    <button>Add</button>
                </PageHeader>,
            );

            // Assert
            expect(screen.getByRole('heading', {level: 1, name: 'Exercises'})).toBeInTheDocument();
            expect(screen.getByText('Browse your library.')).toBeInTheDocument();
            expect(screen.getByRole('button', {name: 'Add'})).toBeInTheDocument();
        });

    });

});