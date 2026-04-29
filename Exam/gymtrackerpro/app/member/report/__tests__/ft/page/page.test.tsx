import {render, screen} from '@testing-library/react';
import type {IronSession} from 'iron-session';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {getSession} from '@/lib/session';
import {getMemberProgressReport} from '@/lib/controller/report-controller';
import type {SessionData} from '@/lib/domain/session';
import MemberReportPage from '@/app/member/report/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

jest.mock('@/lib/controller/report-controller', () => ({
    getMemberProgressReport: jest.fn(),
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetMemberProgressReport = getMemberProgressReport as jest.MockedFunction<typeof getMemberProgressReport>;
const mockPush = jest.fn();

const mockSessionWithMember = (memberId: string | null = 'mem-1') => ({
    userId: 'user-1',
    email: 'john@example.com',
    fullName: 'John Smith',
    role: 'MEMBER',
    memberId,
} as IronSession<SessionData>);

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
    (usePathname as jest.Mock).mockReturnValue('/member/report');
    mockSearchParams();
    jest.clearAllMocks();
});

describe('MemberReportPage', () => {

    it('memberReportPage_memberIdMissing_rendersNothingAndDoesNotFetchReport', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember(null));
        mockSearchParams({startDate: '2026-01-01', endDate: '2026-01-31'});

        // Act
        const {container} = render(await MemberReportPage({
            searchParams: Promise.resolve({startDate: '2026-01-01', endDate: '2026-01-31'}),
        }));

        // Assert
        expect(container.firstChild).toBeNull();
        expect(mockGetMemberProgressReport).not.toHaveBeenCalled();
    });

    it('memberReportPage_noDateRange_rendersHeaderEmptyFilterAndDoesNotFetchReport', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());

        render(await MemberReportPage({
            searchParams: Promise.resolve({}),
        }));

        // Assert
        expect(screen.getByRole('heading', {name: 'My Progress Report'})).toBeInTheDocument();
        expect(screen.getByText('View your workout progress over time')).toBeInTheDocument();
        expect(screen.getByLabelText('Start Date')).toHaveValue('');
        expect(screen.getByLabelText('End Date')).toHaveValue('');
        expect(screen.getByRole('button', {name: 'Generate Report'})).toBeEnabled();
        expect(mockGetMemberProgressReport).not.toHaveBeenCalled();
    });

    it('memberReportPage_startDateOnly_seedsStartDateAndDoesNotFetchReport', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockSearchParams({startDate: '2026-01-01'});

        render(await MemberReportPage({
            searchParams: Promise.resolve({startDate: '2026-01-01'}),
        }));

        // Assert
        expect(screen.getByLabelText('Start Date')).toHaveValue('2026-01-01');
        expect(screen.getByLabelText('End Date')).toHaveValue('');
        expect(mockGetMemberProgressReport).not.toHaveBeenCalled();
    });

    it('memberReportPage_endDateOnly_seedsEndDateAndDoesNotFetchReport', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockSearchParams({endDate: '2026-01-31'});

        render(await MemberReportPage({
            searchParams: Promise.resolve({endDate: '2026-01-31'}),
        }));

        // Assert
        expect(screen.getByLabelText('Start Date')).toHaveValue('');
        expect(screen.getByLabelText('End Date')).toHaveValue('2026-01-31');
        expect(mockGetMemberProgressReport).not.toHaveBeenCalled();
    });

    it('memberReportPage_dateRangeProvided_fetchesAndRendersReportSections', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockGetMemberProgressReport.mockResolvedValueOnce({success: true, data: mockReport});
        mockSearchParams({
            startDate: '2026-01-01',
            endDate: '2026-01-31',
        });

        render(await MemberReportPage({
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

    it('memberReportPage_emptySuccessfulReport_rendersStatsWithoutOptionalDetailSections', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
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

        render(await MemberReportPage({
            searchParams: Promise.resolve({startDate: '2026-01-01', endDate: '2026-01-31'}),
        }));

        // Assert
        expect(screen.getByText('Total Sessions')).toBeInTheDocument();
        expect(screen.getByText('0 kg')).toBeInTheDocument();
        expect(screen.queryByText('Exercise Breakdown')).not.toBeInTheDocument();
        expect(screen.queryByText('Session Details')).not.toBeInTheDocument();
        expect(mockGetMemberProgressReport).toHaveBeenCalledWith('mem-1', '2026-01-01', '2026-01-31');
    });

    it('memberReportPage_reportFails_showsErrorAlertAndDoesNotRenderReportSections', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithMember());
        mockGetMemberProgressReport.mockResolvedValueOnce({
            success: false,
            message: 'Could not build report',
        });
        mockSearchParams({
            startDate: '2026-01-01',
            endDate: '2026-01-31',
        });

        render(await MemberReportPage({
            searchParams: Promise.resolve({startDate: '2026-01-01', endDate: '2026-01-31'}),
        }));

        // Assert
        expect(screen.getByText('Could not build report')).toBeInTheDocument();
        expect(screen.queryByText('Total Sessions')).not.toBeInTheDocument();
        expect(mockGetMemberProgressReport).toHaveBeenCalledTimes(1);
        expect(mockGetMemberProgressReport).toHaveBeenCalledWith('mem-1', '2026-01-01', '2026-01-31');
    });

});
