import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useRouter, usePathname, useSearchParams} from 'next/navigation';
import {ReportFilter} from '@/components/report/report-filter';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

beforeEach(() => {
    mockUseRouter.mockReturnValue({push: mockPush} as unknown as ReturnType<typeof useRouter>);
    mockUsePathname.mockReturnValue('/reports');
    mockUseSearchParams.mockReturnValue({get: () => null} as unknown as ReturnType<typeof useSearchParams>);
    jest.clearAllMocks();
});

describe('ReportFilter', () => {

    describe('default rendering', () => {

        it('reportFilter_defaultRender_rendersEmptyInputsAndEnabledSubmitButton', () => {
            // Arrange
            mockUseSearchParams.mockReturnValue({get: () => null} as unknown as ReturnType<typeof useSearchParams>);
            render(<ReportFilter/>);

            // Assert
            expect(screen.getByLabelText('Start Date')).toHaveValue('');
            expect(screen.getByLabelText('End Date')).toHaveValue('');
            expect(screen.getByRole('button', {name: 'Generate Report'})).toBeEnabled();
        });

        it('reportFilter_bothInputs_haveRequiredAttribute', () => {
            // Arrange
            mockUseSearchParams.mockReturnValue({get: () => null} as unknown as ReturnType<typeof useSearchParams>);
            render(<ReportFilter/>);

            // Assert
            expect(screen.getByLabelText('Start Date')).toHaveAttribute('required');
            expect(screen.getByLabelText('End Date')).toHaveAttribute('required');
        });

    });

    describe('search param seeding', () => {

        it('reportFilter_startDateInSearchParams_prefillsStartDateInput', () => {
            // Arrange
            mockUseSearchParams.mockReturnValue({
                get: (key: string) => key === 'startDate' ? '2024-01-01' : null,
            } as unknown as ReturnType<typeof useSearchParams>);
            render(<ReportFilter/>);

            // Assert
            expect(screen.getByLabelText('Start Date')).toHaveValue('2024-01-01');
        });

        it('reportFilter_endDateInSearchParams_prefillsEndDateInput', () => {
            // Arrange
            mockUseSearchParams.mockReturnValue({
                get: (key: string) => key === 'endDate' ? '2024-01-31' : null,
            } as unknown as ReturnType<typeof useSearchParams>);
            render(<ReportFilter/>);

            // Assert
            expect(screen.getByLabelText('End Date')).toHaveValue('2024-01-31');
        });

    });

    describe('user input', () => {

        it('reportFilter_userTypesInStartDateInput_updatesInputValue', async () => {
            // Arrange
            const user = userEvent.setup();
            mockUseSearchParams.mockReturnValue({get: () => null} as unknown as ReturnType<typeof useSearchParams>);
            render(<ReportFilter/>);

            // Act
            await user.type(screen.getByLabelText('Start Date'), '2024-01-15');

            // Assert
            expect(screen.getByLabelText('Start Date')).toHaveValue('2024-01-15');
        });

        it('reportFilter_userTypesInEndDateInput_updatesInputValue', async () => {
            // Arrange
            const user = userEvent.setup();
            mockUseSearchParams.mockReturnValue({get: () => null} as unknown as ReturnType<typeof useSearchParams>);
            render(<ReportFilter/>);

            // Act
            await user.type(screen.getByLabelText('End Date'), '2024-01-31');

            // Assert
            expect(screen.getByLabelText('End Date')).toHaveValue('2024-01-31');
        });

    });

    describe('form submission', () => {

        it('reportFilter_formSubmitted_callsRouterPushWithCorrectUrl', async () => {
            // Arrange
            const user = userEvent.setup();
            mockUsePathname.mockReturnValue('/reports');
            mockUseSearchParams.mockReturnValue({
                get: (key: string) => key === 'startDate' ? '2024-01-01' : '2024-01-31',
            } as unknown as ReturnType<typeof useSearchParams>);
            render(<ReportFilter/>);

            // Act
            await user.click(screen.getByRole('button', {name: 'Generate Report'}));

            // Assert
            expect(mockPush).toHaveBeenCalledTimes(1);
            expect(mockPush).toHaveBeenCalledWith('/reports?startDate=2024-01-01&endDate=2024-01-31');
        });

    });

});