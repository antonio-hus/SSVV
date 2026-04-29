import {render, screen} from '@testing-library/react';
import {ProfilePersonalInformation} from '@/app/member/profile/_components/profile-personal-information';
import type {User} from '@/lib/domain/user';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

const mockUser: User = {
    id: 'user-1',
    email: 'john@example.com',
    fullName: 'John Smith',
    phone: '+12345678901',
    dateOfBirth: new Date('1990-03-10T00:00:00.000Z'),
    passwordHash: 'hash',
    role: 'MEMBER',
};

describe('ProfilePersonalInformation', () => {

    it('profilePersonalInformation_defaultUser_showsCardTitleAndAllUserFields', () => {
        // Arrange
        render(<ProfilePersonalInformation user={mockUser}/>);

        // Assert
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
        expect(screen.getByText('Full name')).toBeInTheDocument();
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
        expect(screen.getByText('+12345678901')).toBeInTheDocument();
        expect(screen.getByText('Date of birth')).toBeInTheDocument();
        expect(screen.getByText(new Date(mockUser.dateOfBirth).toLocaleDateString())).toBeInTheDocument();
    });

});
