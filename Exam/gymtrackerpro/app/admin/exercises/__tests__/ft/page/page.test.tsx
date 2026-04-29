import {render, screen} from '@testing-library/react';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {listExercises} from '@/lib/controller/exercise-controller';
import AdminExercisesPage from '@/app/admin/exercises/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}));

jest.mock('@/lib/controller/exercise-controller', () => ({
    listExercises: jest.fn(),
}));

const mockListExercises = listExercises as jest.MockedFunction<typeof listExercises>;
const mockPush = jest.fn();

const mockExercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: 'A controlled chest press.',
    muscleGroup: 'CHEST' as const,
    equipmentNeeded: 'BARBELL' as const,
    isActive: true,
};

const mockArchivedExercise = {
    ...mockExercise,
    id: 'ex-2',
    name: 'Archived Cable Fly',
    equipmentNeeded: 'CABLE' as const,
    isActive: false,
};

const mockSearchParams = (params: Record<string, string> = {}) => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(params));
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    (usePathname as jest.Mock).mockReturnValue('/admin/exercises');
    mockSearchParams();
    jest.clearAllMocks();
});

describe('AdminExercisesPage', () => {

    it('adminExercisesPage_defaultSearchParams_fetchesFirstActivePageAndRendersList', async () => {
        // Arrange
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 1},
        });

        render(await AdminExercisesPage({searchParams: Promise.resolve({})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'Exercises'})).toBeInTheDocument();
        expect(screen.getByText('Manage the exercise catalogue')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Add Exercise'})).toHaveAttribute('href', '/admin/exercises/new');
        expect(screen.getByPlaceholderText('Search exercises…')).toHaveValue('');
        expect(screen.getByRole('button', {name: 'Show Archived'})).toHaveAttribute('href', '/admin/exercises?includeInactive=true');
        expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
        expect(mockListExercises).toHaveBeenCalledTimes(1);
        expect(mockListExercises).toHaveBeenCalledWith({
            search: '',
            page: 1,
            pageSize: 10,
            includeInactive: false,
        });
    });

    it('adminExercisesPage_searchParam_fetchesFilteredFirstPageAndSeedsSearchInput', async () => {
        // Arrange
        mockSearchParams({search: 'bench'});
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 1},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({search: 'bench'}),
        }));

        // Assert
        expect(screen.getByPlaceholderText('Search exercises…')).toHaveValue('bench');
        expect(mockListExercises).toHaveBeenCalledWith({
            search: 'bench',
            page: 1,
            pageSize: 10,
            includeInactive: false,
        });
    });

    it('adminExercisesPage_pageParam_fetchesRequestedPageAndShowsPagination', async () => {
        // Arrange
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 22},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({page: '2'}),
        }));

        // Assert
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Previous'})).toHaveAttribute('href', '/admin/exercises?page=1');
        expect(screen.getByRole('button', {name: 'Next'})).toHaveAttribute('href', '/admin/exercises?page=3');
        expect(mockListExercises).toHaveBeenCalledWith({
            search: '',
            page: 2,
            pageSize: 10,
            includeInactive: false,
        });
    });

    it('adminExercisesPage_searchAndPageParams_fetchesFilteredRequestedPage', async () => {
        // Arrange
        mockSearchParams({search: 'bench', page: '2'});
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 22},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({search: 'bench', page: '2'}),
        }));

        // Assert
        expect(screen.getByPlaceholderText('Search exercises…')).toHaveValue('bench');
        expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
        expect(mockListExercises).toHaveBeenCalledWith({
            search: 'bench',
            page: 2,
            pageSize: 10,
            includeInactive: false,
        });
    });

    it('adminExercisesPage_searchParam_preservesSearchInPaginationLinks', async () => {
        // Arrange
        mockSearchParams({search: 'bench'});
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 22},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({search: 'bench'}),
        }));

        // Assert
        expect(screen.getByRole('button', {name: 'Next'})).toHaveAttribute('href', '/admin/exercises?search=bench&page=2');
    });

    it('adminExercisesPage_includeInactiveTrue_fetchesArchivedExercises', async () => {
        // Arrange
        mockSearchParams({includeInactive: 'true'});
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise, mockArchivedExercise], total: 2},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({includeInactive: 'true'}),
        }));

        // Assert
        expect(screen.getByText('Archived Cable Fly')).toBeInTheDocument();
        expect(mockListExercises).toHaveBeenCalledWith({
            search: '',
            page: 1,
            pageSize: 10,
            includeInactive: true,
        });
    });

    it('adminExercisesPage_includeInactiveTrue_showsHideArchivedToggle', async () => {
        // Arrange
        mockSearchParams({includeInactive: 'true'});
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 1},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({includeInactive: 'true'}),
        }));

        // Assert
        expect(screen.getByRole('button', {name: 'Hide Archived'})).toHaveAttribute('href', '/admin/exercises');
        expect(screen.queryByRole('button', {name: 'Show Archived'})).not.toBeInTheDocument();
    });

    it('adminExercisesPage_includeInactiveTrue_preservesParamInPaginationLinks', async () => {
        // Arrange
        mockSearchParams({includeInactive: 'true'});
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 22},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({includeInactive: 'true'}),
        }));

        // Assert
        expect(screen.getByRole('button', {name: 'Next'})).toHaveAttribute('href', '/admin/exercises?includeInactive=true&page=2');
    });

    it('adminExercisesPage_includeInactiveFalseString_treatsArchivedAsHidden', async () => {
        // Arrange
        mockSearchParams({includeInactive: 'false'});
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 1},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({includeInactive: 'false'}),
        }));

        // Assert
        expect(screen.getByRole('button', {name: 'Show Archived'})).toHaveAttribute('href', '/admin/exercises?includeInactive=true');
        expect(mockListExercises).toHaveBeenCalledWith({
            search: '',
            page: 1,
            pageSize: 10,
            includeInactive: false,
        });
    });

    it('adminExercisesPage_searchAndIncludeInactive_preservesBothParamsInPaginationLinks', async () => {
        // Arrange
        mockSearchParams({search: 'bench', includeInactive: 'true'});
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [mockExercise], total: 22},
        });

        render(await AdminExercisesPage({
            searchParams: Promise.resolve({search: 'bench', includeInactive: 'true'}),
        }));

        // Assert
        expect(screen.getByRole('button', {name: 'Next'})).toHaveAttribute('href', '/admin/exercises?search=bench&includeInactive=true&page=2');
        expect(mockListExercises).toHaveBeenCalledWith({
            search: 'bench',
            page: 1,
            pageSize: 10,
            includeInactive: true,
        });
    });

    it('adminExercisesPage_emptyResult_rendersTableEmptyStateWithoutPagination', async () => {
        // Arrange
        mockListExercises.mockResolvedValueOnce({
            success: true,
            data: {items: [], total: 0},
        });

        render(await AdminExercisesPage({searchParams: Promise.resolve({})}));

        // Assert
        expect(screen.getByText('No exercises found')).toBeInTheDocument();
        expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
    });

    it('adminExercisesPage_listFails_showsErrorMessageWithoutPageChrome', async () => {
        // Arrange
        mockListExercises.mockResolvedValueOnce({
            success: false,
            message: 'Could not load exercises',
        });

        render(await AdminExercisesPage({searchParams: Promise.resolve({})}));

        // Assert
        expect(screen.getByText('Could not load exercises')).toBeInTheDocument();
        expect(screen.queryByRole('heading', {name: 'Exercises'})).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Search exercises…')).not.toBeInTheDocument();
    });

});
