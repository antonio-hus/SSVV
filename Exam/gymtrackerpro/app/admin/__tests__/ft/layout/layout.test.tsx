import {render, screen} from '@testing-library/react';
import {useRouter, usePathname, redirect} from 'next/navigation';
import type {IronSession} from 'iron-session';
import {getSession} from '@/lib/session';
import {logout} from '@/lib/controller/auth-controller';
import {Role} from '@/lib/domain/user';
import type {SessionData} from '@/lib/domain/session';
import AdminLayout from '@/app/admin/layout';

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

jest.mock('@/lib/controller/auth-controller', () => ({
    logout: jest.fn(),
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockLogout = logout as jest.MockedFunction<typeof logout>;
const mockPush = jest.fn();

beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

const children = <div data-testid="page-content"/>;

describe('AdminLayout', () => {

    describe('authentication guard', () => {

        it('adminLayout_noUserId_redirectsToLogin', async () => {
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
                await AdminLayout({children});
            } catch (e) {
                caughtError = e as Error;
            }

            // Assert
            expect(caughtError?.message).toContain('/login');
            expect(mockRedirect).toHaveBeenCalledTimes(1);
            expect(mockRedirect).toHaveBeenCalledWith('/login');
        });

        it('adminLayout_roleNotAdmin_redirectsToLogin', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'jane@example.com',
                fullName: 'Jane Doe',
                role: Role.MEMBER,
            } as unknown as IronSession<SessionData>);

            // Act
            let caughtError: Error | undefined;
            try {
                await AdminLayout({children});
            } catch (e) {
                caughtError = e as Error;
            }

            // Assert
            expect(caughtError?.message).toContain('/login');
            expect(mockRedirect).toHaveBeenCalledTimes(1);
            expect(mockRedirect).toHaveBeenCalledWith('/login');
        });

    });

    describe('authorised render', () => {

        it('adminLayout_validAdminSession_rendersNavSidebarAndChildren', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'john@example.com',
                fullName: 'John Smith',
                role: Role.ADMIN,
            } as unknown as IronSession<SessionData>);
            mockLogout.mockResolvedValueOnce({success: true, data: undefined});

            // Act
            render(await AdminLayout({children}));

            // Assert
            expect(screen.getByRole('navigation', {name: 'Admin Navigation'})).toBeInTheDocument();
            expect(screen.getByRole('button', {name: 'Sign out'})).toBeInTheDocument();
            expect(screen.getByTestId('page-content')).toBeInTheDocument();
            expect(mockRedirect).not.toHaveBeenCalled();
        });

        it('adminLayout_fullNameDefined_showsAvatarInitialAndFullName', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'john@example.com',
                fullName: 'John Smith',
                role: Role.ADMIN,
            } as unknown as IronSession<SessionData>);
            mockLogout.mockResolvedValueOnce({success: true, data: undefined});

            // Act
            render(await AdminLayout({children: <div/>}));

            // Assert
            expect(screen.getByText('J')).toBeInTheDocument();
            expect(screen.getByText('John Smith')).toBeInTheDocument();
        });

        it('adminLayout_fullNameNull_showsFallbackAvatarInitialAndAdminLabel', async () => {
            // Arrange
            mockGetSession.mockResolvedValueOnce({
                userId: 'u-1',
                email: 'john@example.com',
                fullName: null,
                role: Role.ADMIN,
            } as unknown as IronSession<SessionData>);
            mockLogout.mockResolvedValueOnce({success: true, data: undefined});

            // Act
            render(await AdminLayout({children: <div/>}));

            // Assert
            expect(screen.getByText('A')).toBeInTheDocument();
            expect(screen.getByText('Admin')).toBeInTheDocument();
        });

    });

});