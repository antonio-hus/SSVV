import {prisma} from '@/lib/database';
import {userRepository, userService, exerciseRepository, workoutSessionRepository} from '@/lib/di';
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {AdminListOptions, MemberListOptions} from '@/lib/domain/user';
import {
    CreateAdminInput,
    CreateMemberInput,
    CreateMemberWithTempPasswordInput,
    UpdateAdminInput,
    UpdateMemberInput,
} from '@/lib/schema/user-schema';

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('createMember', () => {

    it('createMember_newMember_returnsMemberWithUserAndPersistsToDb', async () => {
        const inputCreateMember: CreateMemberInput = {
            email: 'alice@test.com',
            fullName: 'Alice Smith',
            phone: '0700000001',
            dateOfBirth: '1990-05-15',
            password: 'Secret123!',
            membershipStart: '2024-01-01',
        };

        const result = await userService.createMember(inputCreateMember);

        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.fullName).toBe('Alice Smith');
        expect(result.user.role).toBe('MEMBER');
        expect(result.isActive).toBe(true);
        expect(result.membershipStart).toEqual(new Date('2024-01-01'));
        const userInRepository = await userRepository.findByEmail('alice@test.com');
        expect(userInRepository).not.toBeNull();
        expect(userInRepository!.role).toBe('MEMBER');
        const memberInRepository = await userRepository.findMemberById(result.id);
        expect(memberInRepository).toBeDefined();
        expect(memberInRepository.isActive).toBe(true);
    });

    it('createMember_duplicateEmail_throwsConflictError', async () => {
        await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputCreateMember: CreateMemberInput = {
            email: 'alice@test.com',
            fullName: 'Alice Smith 2',
            phone: '0700000002',
            dateOfBirth: '1991-01-01',
            password: 'Secret123!',
            membershipStart: '2024-06-01',
        };

        const action = () => userService.createMember(inputCreateMember);

        await expect(action()).rejects.toThrow(ConflictError);
        const {total: count} = await userRepository.findMembers();
        expect(count).toBe(1);
    });

    it('createMember_afterConflict_subsequentValidCallSucceeds', async () => {
        await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        await userService.createMember({
            email: 'alice@test.com', fullName: 'X', phone: '0',
            dateOfBirth: '2000-01-01', password: 'Secret123!', membershipStart: '2024-01-01',
        }).catch(() => {
        });
        const inputCreateMember: CreateMemberInput = {
            email: 'bob@test.com',
            fullName: 'Bob Jones',
            phone: '0700000003',
            dateOfBirth: '1988-03-10',
            password: 'Secret456!',
            membershipStart: '2024-02-01',
        };

        const result = await userService.createMember(inputCreateMember);

        expect(result.user.email).toBe('bob@test.com');
        const {total: count} = await userRepository.findMembers();
        expect(count).toBe(2);
    });

});

describe('createMemberWithTempPassword', () => {

    it('createMemberWithTempPassword_newMember_returnsMemberWithTempPasswordAndPersistsToDb', async () => {
        const inputCreateMember: CreateMemberWithTempPasswordInput = {
            email: 'alice@test.com',
            fullName: 'Alice Smith',
            phone: '0700000001',
            dateOfBirth: '1990-05-15',
            membershipStart: '2024-01-01',
        };

        const result = await userService.createMemberWithTempPassword(inputCreateMember);

        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.role).toBe('MEMBER');
        expect(result.tempPassword).toBeDefined();
        expect(typeof result.tempPassword).toBe('string');
        expect(result.tempPassword.length).toBeGreaterThan(0);
        const userInRepository = await userRepository.findByEmail('alice@test.com');
        expect(userInRepository).not.toBeNull();
        const memberInRepository = await userRepository.findMemberById(result.id);
        expect(memberInRepository).toBeDefined();
    });

    it('createMemberWithTempPassword_duplicateEmail_throwsConflictError', async () => {
        await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputCreateMember: CreateMemberWithTempPasswordInput = {
            email: 'alice@test.com',
            fullName: 'Alice Smith 2',
            phone: '0700000002',
            dateOfBirth: '1991-01-01',
            membershipStart: '2024-06-01',
        };

        const action = () => userService.createMemberWithTempPassword(inputCreateMember);

        await expect(action()).rejects.toThrow(ConflictError);
        const {total: count} = await userRepository.findMembers();
        expect(count).toBe(1);
    });

});

