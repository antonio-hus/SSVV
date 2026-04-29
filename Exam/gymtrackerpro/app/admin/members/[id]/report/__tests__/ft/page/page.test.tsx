import {render, screen} from '@testing-library/react';
import {notFound, usePathname, useRouter, useSearchParams} from 'next/navigation';
import {getMember} from '@/lib/controller/user-controller';
import {getMemberProgressReport} from '@/lib/controller/report-controller';
import AdminMemberReportPage from '@/app/admin/members/[id]/report/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('next/navigation', () => ({
    notFound: jest.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    getMember: jest.fn(),
}));

jest.mock('@/lib/controller/report-controller', () => ({
    getMemberProgressReport: jest.fn(),
}));

const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockGetMemberProgressReport = getMemberProgressReport as jest.MockedFunction<typeof getMemberProgressReport>;
const mockPush = jest.fn();

const mockMember = {
    id: 'mem-1',
    userId: 'user-1',
    membershipStart: new Date('2025-01-15T00:00:00.000Z'),
    isActive: true,
    user: {
        id: 'user-1',
        email: 'john@example.com',
        fullName: 'John Smith',
        phone: '+12345678901',
        dateOfBirth: new Date('1990-03-10T00:00:00.000Z'),
        passwordHash: 'hash',
        role: 'MEMBER' as const,
    },
};

const mockReport = {
    memberId: 'mem-1',
    memberName: 'John Smith',
    startDate: new Date('2026-01-01T00:00:00.000Z'),
    endDate: new Date('2026-01-31T00:00:00.000Z'),
    totalSessions: 3,
    totalVolume: 12345,
    averageSessionDuration: 47,
    exerciseBreakdown: [
        {
            exerciseId: 'ex-1',
            exerciseName: 'Barbell Bench Press',
            muscleGroup: 'CHEST',
            totalSets: 9,
            totalReps: 90,
            totalVolume: 7200,
            sessionCount: 3,
        },
    ],
    sessionDetails: [
        {
            sessionId: 'session-1',
            date: new Date('2026-01-10T00:00:00.000Z'),
            durationMinutes: 45,
            notes: 'Strong session',
            totalVolume: 7200,
            exercises: [
                {
                    exerciseId: 'ex-1',
                    exerciseName: 'Barbell Bench Press',
                    sets: 3,
                    reps: 10,
                    weight: 80,
                    volume: 2400,
                },
            ],
        },
    ],
};

const mockSearchParams = (params: Record<string, string> = {}) => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(params));
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    (usePathname as jest.Mock).mockReturnValue('/admin/members/mem-1/report');
    mockSearchParams();
    jest.clearAllMocks();
});

