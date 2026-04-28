import {render, screen} from '@testing-library/react';
import {Pagination} from '@/components/layout/pagination';

describe('Pagination', () => {

    describe('null rendering — single page', () => {

        it('pagination_totalFitsOnOnePage_rendersNothing', () => {
            // Arrange
            const {container} = render(
                <Pagination page={1} pageSize={10} total={5} baseUrl="/exercises"/>,
            );

            // Assert
            expect(container.firstChild).toBeNull();
        });

        it('pagination_totalExactlyEqualsPageSize_rendersNothing', () => {
            // Arrange
            const {container} = render(
                <Pagination page={1} pageSize={10} total={10} baseUrl="/exercises"/>,
            );

            // Assert
            expect(container.firstChild).toBeNull();
        });

    });

    describe('page label', () => {

        it('pagination_multiPage_displaysPageOfTotalLabel', () => {
            // Arrange
            render(<Pagination page={1} pageSize={10} total={25} baseUrl="/exercises"/>);

            // Assert
            expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
        });

        it('pagination_middlePage_displaysCorrectPageLabel', () => {
            // Arrange
            render(<Pagination page={2} pageSize={10} total={25} baseUrl="/exercises"/>);

            // Assert
            expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
        });

    });

    describe('Previous / Next link visibility', () => {

        it('pagination_firstPage_showsNextLinkOnly', () => {
            // Arrange
            render(<Pagination page={1} pageSize={10} total={25} baseUrl="/exercises"/>);

            // Assert
            expect(screen.getByRole('button', {name: /next/i})).toBeInTheDocument();
            expect(screen.queryByRole('button', {name: /previous/i})).not.toBeInTheDocument();
        });

        it('pagination_lastPage_showsPreviousLinkOnly', () => {
            // Arrange
            render(<Pagination page={3} pageSize={10} total={25} baseUrl="/exercises"/>);

            // Assert
            expect(screen.getByRole('button', {name: /previous/i})).toBeInTheDocument();
            expect(screen.queryByRole('button', {name: /next/i})).not.toBeInTheDocument();
        });

        it('pagination_middlePage_showsBothLinks', () => {
            // Arrange
            render(<Pagination page={2} pageSize={10} total={25} baseUrl="/exercises"/>);

            // Assert
            expect(screen.getByRole('button', {name: /previous/i})).toBeInTheDocument();
            expect(screen.getByRole('button', {name: /next/i})).toBeInTheDocument();
        });

    });

    describe('link href construction', () => {

        it('pagination_previousLink_hrefPointsToPreviousPage', () => {
            // Arrange
            render(<Pagination page={2} pageSize={10} total={25} baseUrl="/exercises"/>);

            // Assert
            const prev = screen.getByRole('button', {name: /previous/i});
            expect(prev).toHaveAttribute('href', expect.stringContaining('page=1'));
        });

        it('pagination_nextLink_hrefPointsToNextPage', () => {
            // Arrange
            render(<Pagination page={2} pageSize={10} total={25} baseUrl="/exercises"/>);

            // Assert
            const next = screen.getByRole('button', {name: /next/i});
            expect(next).toHaveAttribute('href', expect.stringContaining('page=3'));
        });

        it('pagination_searchParamsProvided_preservedInLinkHrefs', () => {
            // Arrange
            render(
                <Pagination
                    page={1}
                    pageSize={10}
                    total={25}
                    baseUrl="/exercises"
                    searchParams={{search: 'squat'}}
                />,
            );

            // Assert
            const next = screen.getByRole('button', {name: /next/i});
            expect(next).toHaveAttribute('href', expect.stringContaining('search=squat'));
            expect(next).toHaveAttribute('href', expect.stringContaining('page=2'));
        });

        it('pagination_noSearchParams_linksContainOnlyPageParam', () => {
            // Arrange
            render(<Pagination page={1} pageSize={10} total={25} baseUrl="/exercises"/>);

            // Assert
            const next = screen.getByRole('button', {name: /next/i});
            expect(next).toHaveAttribute('href', expect.stringContaining('page=2'));
        });

    });

});