import {render, screen} from '@testing-library/react';
import {ProfileMembership} from '@/app/member/profile/_components/profile-membership';

describe('ProfileMembership', () => {

    it('profileMembership_defaultProps_showsMembershipStartDate', () => {
        // Arrange
        const membershipStart = new Date('2025-01-15T00:00:00.000Z');

        render(<ProfileMembership membershipStart={membershipStart} isActive={true}/>);

        // Assert
        expect(screen.getByText('Membership')).toBeInTheDocument();
        expect(screen.getByText('Member since')).toBeInTheDocument();
        expect(screen.getByText(membershipStart.toLocaleDateString())).toBeInTheDocument();
    });

    it('profileMembership_activeTrue_showsActiveStatus', () => {
        // Arrange
        render(<ProfileMembership membershipStart="2025-01-15" isActive={true}/>);

        // Assert
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('profileMembership_activeFalse_showsSuspendedStatus', () => {
        // Arrange
        render(<ProfileMembership membershipStart="2025-01-15" isActive={false}/>);

        // Assert
        expect(screen.getByText('Suspended')).toBeInTheDocument();
    });

});
