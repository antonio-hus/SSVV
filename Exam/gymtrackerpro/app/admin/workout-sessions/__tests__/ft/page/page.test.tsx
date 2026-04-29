import {redirect} from 'next/navigation';
import AdminWorkoutSessionsPage from '@/app/admin/workout-sessions/page';

jest.mock('next/navigation', () => ({
    redirect: jest.fn((url: string) => {
        throw new Error(`REDIRECT:${url}`);
    }),
}));

const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;

beforeEach(() => {
    jest.clearAllMocks();
});

describe('AdminWorkoutSessionsPage', () => {

    it('adminWorkoutSessionsPage_defaultRender_redirectsToNewWorkoutSessionPage', () => {
        // Act
        let caughtError: Error | undefined;
        try {
            AdminWorkoutSessionsPage();
        } catch (e) {
            caughtError = e as Error;
        }

        // Assert
        expect(caughtError?.message).toContain('/admin/workout-sessions/new');
        expect(mockRedirect).toHaveBeenCalledTimes(1);
        expect(mockRedirect).toHaveBeenCalledWith('/admin/workout-sessions/new');
    });

});
