import {render, screen} from '@testing-library/react';
import {useRouter, usePathname, redirect} from 'next/navigation';
import type {IronSession} from 'iron-session';
import {getSession} from '@/lib/session';
import {getMember} from '@/lib/controller/user-controller';
import {logout} from '@/lib/controller/auth-controller';
import {Role} from '@/lib/domain/user';
import type {MemberWithUser} from '@/lib/domain/user';
import type {SessionData} from '@/lib/domain/session';
import type {ActionResult} from '@/lib/domain/action-result';
import MemberLayout from '@/app/member/layout';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn((url: string) => {
        throw new Error(`REDIRECT:${url}`);
    }),
    usePathname: jest.fn(),
    useRouter: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
    getSession: jest.fn(),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    getMember: jest.fn(),
}));

jest.mock('@/lib/controller/auth-controller', () => ({
    logout: jest.fn(),
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockGetMember = getMember as jest.MockedFunction<typeof getMember>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;
const mockPush = jest.fn();

beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/member/dashboard');
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

const children = <div data-testid="page-content"/>;

describe('MemberLayout', () => {

    describe('authentication guard', () => {

        it('memberLayout_noUserId_redirectsToLogin', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: null,
                email: null,
                fullName: null,
                role: null,
            } as unknown as IronSession<SessionData>);

            // Act
            let caughtError: Error | undefined;
            try {
                await MemberLayout({children});
            } catch (e) {
                caughtError = e as Error;
            }

            // Assert
            expect(caughtError?.message).toContain('/login');
            expect(mockRedirect).toHaveBeenCalledTimes(1);
            expect(mockRedirect).toHaveBeenCalledWith('/login');
        });

        it('memberLayout_roleNotMember_redirectsToLogin', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'jane@example.com',
                fullName: 'Jane Doe',
                role: Role.ADMIN,
            } as unknown as IronSession<SessionData>);

            // Act
            let caughtError: Error | undefined;
            try {
                await MemberLayout({children});
            } catch (e) {
                caughtError = e as Error;
            }

            // Assert
            expect(caughtError?.message).toContain('/login');
            expect(mockRedirect).toHaveBeenCalledTimes(1);
            expect(mockRedirect).toHaveBeenCalledWith('/login');
        });

    });

    describe('member record guard', () => {

        it('memberLayout_getMemberFails_redirectsToUnauthorized', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'jane@example.com',
                fullName: 'Jane Doe',
                role: Role.MEMBER,
                memberId: 'm-1',
            } as unknown as IronSession<SessionData>);
            mockGetMember.mockResolvedValueOnce({
                success: false,
                message: 'Member not found',
            });

            // Act
            let caughtError: Error | undefined;
            try {
                await MemberLayout({children});
            } catch (e) {
                caughtError = e as Error;
            }

            // Assert
            expect(caughtError?.message).toContain('/unauthorized');
            expect(mockRedirect).toHaveBeenCalledTimes(1);
            expect(mockRedirect).toHaveBeenCalledWith('/unauthorized');
        });

        it('memberLayout_memberInactive_redirectsToUnauthorized', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'jane@example.com',
                fullName: 'Jane Doe',
                role: Role.MEMBER,
                memberId: 'm-1',
            } as unknown as IronSession<SessionData>);
            mockGetMember.mockResolvedValueOnce({
                success: true,
                data: {isActive: false},
            } as ActionResult<MemberWithUser>);

            // Act
            let caughtError: Error | undefined;
            try {
                await MemberLayout({children});
            } catch (e) {
                caughtError = e as Error;
            }

            // Assert
            expect(caughtError?.message).toContain('/unauthorized');
            expect(mockRedirect).toHaveBeenCalledTimes(1);
            expect(mockRedirect).toHaveBeenCalledWith('/unauthorized');
        });

    });

    describe('authorised render', () => {

        it('memberLayout_validActiveMemberSession_rendersNavSidebarAndChildren', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'jane@example.com',
                fullName: 'Jane Doe',
                role: Role.MEMBER,
                memberId: 'm-1',
            } as unknown as IronSession<SessionData>);
            mockGetMember.mockResolvedValueOnce({
                success: true,
                data: {isActive: true},
            } as ActionResult<MemberWithUser>);
            mockLogout.mockResolvedValueOnce({success: true, data: undefined});

            // Act
            render(await MemberLayout({children}));

            // Assert
            expect(screen.getByRole('navigation', {name: 'Member Navigation'})).toBeInTheDocument();
            expect(screen.getByRole('button', {name: 'Sign out'})).toBeInTheDocument();
            expect(screen.getByTestId('page-content')).toBeInTheDocument();
            expect(mockRedirect).not.toHaveBeenCalled();
        });

        it('memberLayout_fullNameDefined_showsAvatarInitialAndFullName', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'jane@example.com',
                fullName: 'Jane Doe',
                role: Role.MEMBER,
                memberId: 'm-1',
            } as unknown as IronSession<SessionData>);
            mockGetMember.mockResolvedValueOnce({
                success: true,
                data: {isActive: true},
            } as ActionResult<MemberWithUser>);
            mockLogout.mockResolvedValueOnce({success: true, data: undefined});

            // Act
            render(await MemberLayout({children: <div/>}));

            // Assert
            expect(screen.getByText('J')).toBeInTheDocument();
            expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        });

        it('memberLayout_fullNameNull_showsFallbackAvatarInitialAndMemberLabel', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'jane@example.com',
                fullName: null,
                role: Role.MEMBER,
                memberId: 'm-1',
            } as unknown as IronSession<SessionData>);
            mockGetMember.mockResolvedValueOnce({
                success: true,
                data: {isActive: true},
            } as ActionResult<MemberWithUser>);
            mockLogout.mockResolvedValueOnce({success: true, data: undefined});

            // Act
            render(await MemberLayout({children: <div/>}));

            // Assert
            expect(screen.getByText('M')).toBeInTheDocument();
            expect(screen.getByText('Member')).toBeInTheDocument();
        });

    });

});