describe('createAdmin', () => {

    it('createAdmin_newAdmin_returnsAdminWithUserAndPersistsToDb', async () => {
        const inputCreateAdmin: CreateAdminInput = {
            email: 'admin@test.com',
            fullName: 'Admin User',
            phone: '0700000099',
            dateOfBirth: '1985-03-20',
            password: 'AdminPass1!',
        };

        const result = await userService.createAdmin(inputCreateAdmin);

        expect(result.user.email).toBe('admin@test.com');
        expect(result.user.role).toBe('ADMIN');
        const userInRepository = await userRepository.findByEmail('admin@test.com');
        expect(userInRepository).not.toBeNull();
        expect(userInRepository!.role).toBe('ADMIN');
        const adminInRepository = await userRepository.findAdminById(result.id);
        expect(adminInRepository).toBeDefined();
    });

    it('createAdmin_duplicateEmail_throwsConflictError', async () => {
        await userRepository.createAdmin({
            email: 'admin@test.com', fullName: 'Admin User', phone: '0700000099',
            dateOfBirth: '1985-03-20', password: 'AdminPass1!',
        });
        const inputCreateAdmin: CreateAdminInput = {
            email: 'admin@test.com',
            fullName: 'Admin Two',
            phone: '0700000098',
            dateOfBirth: '1986-01-01',
            password: 'AdminPass2!',
        };

        const action = () => userService.createAdmin(inputCreateAdmin);

        await expect(action()).rejects.toThrow(ConflictError);
        const {total: count} = await userRepository.findAdmins();
        expect(count).toBe(1);
    });

    it('createAdmin_afterConflict_subsequentValidCallSucceeds', async () => {
        await userRepository.createAdmin({
            email: 'admin@test.com', fullName: 'Admin User', phone: '0700000099',
            dateOfBirth: '1985-03-20', password: 'AdminPass1!',
        });
        await userService.createAdmin({
            email: 'admin@test.com', fullName: 'X', phone: '0',
            dateOfBirth: '2000-01-01', password: 'AdminPass1!',
        }).catch(() => {
        });
        const inputCreateAdmin: CreateAdminInput = {
            email: 'admin2@test.com',
            fullName: 'Admin Two',
            phone: '0700000097',
            dateOfBirth: '1987-04-15',
            password: 'AdminPass3!',
        };

        const result = await userService.createAdmin(inputCreateAdmin);

        expect(result.user.email).toBe('admin2@test.com');
        const {total: count} = await userRepository.findAdmins();
        expect(count).toBe(2);
    });

});

