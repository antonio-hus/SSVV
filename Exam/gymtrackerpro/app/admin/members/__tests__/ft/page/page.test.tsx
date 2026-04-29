import {render, screen} from '@testing-library/react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {listMembers} from '@/lib/controller/user-controller';
import AdminMembersPage from '@/app/admin/members/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    listMembers: jest.fn(),
}));

const mockListMembers = listMembers as jest.MockedFunction<typeof listMembers>;
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

const mockSearchParams = (params: Record<string, string> = {}) => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(params));
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    (usePathname as jest.Mock).mockReturnValue('/admin/members');
    mockSearchParams();
    jest.clearAllMocks();
});

describe('AdminMembersPage', () => {

    it('adminMembersPage_defaultSearchParams_fetchesFirstPageAndRendersList', async () => {
        // Arrange
        mockListMembers.mockResolvedValueOnce({success: true, data: {items: [mockMember], total: 1}});

        render(await AdminMembersPage({searchParams: Promise.resolve({})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'Members'})).toBeInTheDocument();
        expect(screen.getByText('Manage gym members')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Add Member'})).toHaveAttribute('href', '/admin/members/new');
        expect(screen.getByPlaceholderText('Search by name or email...')).toHaveValue('');
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(mockListMembers).toHaveBeenCalledTimes(1);
        expect(mockListMembers).toHaveBeenCalledWith({search: '', page: 1, pageSize: 10});
    });

    it('adminMembersPage_searchParam_fetchesFilteredFirstPageAndSeedsSearchInput', async () => {
        // Arrange
        mockSearchParams({search: 'john'});
        mockListMembers.mockResolvedValueOnce({success: true, data: {items: [mockMember], total: 1}});

        render(await AdminMembersPage({
            searchParams: Promise.resolve({search: 'john'}),
        }));

        // Assert
        expect(screen.getByPlaceholderText('Search by name or email...')).toHaveValue('john');
        expect(mockListMembers).toHaveBeenCalledWith({search: 'john', page: 1, pageSize: 10});
    });

    it('adminMembersPage_pageParam_fetchesRequestedPageAndShowsPagination', async () => {
        // Arrange
        mockListMembers.mockResolvedValueOnce({success: true, data: {items: [mockMember], total: 22}});

        render(await AdminMembersPage({
            searchParams: Promise.resolve({page: '2'}),
        }));

        // Assert
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Previous'})).toHaveAttribute('href', '/admin/members?page=1');
        expect(screen.getByRole('button', {name: 'Next'})).toHaveAttribute('href', '/admin/members?page=3');
        expect(mockListMembers).toHaveBeenCalledWith({search: '', page: 2, pageSize: 10});
    });

    it('adminMembersPage_searchAndPageParams_fetchesFilteredRequestedPage', async () => {
        // Arrange
        mockSearchParams({search: 'john', page: '2'});
        mockListMembers.mockResolvedValueOnce({success: true, data: {items: [mockMember], total: 22}});

        render(await AdminMembersPage({
            searchParams: Promise.resolve({search: 'john', page: '2'}),
        }));

        // Assert
        expect(screen.getByPlaceholderText('Search by name or email...')).toHaveValue('john');
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
        expect(mockListMembers).toHaveBeenCalledWith({search: 'john', page: 2, pageSize: 10});
    });

    it('adminMembersPage_searchParam_preservesSearchInPaginationLinks', async () => {
        // Arrange
        mockSearchParams({search: 'john'});
        mockListMembers.mockResolvedValueOnce({success: true, data: {items: [mockMember], total: 22}});

        render(await AdminMembersPage({
            searchParams: Promise.resolve({search: 'john'}),
        }));

        // Assert
        expect(screen.getByRole('button', {name: 'Next'})).toHaveAttribute('href', '/admin/members?search=john&page=2');
    });

    it('adminMembersPage_emptyResult_rendersTableEmptyStateWithoutPagination', async () => {
        // Arrange
        mockListMembers.mockResolvedValueOnce({success: true, data: {items: [], total: 0}});

        render(await AdminMembersPage({searchParams: Promise.resolve({})}));

        // Assert
        expect(screen.getByText('No members found')).toBeInTheDocument();
        expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
    });

    it('adminMembersPage_listFails_showsErrorMessageWithoutPageChrome', async () => {
        // Arrange
        mockListMembers.mockResolvedValueOnce({success: false, message: 'Could not load members'});

        render(await AdminMembersPage({searchParams: Promise.resolve({})}));

        // Assert
        expect(screen.getByText('Could not load members')).toBeInTheDocument();
        expect(screen.queryByRole('heading', {name: 'Members'})).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Search by name or email...')).not.toBeInTheDocument();
    });

});
