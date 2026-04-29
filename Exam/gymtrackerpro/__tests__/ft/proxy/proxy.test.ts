import type {NextRequest} from 'next/server';
import {getIronSession} from 'iron-session';
import {config, proxy} from '@/proxy';
import {Role} from '@/lib/domain/user';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('iron-session', () => ({
    getIronSession: jest.fn(),
}));

jest.mock('next/server', () => ({
    NextResponse: {
        next: () => ({
            status: 200,
            headers: {get: () => null},
        }),
        redirect: (url: URL) => ({
            status: 307,
            headers: {get: (name: string) => name === 'location' ? url.toString() : null},
        }),
    },
}));

jest.mock('@/lib/session', () => ({
    sessionOptions: {
        password: 'test-secret',
        cookieName: 'gymtracker-session',
        cookieOptions: {secure: false, httpOnly: true},
    },
}));

const mockGetIronSession = getIronSession as jest.MockedFunction<typeof getIronSession>;

const mockRequestFor = (pathname: string): NextRequest => ({
    nextUrl: {pathname},
    url: `https://gymtracker.test${pathname}`,
} as unknown as NextRequest);

const mockSession = (session: { userId?: string; role?: string; isActive?: boolean }) => {
    mockGetIronSession.mockResolvedValueOnce(session as never);
};

describe('proxy', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('proxy_config_matchesAdminAndMemberRoutes', () => {
        // Assert
        expect(config).toEqual({
            matcher: ['/admin/:path*', '/member/:path*'],
        });
    });

    it('proxy_unprotectedPath_returnsNextResponse', async () => {
        // Arrange
        mockSession({});
        const request = mockRequestFor('/login');

        // Act
        const response = await proxy(request);

        // Assert
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
        expect(mockGetIronSession).toHaveBeenCalledTimes(1);
        expect(mockGetIronSession).toHaveBeenCalledWith(
            request,
            expect.objectContaining({status: 200}),
            expect.objectContaining({cookieName: 'gymtracker-session'}),
        );
    });

    it('proxy_adminRouteWithoutLogin_redirectsToLogin', async () => {
        // Arrange
        mockSession({});
        const request = mockRequestFor('/admin');

        // Act
        const response = await proxy(request);

        // Assert
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`https://gymtracker.test/login`);
    });

    it('proxy_adminRouteWithMemberRole_redirectsToUnauthorized', async () => {
        // Arrange
        mockSession({userId: 'user-1', role: Role.MEMBER});
        const request = mockRequestFor('/admin/members');

        // Act
        const response = await proxy(request);

        // Assert
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`https://gymtracker.test/unauthorized`);
    });

    it('proxy_adminRouteWithAdminRole_allowsRequest', async () => {
        // Arrange
        mockSession({userId: 'user-1', role: Role.ADMIN});
        const request = mockRequestFor('/admin/dashboard');

        // Act
        const response = await proxy(request);

        // Assert
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
    });

    it('proxy_memberRouteWithoutLogin_redirectsToLogin', async () => {
        // Arrange
        mockSession({});
        const request = mockRequestFor('/member');

        // Act
        const response = await proxy(request);

        // Assert
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`https://gymtracker.test/login`);
    });

    it('proxy_memberRouteWithAdminRole_redirectsToUnauthorized', async () => {
        // Arrange
        mockSession({userId: 'user-1', role: Role.ADMIN});
        const request = mockRequestFor('/member/dashboard');

        // Act
        const response = await proxy(request);

        // Assert
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`https://gymtracker.test/unauthorized`);

    });

    it('proxy_memberRouteWithInactiveMember_redirectsToUnauthorized', async () => {
        // Arrange
        mockSession({userId: 'user-1', role: Role.MEMBER, isActive: false});
        const request = mockRequestFor('/member/profile');

        // Act
        const response = await proxy(request);

        // Assert
        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(`https://gymtracker.test/unauthorized`);
    });

    it('proxy_memberRouteWithActiveMember_allowsRequest', async () => {
        // Arrange
        mockSession({userId: 'user-1', role: Role.MEMBER, isActive: true});
        const request = mockRequestFor('/member/report');

        // Act
        const response = await proxy(request);

        // Assert
        expect(response.status).toBe(200);
        expect(response.headers.get('location')).toBeNull();
    });

});