describe('getMember', () => {

    it('getMember_existingMember_returnsMemberWithUserAndAllFieldsMatching', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputId: string = seededMember.id;

        const result = await userService.getMember(inputId);

        expect(result.id).toBe(seededMember.id);
        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.fullName).toBe('Alice Smith');
        expect(result.user.role).toBe('MEMBER');
    });

    it('getMember_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userService.getMember(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('getAdmin', () => {

    it('getAdmin_existingAdmin_returnsAdminWithUserAndAllFieldsMatching', async () => {
        const seededAdmin = await userRepository.createAdmin({
            email: 'admin@test.com', fullName: 'Admin User', phone: '0700000099',
            dateOfBirth: '1985-03-20', password: 'AdminPass1!',
        });
        const inputId: string = seededAdmin.id;

        const result = await userService.getAdmin(inputId);

        expect(result.id).toBe(seededAdmin.id);
        expect(result.user.email).toBe('admin@test.com');
        expect(result.user.fullName).toBe('Admin User');
        expect(result.user.role).toBe('ADMIN');
    });

    it('getAdmin_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userService.getAdmin(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('listMembers', () => {

    it('listMembers_noOptions_returnsAllMembersOrderedByFullNameAsc', async () => {
        await userRepository.createMember({
            email: 'charlie@test.com',
            fullName: 'Charlie',
            phone: '0700000003',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userRepository.createMember({
            email: 'alice@test.com',
            fullName: 'Alice',
            phone: '0700000001',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userRepository.createMember({
            email: 'bob@test.com',
            fullName: 'Bob',
            phone: '0700000002',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        const inputOptions: MemberListOptions | undefined = undefined;

        const result = await userService.listMembers(inputOptions);

        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].user.fullName).toBe('Alice');
        expect(result.items[1].user.fullName).toBe('Bob');
        expect(result.items[2].user.fullName).toBe('Charlie');
    });

    it('listMembers_noMembers_returnsEmptyPage', async () => {
        const inputOptions: MemberListOptions | undefined = undefined;

        const result = await userService.listMembers(inputOptions);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('listMembers_searchByName_returnsOnlyMatchingMember', async () => {
        await userRepository.createMember({
            email: 'alice@test.com',
            fullName: 'Alice Smith',
            phone: '0700000001',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userRepository.createMember({
            email: 'bob@test.com',
            fullName: 'Bob Jones',
            phone: '0700000002',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        const inputOptions: MemberListOptions = {search: 'alice'};

        const result = await userService.listMembers(inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].user.email).toBe('alice@test.com');
    });

    it('listMembers_searchByEmail_returnsOnlyMatchingMember', async () => {
        await userRepository.createMember({
            email: 'alice@test.com',
            fullName: 'Alice Smith',
            phone: '0700000001',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userRepository.createMember({
            email: 'bob@test.com',
            fullName: 'Bob Jones',
            phone: '0700000002',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        const inputOptions: MemberListOptions = {search: 'bob@test.com'};

        const result = await userService.listMembers(inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].user.email).toBe('bob@test.com');
    });

    it('listMembers_pageSizeExceedsTotal_returnsAllRows', async () => {
        await userRepository.createMember({
            email: 'alice@test.com',
            fullName: 'Alice',
            phone: '0700000001',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userRepository.createMember({
            email: 'bob@test.com',
            fullName: 'Bob',
            phone: '0700000002',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        const inputOptions: MemberListOptions = {pageSize: 100};

        const result = await userService.listMembers(inputOptions);

        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
    });

    it('listMembers_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        await userRepository.createMember({
            email: 'alice@test.com',
            fullName: 'Alice Smith',
            phone: '0700000001',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        const inputOptions: MemberListOptions = {search: '%'};

        const result = await userService.listMembers(inputOptions);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('listMembers_pagination_returnsCorrectSlice', async () => {
        for (let i = 1; i <= 5; i++) {
            await userRepository.createMember({
                email: `m${i}@test.com`,
                fullName: `Member${i}`,
                phone: `070000000${i}`,
                dateOfBirth: '1990-01-01',
                password: 'Secret123!',
                membershipStart: '2024-01-01',
            });
        }
        const inputOptions: MemberListOptions = {page: 2, pageSize: 2};

        const result = await userService.listMembers(inputOptions);

        expect(result.total).toBe(5);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].user.fullName).toBe('Member3');
        expect(result.items[1].user.fullName).toBe('Member4');
    });

});

describe('listAdmins', () => {

    it('listAdmins_noOptions_returnsAllAdminsOrderedByFullNameAsc', async () => {
        await userRepository.createAdmin({
            email: 'charlie-a@test.com',
            fullName: 'Charlie Admin',
            phone: '0700000003',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        await userRepository.createAdmin({
            email: 'alice-a@test.com',
            fullName: 'Alice Admin',
            phone: '0700000001',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        const inputOptions: AdminListOptions | undefined = undefined;

        const result = await userService.listAdmins(inputOptions);

        expect(result.total).toBe(2);
        expect(result.items[0].user.fullName).toBe('Alice Admin');
        expect(result.items[1].user.fullName).toBe('Charlie Admin');
    });

    it('listAdmins_noAdmins_returnsEmptyPage', async () => {
        const inputOptions: AdminListOptions | undefined = undefined;

        const result = await userService.listAdmins(inputOptions);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('listAdmins_searchByName_returnsOnlyMatchingAdmin', async () => {
        await userRepository.createAdmin({
            email: 'alice-a@test.com',
            fullName: 'Alice Admin',
            phone: '0700000001',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        await userRepository.createAdmin({
            email: 'bob-a@test.com',
            fullName: 'Bob Admin',
            phone: '0700000002',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        const inputOptions: AdminListOptions = {search: 'alice'};

        const result = await userService.listAdmins(inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].user.email).toBe('alice-a@test.com');
    });

    it('listAdmins_searchByEmail_returnsOnlyMatchingAdmin', async () => {
        await userRepository.createAdmin({
            email: 'alice-a@test.com',
            fullName: 'Alice Admin',
            phone: '0700000001',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        await userRepository.createAdmin({
            email: 'bob-a@test.com',
            fullName: 'Bob Admin',
            phone: '0700000002',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        const inputOptions: AdminListOptions = {search: 'bob-a@test.com'};

        const result = await userService.listAdmins(inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].user.email).toBe('bob-a@test.com');
    });

    it('listAdmins_pageSizeExceedsTotal_returnsAllRows', async () => {
        await userRepository.createAdmin({
            email: 'alice-a@test.com',
            fullName: 'Alice Admin',
            phone: '0700000001',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        await userRepository.createAdmin({
            email: 'bob-a@test.com',
            fullName: 'Bob Admin',
            phone: '0700000002',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        const inputOptions: AdminListOptions = {pageSize: 50};

        const result = await userService.listAdmins(inputOptions);

        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
    });

    it('listAdmins_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        await userRepository.createAdmin({
            email: 'alice-a@test.com',
            fullName: 'Alice Admin',
            phone: '0700000001',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        const inputOptions: AdminListOptions = {search: '%'};

        const result = await userService.listAdmins(inputOptions);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('listAdmins_pagination_returnsCorrectSlice', async () => {
        for (let i = 1; i <= 5; i++) {
            await userRepository.createAdmin({
                email: `a${i}@test.com`,
                fullName: `Admin${i}`,
                phone: `070000000${i}`,
                dateOfBirth: '1985-01-01',
                password: 'AdminPass1!',
            });
        }
        const inputOptions: AdminListOptions = {page: 2, pageSize: 2};

        const result = await userService.listAdmins(inputOptions);

        expect(result.total).toBe(5);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].user.fullName).toBe('Admin3');
        expect(result.items[1].user.fullName).toBe('Admin4');
    });

});

describe('updateMember', () => {

    it('updateMember_allFields_returnsUpdatedMemberAndPersistsAllChanges', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputId: string = seededMember.id;
        const inputUpdate: UpdateMemberInput = {
            email: 'alice2@test.com',
            fullName: 'Alice Updated',
            phone: '0700000002',
            dateOfBirth: '1991-06-20',
            password: 'NewPass1!',
            membershipStart: '2025-03-01',
        };

        const result = await userService.updateMember(inputId, inputUpdate);

        expect(result.user.email).toBe('alice2@test.com');
        expect(result.user.fullName).toBe('Alice Updated');
        expect(result.user.phone).toBe('0700000002');
        expect(result.membershipStart).toEqual(new Date('2025-03-01'));
        const memberInRepository = await userRepository.findMemberById(seededMember.id);
        expect(memberInRepository.user.email).toBe('alice2@test.com');
        expect(memberInRepository.user.fullName).toBe('Alice Updated');
        expect(memberInRepository.membershipStart).toEqual(new Date('2025-03-01'));
    });

    it('updateMember_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputUpdate: UpdateMemberInput = {fullName: 'X'};

        const action = () => userService.updateMember(inputId, inputUpdate);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('updateMember_duplicateEmail_throwsConflictErrorAndLeavesOriginalEmailIntact', async () => {
        const alice = await userRepository.createMember({
            email: 'alice@test.com',
            fullName: 'Alice',
            phone: '0700000001',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userRepository.createMember({
            email: 'bob@test.com',
            fullName: 'Bob',
            phone: '0700000002',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        const inputId: string = alice.id;
        const inputUpdate: UpdateMemberInput = {email: 'bob@test.com'};

        const action = () => userService.updateMember(inputId, inputUpdate);

        await expect(action()).rejects.toThrow(ConflictError);
        const aliceInRepository = await userRepository.findMemberById(alice.id);
        expect(aliceInRepository.user.email).toBe('alice@test.com');
    });

    it('updateMember_partialInput_onlySpecifiedFieldsChangeUnspecifiedFieldsUntouched', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputId: string = seededMember.id;
        const inputUpdate: UpdateMemberInput = {fullName: 'Alice Renamed'};

        const result = await userService.updateMember(inputId, inputUpdate);

        expect(result.user.fullName).toBe('Alice Renamed');
        expect(result.user.email).toBe('alice@test.com');
        const memberInRepository = await userRepository.findMemberById(seededMember.id);
        expect(memberInRepository.user.fullName).toBe('Alice Renamed');
        expect(memberInRepository.user.email).toBe('alice@test.com');
        expect(memberInRepository.user.phone).toBe('0700000001');
    });

    it('updateMember_emptyInput_noFieldsMutated', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputId: string = seededMember.id;
        const inputUpdate: UpdateMemberInput = {};

        const result = await userService.updateMember(inputId, inputUpdate);

        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.fullName).toBe('Alice Smith');
        const memberInRepository = await userRepository.findMemberById(seededMember.id);
        expect(memberInRepository.user.email).toBe('alice@test.com');
        expect(memberInRepository.user.fullName).toBe('Alice Smith');
        expect(memberInRepository.user.phone).toBe('0700000001');
    });

    it('updateMember_sameEmailAsSelf_doesNotThrowConflictErrorAndSucceeds', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputId: string = seededMember.id;
        const inputUpdate: UpdateMemberInput = {email: 'alice@test.com', fullName: 'Alice Still'};

        const result = await userService.updateMember(inputId, inputUpdate);

        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.fullName).toBe('Alice Still');
        const memberInRepository = await userRepository.findMemberById(seededMember.id);
        expect(memberInRepository.user.email).toBe('alice@test.com');
    });

    it('updateMember_afterConflict_subsequentValidCallSucceeds', async () => {
        const alice = await userRepository.createMember({
            email: 'alice@test.com',
            fullName: 'Alice',
            phone: '0700000001',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userRepository.createMember({
            email: 'bob@test.com',
            fullName: 'Bob',
            phone: '0700000002',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userService.updateMember(alice.id, {email: 'bob@test.com'}).catch(() => {
        });
        const inputValidId: string = alice.id;
        const inputValidUpdate: UpdateMemberInput = {fullName: 'Alice Renamed'};

        const result = await userService.updateMember(inputValidId, inputValidUpdate);

        expect(result.user.fullName).toBe('Alice Renamed');
        const aliceInRepository = await userRepository.findMemberById(alice.id);
        expect(aliceInRepository.user.fullName).toBe('Alice Renamed');
    });

});

describe('suspendMember', () => {

    it('suspendMember_activeMember_returnsRowWithIsActiveFalseAndPersistsToDatabase', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputId: string = seededMember.id;

        const result = await userService.suspendMember(inputId);

        expect(result.isActive).toBe(false);
        const memberInRepository = await userRepository.findMemberById(seededMember.id);
        expect(memberInRepository.isActive).toBe(false);
    });

    it('suspendMember_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userService.suspendMember(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('activateMember', () => {

    it('activateMember_inactiveMember_returnsRowWithIsActiveTrueAndPersistsToDatabase', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        await userRepository.setMemberActive(seededMember.id, false);
        const inputId: string = seededMember.id;

        const result = await userService.activateMember(inputId);

        expect(result.isActive).toBe(true);
        const memberInRepository = await userRepository.findMemberById(seededMember.id);
        expect(memberInRepository.isActive).toBe(true);
    });

    it('activateMember_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userService.activateMember(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

});

describe('updateAdmin', () => {

    it('updateAdmin_allFields_returnsUpdatedAdminAndPersistsAllChanges', async () => {
        const seededAdmin = await userRepository.createAdmin({
            email: 'admin@test.com', fullName: 'Admin User', phone: '0700000099',
            dateOfBirth: '1985-03-20', password: 'AdminPass1!',
        });
        const inputId: string = seededAdmin.id;
        const inputUpdate: UpdateAdminInput = {
            email: 'admin2@test.com',
            fullName: 'Admin Updated',
            phone: '0700000098',
            dateOfBirth: '1986-07-10',
            password: 'NewAdminPass1!',
        };

        const result = await userService.updateAdmin(inputId, inputUpdate);

        expect(result.user.email).toBe('admin2@test.com');
        expect(result.user.fullName).toBe('Admin Updated');
        expect(result.user.phone).toBe('0700000098');
        const adminInRepository = await userRepository.findAdminById(seededAdmin.id);
        expect(adminInRepository.user.email).toBe('admin2@test.com');
        expect(adminInRepository.user.fullName).toBe('Admin Updated');
    });

    it('updateAdmin_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputUpdate: UpdateAdminInput = {fullName: 'X'};

        const action = () => userService.updateAdmin(inputId, inputUpdate);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('updateAdmin_duplicateEmail_throwsConflictErrorAndLeavesOriginalEmailIntact', async () => {
        const adminA = await userRepository.createAdmin({
            email: 'admin-a@test.com',
            fullName: 'Admin A',
            phone: '0700000001',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        await userRepository.createAdmin({
            email: 'admin-b@test.com',
            fullName: 'Admin B',
            phone: '0700000002',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        const inputId: string = adminA.id;
        const inputUpdate: UpdateAdminInput = {email: 'admin-b@test.com'};

        const action = () => userService.updateAdmin(inputId, inputUpdate);

        await expect(action()).rejects.toThrow(ConflictError);
        const adminAInRepository = await userRepository.findAdminById(adminA.id);
        expect(adminAInRepository.user.email).toBe('admin-a@test.com');
    });

    it('updateAdmin_partialInput_onlySpecifiedFieldsChangeUnspecifiedFieldsUntouched', async () => {
        const seededAdmin = await userRepository.createAdmin({
            email: 'admin@test.com', fullName: 'Admin User', phone: '0700000099',
            dateOfBirth: '1985-03-20', password: 'AdminPass1!',
        });
        const inputId: string = seededAdmin.id;
        const inputUpdate: UpdateAdminInput = {fullName: 'Admin Renamed'};

        const result = await userService.updateAdmin(inputId, inputUpdate);

        expect(result.user.fullName).toBe('Admin Renamed');
        expect(result.user.email).toBe('admin@test.com');
        const adminInRepository = await userRepository.findAdminById(seededAdmin.id);
        expect(adminInRepository.user.fullName).toBe('Admin Renamed');
        expect(adminInRepository.user.email).toBe('admin@test.com');
        expect(adminInRepository.user.phone).toBe('0700000099');
    });

    it('updateAdmin_emptyInput_noFieldsMutated', async () => {
        const seededAdmin = await userRepository.createAdmin({
            email: 'admin@test.com', fullName: 'Admin User', phone: '0700000099',
            dateOfBirth: '1985-03-20', password: 'AdminPass1!',
        });
        const inputId: string = seededAdmin.id;
        const inputUpdate: UpdateAdminInput = {};

        const result = await userService.updateAdmin(inputId, inputUpdate);

        expect(result.user.email).toBe('admin@test.com');
        expect(result.user.fullName).toBe('Admin User');
        const adminInRepository = await userRepository.findAdminById(seededAdmin.id);
        expect(adminInRepository.user.email).toBe('admin@test.com');
        expect(adminInRepository.user.fullName).toBe('Admin User');
        expect(adminInRepository.user.phone).toBe('0700000099');
    });

    it('updateAdmin_sameEmailAsSelf_doesNotThrowConflictErrorAndSucceeds', async () => {
        const seededAdmin = await userRepository.createAdmin({
            email: 'admin@test.com', fullName: 'Admin User', phone: '0700000099',
            dateOfBirth: '1985-03-20', password: 'AdminPass1!',
        });
        const inputId: string = seededAdmin.id;
        const inputUpdate: UpdateAdminInput = {email: 'admin@test.com', fullName: 'Admin Still'};

        const result = await userService.updateAdmin(inputId, inputUpdate);

        expect(result.user.email).toBe('admin@test.com');
        expect(result.user.fullName).toBe('Admin Still');
        const adminInRepository = await userRepository.findAdminById(seededAdmin.id);
        expect(adminInRepository.user.email).toBe('admin@test.com');
    });

    it('updateAdmin_afterConflict_subsequentValidCallSucceeds', async () => {
        const adminA = await userRepository.createAdmin({
            email: 'admin-a@test.com',
            fullName: 'Admin A',
            phone: '0700000001',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        await userRepository.createAdmin({
            email: 'admin-b@test.com',
            fullName: 'Admin B',
            phone: '0700000002',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        await userService.updateAdmin(adminA.id, {email: 'admin-b@test.com'}).catch(() => {
        });
        const inputValidUpdate: UpdateAdminInput = {fullName: 'Admin Renamed'};

        const result = await userService.updateAdmin(adminA.id, inputValidUpdate);

        expect(result.user.fullName).toBe('Admin Renamed');
        const adminInRepository = await userRepository.findAdminById(adminA.id);
        expect(adminInRepository.user.fullName).toBe('Admin Renamed');
    });

});

describe('deleteMember', () => {

    it('deleteMember_member_removesUserAndMemberRowViaCascade', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const inputId: string = seededMember.id;

        await userService.deleteMember(inputId);

        await expect(userRepository.findMemberById(inputId)).rejects.toThrow(NotFoundError);
        const userInRepository = await userRepository.findByEmail('alice@test.com');
        expect(userInRepository).toBeNull();
    });

    it('deleteMember_memberWithWorkoutSession_cascadesWorkoutSessionDeletion', async () => {
        const seededMember = await userRepository.createMember({
            email: 'alice@test.com', fullName: 'Alice Smith', phone: '0700000001',
            dateOfBirth: '1990-05-15', password: 'Secret123!', membershipStart: '2024-01-01',
        });
        const exercise = await exerciseRepository.create({
            name: `Exercise-${Date.now()}`,
            description: 'Seeded for delete cascade test',
            muscleGroup: 'CHEST',
            equipmentNeeded: 'BARBELL',
        });
        const session = await workoutSessionRepository.create(
            {memberId: seededMember.id, date: '2024-06-01', duration: 60},
            [{exerciseId: exercise.id, sets: 3, reps: 10, weight: 50}],
        );
        const inputId: string = seededMember.id;

        await userService.deleteMember(inputId);

        await expect(userRepository.findMemberById(inputId)).rejects.toThrow(NotFoundError);
        await expect(workoutSessionRepository.findById(session.id)).rejects.toThrow(NotFoundError);
        const userInRepository = await userRepository.findByEmail('alice@test.com');
        expect(userInRepository).toBeNull();
    });

    it('deleteMember_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userService.deleteMember(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('deleteMember_afterErrorOnNonExistentId_subsequentValidCallOnDifferentRowSucceeds', async () => {
        const alice = await userRepository.createMember({
            email: 'alice@test.com',
            fullName: 'Alice',
            phone: '0700000001',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        const bob = await userRepository.createMember({
            email: 'bob@test.com',
            fullName: 'Bob',
            phone: '0700000002',
            dateOfBirth: '1990-01-01',
            password: 'Secret123!',
            membershipStart: '2024-01-01'
        });
        await userService.deleteMember('00000000-0000-0000-0000-000000000000').catch(() => {
        });
        const inputValidId: string = bob.id;

        await userService.deleteMember(inputValidId);

        const aliceInRepository = await userRepository.findMemberById(alice.id);
        expect(aliceInRepository).toBeDefined();
        await expect(userRepository.findMemberById(bob.id)).rejects.toThrow(NotFoundError);
    });

});

describe('deleteAdmin', () => {

    it('deleteAdmin_admin_removesUserAndAdminRowViaCascade', async () => {
        const seededAdmin = await userRepository.createAdmin({
            email: 'admin@test.com', fullName: 'Admin User', phone: '0700000099',
            dateOfBirth: '1985-03-20', password: 'AdminPass1!',
        });
        const inputId: string = seededAdmin.id;

        await userService.deleteAdmin(inputId);

        await expect(userRepository.findAdminById(inputId)).rejects.toThrow(NotFoundError);
        const userInRepository = await userRepository.findByEmail('admin@test.com');
        expect(userInRepository).toBeNull();
    });

    it('deleteAdmin_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userService.deleteAdmin(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('deleteAdmin_afterErrorOnNonExistentId_subsequentValidCallOnDifferentRowSucceeds', async () => {
        const adminA = await userRepository.createAdmin({
            email: 'admin-a@test.com',
            fullName: 'Admin A',
            phone: '0700000001',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        const adminB = await userRepository.createAdmin({
            email: 'admin-b@test.com',
            fullName: 'Admin B',
            phone: '0700000002',
            dateOfBirth: '1985-01-01',
            password: 'AdminPass1!'
        });
        await userService.deleteAdmin('00000000-0000-0000-0000-000000000000').catch(() => {
        });
        const inputValidId: string = adminB.id;

        await userService.deleteAdmin(inputValidId);

        const adminAInRepository = await userRepository.findAdminById(adminA.id);
        expect(adminAInRepository).toBeDefined();
        await expect(userRepository.findAdminById(adminB.id)).rejects.toThrow(NotFoundError);
    });

});