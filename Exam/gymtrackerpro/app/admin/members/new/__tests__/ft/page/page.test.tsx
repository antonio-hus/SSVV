import {render, screen} from '@testing-library/react';
import {createMemberWithTempPassword} from '@/lib/controller/user-controller';
import NewMemberPage from '@/app/admin/members/new/page';

jest.mock('@/prisma/generated/prisma/client', () => ({
    Role: {ADMIN: 'ADMIN', MEMBER: 'MEMBER'},
}));

jest.mock('@/lib/controller/user-controller', () => ({
    createMemberWithTempPassword: jest.fn(),
}));

describe('NewMemberPage', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('newMemberPage_defaultRender_showsHeadingDescriptionAndBackLink', async () => {
        // Arrange
        render(await NewMemberPage());

        // Assert
        expect(screen.getByRole('heading', {name: 'Add Member'})).toBeInTheDocument();
        expect(screen.getByText('Create a new gym member account')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Back to Members'})).toHaveAttribute('href', '/admin/members');
    });

    it('newMemberPage_defaultRender_mountsCreateMemberForm', async () => {
        // Arrange
        render(await NewMemberPage());

        // Assert
        expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: 'Create Member'})).toBeInTheDocument();
        expect(createMemberWithTempPassword).not.toHaveBeenCalled();
    });

});
