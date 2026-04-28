import {render, screen} from '@testing-library/react';
import {usePathname} from 'next/navigation';
import {MemberNav} from '@/app/member/_components/member-nav';

jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
}));

beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/some/other/path');
    jest.clearAllMocks();
});

describe('MemberNav', () => {

    it('memberNav_defaultRender_showsNavLandmarkWithMemberNavigationLabel', () => {
        // Arrange
        render(<MemberNav />);

        // Assert
        expect(screen.getByRole('navigation', {name: 'Member Navigation'})).toBeInTheDocument();
    });

    it('memberNav_defaultRender_rendersAllFourNavLinksWithCorrectHrefs', () => {
        // Arrange
        render(<MemberNav />);

        // Assert
        expect(screen.getByRole('link', {name: 'Dashboard'})).toHaveAttribute('href', '/member/dashboard');
        expect(screen.getByRole('link', {name: 'My Workout Sessions'})).toHaveAttribute('href', '/member/workout-sessions');
        expect(screen.getByRole('link', {name: 'My Report'})).toHaveAttribute('href', '/member/report');
        expect(screen.getByRole('link', {name: 'Profile'})).toHaveAttribute('href', '/member/profile');
    });

});