describe('AdminMemberReportPage', () => {

    it('adminMemberReportPage_noDateRange_rendersHeaderFilterAndDoesNotFetchReport', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});

        render(await AdminMemberReportPage({
            params: Promise.resolve({id: 'mem-1'}),
            searchParams: Promise.resolve({}),
        }));

        // Assert
        expect(screen.getByRole('heading', {name: 'Report: John Smith'})).toBeInTheDocument();
        expect(screen.getByText('Workout progress over a date range')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back'})).toHaveAttribute('href', '/admin/members/mem-1');
        expect(screen.getByLabelText('Start Date')).toHaveValue('');
        expect(screen.getByLabelText('End Date')).toHaveValue('');
        expect(screen.getByRole('button', {name: 'Generate Report'})).toBeEnabled();
        expect(mockGetMember).toHaveBeenCalledWith('mem-1');
        expect(mockGetMemberProgressReport).not.toHaveBeenCalled();
    });

    it('adminMemberReportPage_startDateOnly_seedsStartDateAndDoesNotFetchReport', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});
        mockSearchParams({startDate: '2026-01-01'});

        render(await AdminMemberReportPage({
            params: Promise.resolve({id: 'mem-1'}),
            searchParams: Promise.resolve({startDate: '2026-01-01'}),
        }));

        // Assert
        expect(screen.getByLabelText('Start Date')).toHaveValue('2026-01-01');
        expect(screen.getByLabelText('End Date')).toHaveValue('');
        expect(mockGetMemberProgressReport).not.toHaveBeenCalled();
    });

    it('adminMemberReportPage_endDateOnly_seedsEndDateAndDoesNotFetchReport', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});
        mockSearchParams({endDate: '2026-01-31'});

        render(await AdminMemberReportPage({
            params: Promise.resolve({id: 'mem-1'}),
            searchParams: Promise.resolve({endDate: '2026-01-31'}),
        }));

        // Assert
        expect(screen.getByLabelText('Start Date')).toHaveValue('');
        expect(screen.getByLabelText('End Date')).toHaveValue('2026-01-31');
        expect(mockGetMemberProgressReport).not.toHaveBeenCalled();
    });

    it('adminMemberReportPage_dateRangeProvided_fetchesAndRendersReportSections', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});
        mockGetMemberProgressReport.mockResolvedValueOnce({success: true, data: mockReport});
        mockSearchParams({
            startDate: '2026-01-01',
            endDate: '2026-01-31',
        });

        render(await AdminMemberReportPage({
            params: Promise.resolve({id: 'mem-1'}),
            searchParams: Promise.resolve({startDate: '2026-01-01', endDate: '2026-01-31'}),
        }));

        // Assert
        expect(screen.getByLabelText('Start Date')).toHaveValue('2026-01-01');
        expect(screen.getByLabelText('End Date')).toHaveValue('2026-01-31');
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('12,345 kg')).toBeInTheDocument();
        expect(screen.getByText('Exercise Breakdown')).toBeInTheDocument();
        expect(screen.getAllByText('Barbell Bench Press')).toHaveLength(2);
        expect(screen.getByText('Session Details')).toBeInTheDocument();
        expect(mockGetMemberProgressReport).toHaveBeenCalledTimes(1);
        expect(mockGetMemberProgressReport).toHaveBeenCalledWith('mem-1', '2026-01-01', '2026-01-31');
    });

    it('adminMemberReportPage_emptySuccessfulReport_rendersStatsWithoutOptionalDetailSections', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});
        mockGetMemberProgressReport.mockResolvedValueOnce({
            success: true,
            data: {
                ...mockReport,
                totalSessions: 0,
                totalVolume: 0,
                averageSessionDuration: 0,
                exerciseBreakdown: [],
                sessionDetails: [],
            },
        });
        mockSearchParams({
            startDate: '2026-01-01',
            endDate: '2026-01-31',
        });

        render(await AdminMemberReportPage({
            params: Promise.resolve({id: 'mem-1'}),
            searchParams: Promise.resolve({startDate: '2026-01-01', endDate: '2026-01-31'}),
        }));

        // Assert
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('0 kg')).toBeInTheDocument();
        expect(screen.queryByText('Exercise Breakdown')).not.toBeInTheDocument();
        expect(screen.queryByText('Session Details')).not.toBeInTheDocument();
        expect(mockGetMemberProgressReport).toHaveBeenCalledWith('mem-1', '2026-01-01', '2026-01-31');
    });

    it('adminMemberReportPage_reportFails_showsErrorAlertAndDoesNotRenderReportSections', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: true, data: mockMember});
        mockGetMemberProgressReport.mockResolvedValueOnce({
            success: false,
            message: 'Could not build report',
        });
        mockSearchParams({
            startDate: '2026-01-01',
            endDate: '2026-01-31',
        });

        render(await AdminMemberReportPage({
            params: Promise.resolve({id: 'mem-1'}),
            searchParams: Promise.resolve({startDate: '2026-01-01', endDate: '2026-01-31'}),
        }));

        // Assert
        expect(screen.getByText('Could not build report')).toBeInTheDocument();
        expect(screen.queryByText('Total Sessions')).not.toBeInTheDocument();
        expect(mockGetMemberProgressReport).toHaveBeenCalledTimes(1);
        expect(mockGetMemberProgressReport).toHaveBeenCalledWith('mem-1', '2026-01-01', '2026-01-31');
    });

    it('adminMemberReportPage_getMemberFails_callsNotFoundAndDoesNotFetchReport', async () => {
        // Arrange
        mockGetMember.mockResolvedValueOnce({success: false, message: 'Member not found'});

        // Act
        let caughtError: Error | undefined;
        try {
            await AdminMemberReportPage({
                params: Promise.resolve({id: 'missing-member'}),
                searchParams: Promise.resolve({startDate: '2026-01-01', endDate: '2026-01-31'}),
            });
        } catch (e) {
            caughtError = e as Error;
        }

        // Assert
        expect(caughtError?.message).toBe('NEXT_NOT_FOUND');
        expect(mockGetMember).toHaveBeenCalledWith('missing-member');
        expect(mockNotFound).toHaveBeenCalledTimes(1);
        expect(mockGetMemberProgressReport).not.toHaveBeenCalled();
    });

});
