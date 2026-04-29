import {render, screen} from '@testing-library/react';
import {useRouter} from 'next/navigation';
import {listExercises} from '@/lib/controller/exercise-controller';
import {listMembers} from '@/lib/controller/user-controller';
import {createWorkoutSession} from '@/lib/controller/workout-session-controller';
import NewWorkoutSessionPage from '@/app/admin/workout-sessions/new/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
    MuscleGroup: {CHEST: 'CHEST', SHOULDERS: 'SHOULDERS', ARMS: 'ARMS', BACK: 'BACK', CORE: 'CORE', LEGS: 'LEGS'},
    Equipment: {CABLE: 'CABLE', DUMBBELL: 'DUMBBELL', BARBELL: 'BARBELL', MACHINE: 'MACHINE'},
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/lib/controller/exercise-controller', () => ({
    listExercises: jest.fn(),
}));

jest.mock('@/lib/controller/user-controller', () => ({
    listMembers: jest.fn(),
}));

jest.mock('@/lib/controller/workout-session-controller', () => ({
    createWorkoutSession: jest.fn(),
}));

const mockListExercises = listExercises as jest.MockedFunction<typeof listExercises>;
const mockListMembers = listMembers as jest.MockedFunction<typeof listMembers>;
const mockPush = jest.fn();

const mockExercise = {
    id: 'ex-1',
    name: 'Barbell Bench Press',
    description: null,
    muscleGroup: 'CHEST' as const,
    equipmentNeeded: 'BARBELL' as const,
    isActive: true
};
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
        role: 'MEMBER' as const
    },
};

beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({push: mockPush});
    jest.clearAllMocks();
});

describe('NewWorkoutSessionPage', () => {

    it('newWorkoutSessionPage_noMemberId_loadsListsAndRendersFormWithMembersBackLink', async () => {
        // Arrange
        mockListExercises.mockResolvedValueOnce({success: true, data: {items: [mockExercise], total: 1}});
        mockListMembers.mockResolvedValueOnce({success: true, data: {items: [mockMember], total: 1}});

        render(await NewWorkoutSessionPage({searchParams: Promise.resolve({})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'New Workout Session'})).toBeInTheDocument();
        expect(screen.getByText('Record a session for a member')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back'})).toHaveAttribute('href', '/admin/members');
        expect(screen.getByLabelText('Member')).toHaveValue('');
        expect(screen.getByRole('option', {name: 'John Smith (john@example.com)'})).toBeInTheDocument();
        expect(screen.getByRole('option', {name: 'Barbell Bench Press'})).toBeInTheDocument();
        expect(mockListExercises).toHaveBeenCalledWith({pageSize: 200});
        expect(mockListMembers).toHaveBeenCalledWith({pageSize: 200});
        expect(createWorkoutSession).not.toHaveBeenCalled();
    });

    it('newWorkoutSessionPage_memberIdParam_prefillsMemberAndBackLinkToMember', async () => {
        // Arrange
        mockListExercises.mockResolvedValueOnce({success: true, data: {items: [mockExercise], total: 1}});
        mockListMembers.mockResolvedValueOnce({success: true, data: {items: [mockMember], total: 1}});

        render(await NewWorkoutSessionPage({searchParams: Promise.resolve({memberId: 'mem-1'})}));

        // Assert
        expect(screen.getByRole('button', {name: 'Back'})).toHaveAttribute('href', '/admin/members/mem-1');
        expect(screen.getByLabelText('Member')).toHaveValue('mem-1');
    });

    it('newWorkoutSessionPage_listActionsFail_rendersFormWithEmptySelectOptions', async () => {
        // Arrange
        mockListExercises.mockResolvedValueOnce({success: false, message: 'Could not load exercises'});
        mockListMembers.mockResolvedValueOnce({success: false, message: 'Could not load members'});

        render(await NewWorkoutSessionPage({searchParams: Promise.resolve({})}));

        // Assert
        expect(screen.getByRole('heading', {name: 'New Workout Session'})).toBeInTheDocument();
        expect(screen.queryByRole('option', {name: 'John Smith (john@example.com)'})).not.toBeInTheDocument();
        expect(screen.queryByRole('option', {name: 'Barbell Bench Press'})).not.toBeInTheDocument();
    });

});
