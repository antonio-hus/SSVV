import {render, screen} from '@testing-library/react';
import type {IronSession} from 'iron-session';
import {getSession} from '@/lib/session';
import {listMembers} from '@/lib/controller/user-controller';
import type {SessionData} from '@/lib/domain/session';
import AdminDashboardPage from '@/app/admin/dashboard/page';

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    listMembers: jest.fn(),
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockListMembers = listMembers as jest.MockedFunction<typeof listMembers>;

const mockSessionWithFullName = (fullName: string | null) => ({
    userId: 'u-1',
    email: 'admin@example.com',
    fullName,
    role: 'ADMIN',
} as IronSession<SessionData>);

beforeEach(() => {
    jest.clearAllMocks();
});

describe('AdminDashboardPage', () => {

    it('adminDashboardPage_fullNameDefined_showsPersonalizedHeadingAndDescription', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithFullName('John Smith'));
        mockListMembers.mockResolvedValueOnce({
            success: true,
            data: {items: [], total: 12},
        });

        render(await AdminDashboardPage());

        // Assert
        expect(screen.getByRole('heading', {name: 'Welcome, John Smith'})).toBeInTheDocument();
        expect(screen.getByText('Admin dashboard overview')).toBeInTheDocument();
    });

    it('adminDashboardPage_fullNameNull_showsAdminFallbackHeading', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithFullName(null));
        mockListMembers.mockResolvedValueOnce({
            success: true,
            data: {items: [], total: 4},
        });

        render(await AdminDashboardPage());

        // Assert
        expect(screen.getByRole('heading', {name: 'Welcome, Admin'})).toBeInTheDocument();
    });

    it('adminDashboardPage_membersLoadSucceeds_showsTotalMembersStatCard', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithFullName('Admin User'));
        mockListMembers.mockResolvedValueOnce({
            success: true,
            data: {items: [], total: 27},
        });

        render(await AdminDashboardPage());

        // Assert
        expect(screen.getByText('Total Members')).toBeInTheDocument();
        expect(screen.getByText('27')).toBeInTheDocument();
        expect(screen.getByText('Registered gym members')).toBeInTheDocument();
    });

    it('adminDashboardPage_membersLoadFails_showsZeroTotalMembers', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithFullName('Admin User'));
        mockListMembers.mockResolvedValueOnce({
            success: false,
            message: 'Could not load members',
        });

        render(await AdminDashboardPage());

        // Assert
        expect(screen.getByText('Total Members')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('adminDashboardPage_defaultRender_callsSessionAndListMembersWithDashboardQuery', async () => {
        // Arrange
        mockGetSession.mockResolvedValueOnce(mockSessionWithFullName('Admin User'));
        mockListMembers.mockResolvedValueOnce({
            success: true,
            data: {items: [], total: 8},
        });

        render(await AdminDashboardPage());

        // Assert
        expect(mockGetSession).toHaveBeenCalledTimes(1);
        expect(mockListMembers).toHaveBeenCalledTimes(1);
        expect(mockListMembers).toHaveBeenCalledWith({page: 1, pageSize: 1});
    });

});
