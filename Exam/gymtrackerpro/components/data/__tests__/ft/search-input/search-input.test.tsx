import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {SearchInput} from '@/components/data/search-input';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}));

const mockPush = jest.fn();

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    (usePathname as jest.Mock).mockReturnValue('/exercises');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    jest.clearAllMocks();
});

beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    (usePathname as jest.Mock).mockReturnValue('/exercises');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
});

describe('SearchInput', () => {

    describe('initial render', () => {

        it('searchInput_defaultProps_rendersInputWithDefaultPlaceholder', () => {
            // Arrange
            render(<SearchInput />);

            // Assert
            const input = screen.getByRole('textbox');
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('placeholder', 'Search...');
            expect(input).toHaveValue('');
        });

        it('searchInput_customPlaceholder_rendersWithSuppliedPlaceholder', () => {
            // Arrange
            render(<SearchInput placeholder="Filter exercises..." />);

            // Assert
            expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Filter exercises...');
        });

        it('searchInput_searchParamPresentInUrl_initialisesInputFromParam', () => {
            // Arrange
            (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('search=deadlift'));
            render(<SearchInput />);

            // Assert
            expect(screen.getByRole('textbox')).toHaveValue('deadlift');
        });

        it('searchInput_customParamNamePresentInUrl_initialisesFromMatchingParam', () => {
            // Arrange
            (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('q=lunge'));
            render(<SearchInput paramName="q" />);

            // Assert
            expect(screen.getByRole('textbox')).toHaveValue('lunge');
        });

    });

    describe('typing behaviour — query string construction', () => {

        it('searchInput_userTypes_callsRouterPushWithSearchParam', async () => {
            // Arrange
            const user = userEvent.setup();
            render(<SearchInput />);
            const input = screen.getByRole('textbox');

            // Act
            await user.type(input, 'squat');

            // Assert
            expect(mockPush).toHaveBeenCalled();
            const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0] as string;
            expect(lastCall).toContain('search=squat');
            expect(lastCall).toContain('/exercises?');
        });

        it('searchInput_userTypes_removesPageParamFromQueryString', async () => {
            // Arrange
            const user = userEvent.setup();
            (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('search=bench&page=3'));
            render(<SearchInput />);
            const input = screen.getByRole('textbox');

            // Act
            await user.type(input, 'x');

            // Assert
            const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0] as string;
            expect(lastCall).not.toContain('page=');
        });

        it('searchInput_inputCleared_removesSearchParamFromQueryString', async () => {
            // Arrange
            const user = userEvent.setup();
            (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('search=squat'));
            render(<SearchInput />);
            const input = screen.getByRole('textbox');

            // Act
            await user.clear(input);

            // Assert
            const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0] as string;
            expect(lastCall).not.toContain('search=');
        });

        it('searchInput_customParamName_usesCustomKeyInQueryString', async () => {
            // Arrange
            const user = userEvent.setup();
            render(<SearchInput paramName="q" />);
            const input = screen.getByRole('textbox');

            // Act
            await user.type(input, 'press');

            // Assert
            const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0] as string;
            expect(lastCall).toContain('q=press');
            expect(lastCall).not.toContain('search=');
        });

        it('searchInput_existingUnrelatedParam_preservedInQueryString', async () => {
            // Arrange
            const user = userEvent.setup();
            (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('sort=asc'));
            render(<SearchInput />);
            const input = screen.getByRole('textbox');

            // Act
            await user.type(input, 'run');

            // Assert
            const lastCall = mockPush.mock.calls[mockPush.mock.calls.length - 1][0] as string;
            expect(lastCall).toContain('sort=asc');
        });

    });

});