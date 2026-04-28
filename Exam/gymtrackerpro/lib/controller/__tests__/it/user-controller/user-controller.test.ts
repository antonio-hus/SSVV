import {prisma} from '@/lib/database';
import {exerciseService, userService, workoutSessionService} from '@/lib/di';
import {
    createMember,
    createMemberWithTempPassword,
    createAdmin,
    getMember,
    getAdmin,
    listMembers,
    listAdmins,
    updateMember,
    updateAdmin,
    suspendMember,
    activateMember,
    deleteMember,
    deleteAdmin,
} from '@/lib/controller/user-controller';
import {MuscleGroup, Equipment} from '@/prisma/generated/prisma/client';
import {ActionResult} from '@/lib/domain/action-result';
import {
    AdminListOptions,
    AdminWithUser,
    MemberListOptions,
    MemberWithUser,
    MemberWithUserAndTempPassword,
} from '@/lib/domain/user';
import {PageResult} from '@/lib/domain/pagination';
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

const seedMember = async (overrides: Partial<CreateMemberInput> = {}) => {
    return userService.createMember({
        email: overrides.email ?? 'member@gym.test',
        fullName: overrides.fullName ?? 'Test Member',
        phone: overrides.phone ?? '+40700000000',
        dateOfBirth: overrides.dateOfBirth ?? '1990-01-01',
        password: overrides.password ?? 'ValidPass123!',
        membershipStart: overrides.membershipStart ?? '2024-01-01',
    });
};

const seedAdmin = async (overrides: Partial<CreateAdminInput> = {}) => {
    return userService.createAdmin({
        email: overrides.email ?? 'admin@gym.test',
        fullName: overrides.fullName ?? 'Admin User',
        phone: overrides.phone ?? '+40700000010',
        dateOfBirth: overrides.dateOfBirth ?? '1985-01-01',
        password: overrides.password ?? 'AdminPass123!',
    });
};

describe('createMember', () => {

    it('createMember_validInput_returnsSuccessWithPersistedMemberWithUser', async () => {
        // Arrange
        const input: CreateMemberInput = {
            email: 'alice@gym.test',
            fullName: 'Alice Smith',
            phone: '+40700000001',
            dateOfBirth: '1990-05-15',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };

        // Act
        const result: ActionResult<MemberWithUser> = await createMember(input);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: expect.any(String),
                isActive: true,
                user: expect.objectContaining({
                    email: 'alice@gym.test',
                    fullName: 'Alice Smith',
                    role: 'MEMBER',
                }),
            }),
        });
        const fetched = await userService.getMember((result as { success: true; data: MemberWithUser }).data.id);
        expect(fetched.user.email).toBe('alice@gym.test');
    });

    it('createMember_duplicateEmail_returnsFailureWithConflictMessage', async () => {
        // Arrange
        await seedMember({email: 'alice@gym.test'});
        const input: CreateMemberInput = {
            email: 'alice@gym.test',
            fullName: 'Alice Clone',
            phone: '+40700000002',
            dateOfBirth: '1991-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-06-01',
        };

        // Act
        const result: ActionResult<MemberWithUser> = await createMember(input);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await userService.listMembers();
        expect(list.total).toBe(1);
    });

    it('createMember_afterConflict_subsequentValidCallSucceeds', async () => {
        // Arrange
        await seedMember({email: 'alice@gym.test'});
        await createMember({
            email: 'alice@gym.test',
            fullName: 'Alice Clone',
            phone: '+40700000002',
            dateOfBirth: '1991-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-06-01',
        });
        const input: CreateMemberInput = {
            email: 'bob@gym.test',
            fullName: 'Bob Jones',
            phone: '+40700000003',
            dateOfBirth: '1988-03-10',
            password: 'ValidPass456!',
            membershipStart: '2024-02-01',
        };

        // Act
        const result: ActionResult<MemberWithUser> = await createMember(input);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({email: 'bob@gym.test'}),
            }),
        });
        const list = await userService.listMembers();
        expect(list.total).toBe(2);
    });

    it('createMember_missingRequiredFields_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const input = {} as unknown as CreateMemberInput;

        // Act
        const result: ActionResult<MemberWithUser> = await createMember(input);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({
                email: expect.anything(),
                fullName: expect.anything(),
                phone: expect.anything(),
                dateOfBirth: expect.anything(),
                password: expect.anything(),
                membershipStart: expect.anything(),
            }),
        });
        const list = await userService.listMembers();
        expect(list.total).toBe(0);
    });

});

describe('createMemberWithTempPassword', () => {

    it('createMemberWithTempPassword_validInput_returnsSuccessWithTempPasswordDefined', async () => {
        // Arrange
        const input: CreateMemberWithTempPasswordInput = {
            email: 'alice@gym.test',
            fullName: 'Alice Smith',
            phone: '+40700000001',
            dateOfBirth: '1990-05-15',
            membershipStart: '2024-01-01',
        };

        // Act
        const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(input);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: expect.any(String),
                isActive: true,
                tempPassword: expect.any(String),
                user: expect.objectContaining({
                    email: 'alice@gym.test',
                    fullName: 'Alice Smith',
                    role: 'MEMBER',
                }),
            }),
        });
        const fetched = await userService.getMember(
            (result as { success: true; data: MemberWithUserAndTempPassword }).data.id,
        );
        expect(fetched.user.email).toBe('alice@gym.test');
    });

    it('createMemberWithTempPassword_duplicateEmail_returnsFailureWithConflictMessage', async () => {
        // Arrange
        await seedMember({email: 'alice@gym.test'});
        const input: CreateMemberWithTempPasswordInput = {
            email: 'alice@gym.test',
            fullName: 'Alice Clone',
            phone: '+40700000002',
            dateOfBirth: '1991-01-01',
            membershipStart: '2024-06-01',
        };

        // Act
        const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(input);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await userService.listMembers();
        expect(list.total).toBe(1);
    });

    it('createMemberWithTempPassword_missingRequiredFields_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const input = {} as unknown as CreateMemberWithTempPasswordInput;

        // Act
        const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(input);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({
                email: expect.anything(),
                fullName: expect.anything(),
                phone: expect.anything(),
                dateOfBirth: expect.anything(),
                membershipStart: expect.anything(),
            }),
        });
        const list = await userService.listMembers();
        expect(list.total).toBe(0);
    });

});

describe('createAdmin', () => {

    it('createAdmin_validInput_returnsSuccessWithPersistedAdminWithUser', async () => {
        // Arrange
        const input: CreateAdminInput = {
            email: 'admin@gym.test',
            fullName: 'Admin User',
            phone: '+40700000010',
            dateOfBirth: '1985-03-20',
            password: 'AdminPass123!',
        };

        // Act
        const result: ActionResult<AdminWithUser> = await createAdmin(input);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: expect.any(String),
                user: expect.objectContaining({
                    email: 'admin@gym.test',
                    fullName: 'Admin User',
                    role: 'ADMIN',
                }),
            }),
        });
        const fetched = await userService.getAdmin((result as { success: true; data: AdminWithUser }).data.id);
        expect(fetched.user.email).toBe('admin@gym.test');
    });

    it('createAdmin_duplicateEmail_returnsFailureWithConflictMessage', async () => {
        // Arrange
        await seedAdmin({email: 'admin@gym.test'});
        const input: CreateAdminInput = {
            email: 'admin@gym.test',
            fullName: 'Admin Clone',
            phone: '+40700000011',
            dateOfBirth: '1986-01-01',
            password: 'AdminPass123!',
        };

        // Act
        const result: ActionResult<AdminWithUser> = await createAdmin(input);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await userService.listAdmins();
        expect(list.total).toBe(1);
    });

    it('createAdmin_afterConflict_subsequentValidCallSucceeds', async () => {
        // Arrange
        await seedAdmin({email: 'admin@gym.test'});
        await createAdmin({
            email: 'admin@gym.test',
            fullName: 'Admin Clone',
            phone: '+40700000011',
            dateOfBirth: '1986-01-01',
            password: 'AdminPass123!',
        });
        const input: CreateAdminInput = {
            email: 'admin2@gym.test',
            fullName: 'Admin Two',
            phone: '+40700000012',
            dateOfBirth: '1987-04-15',
            password: 'AdminPass456!',
        };

        // Act
        const result: ActionResult<AdminWithUser> = await createAdmin(input);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({email: 'admin2@gym.test'}),
            }),
        });
        const list = await userService.listAdmins();
        expect(list.total).toBe(2);
    });

    it('createAdmin_missingRequiredFields_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const input = {} as unknown as CreateAdminInput;

        // Act
        const result: ActionResult<AdminWithUser> = await createAdmin(input);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({
                email: expect.anything(),
                fullName: expect.anything(),
                phone: expect.anything(),
                dateOfBirth: expect.anything(),
                password: expect.anything(),
            }),
        });
        const list = await userService.listAdmins();
        expect(list.total).toBe(0);
    });

});

describe('getMember', () => {

    it('getMember_existingId_returnsSuccessWithMatchingMember', async () => {
        // Arrange
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith'});

        // Act
        const result: ActionResult<MemberWithUser> = await getMember(seeded.id);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seeded.id,
                user: expect.objectContaining({
                    email: 'alice@gym.test',
                    fullName: 'Alice Smith',
                    role: 'MEMBER',
                }),
            }),
        });
    });

    it('getMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<MemberWithUser> = await getMember(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('getAdmin', () => {

    it('getAdmin_existingId_returnsSuccessWithMatchingAdmin', async () => {
        // Arrange
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User'});

        // Act
        const result: ActionResult<AdminWithUser> = await getAdmin(seeded.id);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seeded.id,
                user: expect.objectContaining({
                    email: 'admin@gym.test',
                    fullName: 'Admin User',
                    role: 'ADMIN',
                }),
            }),
        });
    });

    it('getAdmin_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<AdminWithUser> = await getAdmin(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('listMembers', () => {

    it('listMembers_defaultOptions_returnsSuccessWithAllMembers', async () => {
        // Arrange
        await seedMember({email: 'charlie@gym.test', fullName: 'Charlie Brown', phone: '+40700000001'});
        await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000002'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000003'});

        // Act
        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers();

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 3,
                items: expect.arrayContaining([
                    expect.objectContaining({user: expect.objectContaining({email: 'alice@gym.test'})}),
                    expect.objectContaining({user: expect.objectContaining({email: 'bob@gym.test'})}),
                    expect.objectContaining({user: expect.objectContaining({email: 'charlie@gym.test'})}),
                ]),
            }),
        });
    });

    it('listMembers_searchByName_returnsSuccessWithMatchingMembers', async () => {
        // Arrange
        await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});
        const options: MemberListOptions = {search: 'alice'};

        // Act
        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({user: expect.objectContaining({fullName: 'Alice Smith'})}),
                ]),
            }),
        });
    });

    it('listMembers_searchByEmail_returnsSuccessWithMatchingMember', async () => {
        // Arrange
        await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});
        const options: MemberListOptions = {search: 'bob@gym.test'};

        // Act
        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({user: expect.objectContaining({email: 'bob@gym.test'})}),
                ]),
            }),
        });
    });

    it('listMembers_pageSizeExceedsTotalRowCount_returnsSuccessWithAllRows', async () => {
        // Arrange
        await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});
        const options: MemberListOptions = {pageSize: 100};

        // Act
        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 2}),
        });
        const data = (result as { success: true; data: PageResult<MemberWithUser> }).data;
        expect(data.items).toHaveLength(2);
    });

    it('listMembers_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        // Arrange
        await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        const options: MemberListOptions = {search: '%'};

        // Act
        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers(options);

        // Assert
        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

    it('listMembers_pagination_returnsCorrectSlice', async () => {
        // Arrange
        for (let i = 1; i <= 5; i++) {
            await seedMember({
                email: `m${i}@gym.test`,
                fullName: `Member${i}`,
                phone: `+4070000000${i}`,
            });
        }
        const options: MemberListOptions = {page: 2, pageSize: 2};

        // Act
        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 5}),
        });
        const data = (result as { success: true; data: PageResult<MemberWithUser> }).data;
        expect(data.items).toHaveLength(2);
        expect(data.items[0].user.fullName).toBe('Member3');
        expect(data.items[1].user.fullName).toBe('Member4');
    });

    it('listMembers_emptyDatabase_returnsSuccessWithEmptyPage', async () => {
        // Arrange
        // (no seeding — database is empty after beforeEach)

        // Act
        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers();

        // Assert
        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

});

describe('listAdmins', () => {

    it('listAdmins_defaultOptions_returnsSuccessWithAllAdmins', async () => {
        // Arrange
        await seedAdmin({email: 'charlie-a@gym.test', fullName: 'Charlie Admin', phone: '+40700000011'});
        await seedAdmin({email: 'alice-a@gym.test', fullName: 'Alice Admin', phone: '+40700000012'});

        // Act
        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins();

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 2,
                items: expect.arrayContaining([
                    expect.objectContaining({user: expect.objectContaining({email: 'alice-a@gym.test'})}),
                    expect.objectContaining({user: expect.objectContaining({email: 'charlie-a@gym.test'})}),
                ]),
            }),
        });
    });

    it('listAdmins_searchByName_returnsSuccessWithMatchingAdmin', async () => {
        // Arrange
        await seedAdmin({email: 'alice-a@gym.test', fullName: 'Alice Admin', phone: '+40700000011'});
        await seedAdmin({email: 'bob-a@gym.test', fullName: 'Bob Admin', phone: '+40700000012'});
        const options: AdminListOptions = {search: 'alice'};

        // Act
        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({user: expect.objectContaining({fullName: 'Alice Admin'})}),
                ]),
            }),
        });
    });

    it('listAdmins_searchByEmail_returnsSuccessWithMatchingAdmin', async () => {
        // Arrange
        await seedAdmin({email: 'alice-a@gym.test', fullName: 'Alice Admin', phone: '+40700000011'});
        await seedAdmin({email: 'bob-a@gym.test', fullName: 'Bobby Admin', phone: '+40700000012'});
        const options: AdminListOptions = {search: 'bob-a@gym.test'};

        // Act
        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                total: 1,
                items: expect.arrayContaining([
                    expect.objectContaining({user: expect.objectContaining({email: 'bob-a@gym.test'})}),
                ]),
            }),
        });
    });

    it('listAdmins_pageSizeExceedsTotalRowCount_returnsSuccessWithAllRows', async () => {
        // Arrange
        await seedAdmin({email: 'alice-a@gym.test', fullName: 'Alice Admin', phone: '+40700000011'});
        await seedAdmin({email: 'bob-a@gym.test', fullName: 'Bob Admin', phone: '+40700000012'});
        const options: AdminListOptions = {pageSize: 50};

        // Act
        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 2}),
        });
        const data = (result as { success: true; data: PageResult<AdminWithUser> }).data;
        expect(data.items).toHaveLength(2);
    });

    it('listAdmins_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        // Arrange
        await seedAdmin({email: 'alice-a@gym.test', fullName: 'Alice Admin', phone: '+40700000011'});
        const options: AdminListOptions = {search: '%'};

        // Act
        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins(options);

        // Assert
        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

    it('listAdmins_pagination_returnsCorrectSlice', async () => {
        // Arrange
        for (let i = 1; i <= 5; i++) {
            await seedAdmin({
                email: `a${i}@gym.test`,
                fullName: `Admin${i}`,
                phone: `+4070000001${i}`,
            });
        }
        const options: AdminListOptions = {page: 2, pageSize: 2};

        // Act
        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins(options);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({total: 5}),
        });
        const data = (result as { success: true; data: PageResult<AdminWithUser> }).data;
        expect(data.items).toHaveLength(2);
        expect(data.items[0].user.fullName).toBe('Admin3');
        expect(data.items[1].user.fullName).toBe('Admin4');
    });

    it('listAdmins_emptyDatabase_returnsSuccessWithEmptyPage', async () => {
        // Arrange
        // (no seeding — database is empty after beforeEach)

        // Act
        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins();

        // Assert
        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

});

describe('updateMember', () => {

    it('updateMember_validFullUpdate_returnsSuccessWithAllFieldsUpdated', async () => {
        // Arrange
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith'});
        const data: UpdateMemberInput = {
            email: 'alice2@gym.test',
            fullName: 'Alice Updated',
            phone: '+40700000099',
            dateOfBirth: '1991-06-20',
            password: 'NewValidPass1!',
            membershipStart: '2025-03-01',
        };

        // Act
        const result: ActionResult<MemberWithUser> = await updateMember(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seeded.id,
                user: expect.objectContaining({
                    email: 'alice2@gym.test',
                    fullName: 'Alice Updated',
                }),
            }),
        });
        const fetched = await userService.getMember(seeded.id);
        expect(fetched.user.email).toBe('alice2@gym.test');
        expect(fetched.user.fullName).toBe('Alice Updated');
    });

    it('updateMember_partialInput_returnsSuccessAndLeavesUnspecifiedFieldsUnchanged', async () => {
        // Arrange
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        const data: UpdateMemberInput = {fullName: 'Alice Renamed'};

        // Act
        const result: ActionResult<MemberWithUser> = await updateMember(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({
                    email: 'alice@gym.test',
                    fullName: 'Alice Renamed',
                }),
            }),
        });
        const fetched = await userService.getMember(seeded.id);
        expect(fetched.user.email).toBe('alice@gym.test');
        expect(fetched.user.fullName).toBe('Alice Renamed');
    });

    it('updateMember_sameEmailAsSelf_returnsSuccessAndUpdatesOtherFields', async () => {
        // Arrange
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith'});
        const data: UpdateMemberInput = {email: 'alice@gym.test', fullName: 'Alice Still'};

        // Act
        const result: ActionResult<MemberWithUser> = await updateMember(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({
                    email: 'alice@gym.test',
                    fullName: 'Alice Still',
                }),
            }),
        });
        const fetched = await userService.getMember(seeded.id);
        expect(fetched.user.email).toBe('alice@gym.test');
        expect(fetched.user.fullName).toBe('Alice Still');
    });

    it('updateMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const data: UpdateMemberInput = {fullName: 'Ghost Member'};

        // Act
        const result: ActionResult<MemberWithUser> = await updateMember('00000000-0000-0000-0000-000000000000', data);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateMember_emailTakenByAnotherUser_returnsFailureWithConflictMessage', async () => {
        // Arrange
        const alice = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});
        const data: UpdateMemberInput = {email: 'bob@gym.test'};

        // Act
        const result: ActionResult<MemberWithUser> = await updateMember(alice.id, data);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await userService.getMember(alice.id);
        expect(fetched.user.email).toBe('alice@gym.test');
    });

    it('updateMember_emptyInput_returnsSuccessWithAllFieldsUnchanged', async () => {
        // Arrange
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith'});
        const data: UpdateMemberInput = {};

        // Act
        const result: ActionResult<MemberWithUser> = await updateMember(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({
                    email: 'alice@gym.test',
                    fullName: 'Alice Smith',
                }),
            }),
        });
        const fetched = await userService.getMember(seeded.id);
        expect(fetched.user.email).toBe('alice@gym.test');
        expect(fetched.user.fullName).toBe('Alice Smith');
    });

    it('updateMember_afterConflict_subsequentValidCallSucceeds', async () => {
        // Arrange
        const alice = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});
        await updateMember(alice.id, {email: 'bob@gym.test'});
        const data: UpdateMemberInput = {fullName: 'Alice Renamed'};

        // Act
        const result: ActionResult<MemberWithUser> = await updateMember(alice.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({fullName: 'Alice Renamed'}),
            }),
        });
        const fetched = await userService.getMember(alice.id);
        expect(fetched.user.fullName).toBe('Alice Renamed');
    });

    it('updateMember_invalidEmailFormat_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const input = {email: 'not-an-email'} as unknown as UpdateMemberInput;

        // Act
        const result: ActionResult<MemberWithUser> = await updateMember('00000000-0000-0000-0000-000000000000', input);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({email: expect.anything()}),
        });
    });

});

describe('updateAdmin', () => {

    it('updateAdmin_validFullUpdate_returnsSuccessWithAllFieldsUpdated', async () => {
        // Arrange
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User'});
        const data: UpdateAdminInput = {
            email: 'admin2@gym.test',
            fullName: 'Admin Updated',
            phone: '+40700000099',
            dateOfBirth: '1986-07-10',
            password: 'NewAdminPass1!',
        };

        // Act
        const result: ActionResult<AdminWithUser> = await updateAdmin(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                id: seeded.id,
                user: expect.objectContaining({
                    email: 'admin2@gym.test',
                    fullName: 'Admin Updated',
                }),
            }),
        });
        const fetched = await userService.getAdmin(seeded.id);
        expect(fetched.user.email).toBe('admin2@gym.test');
        expect(fetched.user.fullName).toBe('Admin Updated');
    });

    it('updateAdmin_partialInput_returnsSuccessAndLeavesUnspecifiedFieldsUnchanged', async () => {
        // Arrange
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User', phone: '+40700000011'});
        const data: UpdateAdminInput = {fullName: 'Admin Renamed'};

        // Act
        const result: ActionResult<AdminWithUser> = await updateAdmin(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({
                    email: 'admin@gym.test',
                    fullName: 'Admin Renamed',
                }),
            }),
        });
        const fetched = await userService.getAdmin(seeded.id);
        expect(fetched.user.email).toBe('admin@gym.test');
        expect(fetched.user.fullName).toBe('Admin Renamed');
    });

    it('updateAdmin_sameEmailAsSelf_returnsSuccessAndUpdatesOtherFields', async () => {
        // Arrange
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User'});
        const data: UpdateAdminInput = {email: 'admin@gym.test', fullName: 'Admin Still'};

        // Act
        const result: ActionResult<AdminWithUser> = await updateAdmin(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({
                    email: 'admin@gym.test',
                    fullName: 'Admin Still',
                }),
            }),
        });
        const fetched = await userService.getAdmin(seeded.id);
        expect(fetched.user.email).toBe('admin@gym.test');
        expect(fetched.user.fullName).toBe('Admin Still');
    });

    it('updateAdmin_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const data: UpdateAdminInput = {fullName: 'Ghost Admin'};

        // Act
        const result: ActionResult<AdminWithUser> = await updateAdmin('00000000-0000-0000-0000-000000000000', data);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateAdmin_emailTakenByAnotherUser_returnsFailureWithConflictMessage', async () => {
        // Arrange
        const adminA = await seedAdmin({email: 'admin-a@gym.test', fullName: 'Admin Alpha', phone: '+40700000011'});
        await seedAdmin({email: 'admin-b@gym.test', fullName: 'Admin Beta', phone: '+40700000012'});
        const data: UpdateAdminInput = {email: 'admin-b@gym.test'};

        // Act
        const result: ActionResult<AdminWithUser> = await updateAdmin(adminA.id, data);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await userService.getAdmin(adminA.id);
        expect(fetched.user.email).toBe('admin-a@gym.test');
    });

    it('updateAdmin_emptyInput_returnsSuccessWithAllFieldsUnchanged', async () => {
        // Arrange
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User'});
        const data: UpdateAdminInput = {};

        // Act
        const result: ActionResult<AdminWithUser> = await updateAdmin(seeded.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({
                    email: 'admin@gym.test',
                    fullName: 'Admin User',
                }),
            }),
        });
        const fetched = await userService.getAdmin(seeded.id);
        expect(fetched.user.email).toBe('admin@gym.test');
        expect(fetched.user.fullName).toBe('Admin User');
    });

    it('updateAdmin_afterConflict_subsequentValidCallSucceeds', async () => {
        // Arrange
        const adminA = await seedAdmin({email: 'admin-a@gym.test', fullName: 'Admin Alpha', phone: '+40700000011'});
        await seedAdmin({email: 'admin-b@gym.test', fullName: 'Admin Beta', phone: '+40700000012'});
        await updateAdmin(adminA.id, {email: 'admin-b@gym.test'});
        const data: UpdateAdminInput = {fullName: 'Admin Renamed'};

        // Act
        const result: ActionResult<AdminWithUser> = await updateAdmin(adminA.id, data);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({
                user: expect.objectContaining({fullName: 'Admin Renamed'}),
            }),
        });
        const fetched = await userService.getAdmin(adminA.id);
        expect(fetched.user.fullName).toBe('Admin Renamed');
    });

    it('updateAdmin_invalidEmailFormat_returnsValidationFailureWithFieldErrors', async () => {
        // Arrange
        const input = {email: 'not-an-email'} as unknown as UpdateAdminInput;

        // Act
        const result: ActionResult<AdminWithUser> = await updateAdmin('00000000-0000-0000-0000-000000000000', input);

        // Assert
        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({email: expect.anything()}),
        });
    });

});

describe('suspendMember', () => {

    it('suspendMember_activeMember_returnsSuccessWithIsActiveFalse', async () => {
        // Arrange
        const seeded = await seedMember();

        // Act
        const result: ActionResult<MemberWithUser> = await suspendMember(seeded.id);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({id: seeded.id, isActive: false}),
        });
        const fetched = await userService.getMember(seeded.id);
        expect(fetched.isActive).toBe(false);
    });

    it('suspendMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<MemberWithUser> = await suspendMember(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('activateMember', () => {

    it('activateMember_suspendedMember_returnsSuccessWithIsActiveTrue', async () => {
        // Arrange
        const seeded = await seedMember();
        await userService.suspendMember(seeded.id);

        // Act
        const result: ActionResult<MemberWithUser> = await activateMember(seeded.id);

        // Assert
        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({id: seeded.id, isActive: true}),
        });
        const fetched = await userService.getMember(seeded.id);
        expect(fetched.isActive).toBe(true);
    });

    it('activateMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<MemberWithUser> = await activateMember(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('deleteMember', () => {

    it('deleteMember_existingMember_returnsSuccessAndMemberNoLongerExists', async () => {
        // Arrange
        const seeded = await seedMember();

        // Act
        const result: ActionResult<void> = await deleteMember(seeded.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listMembers();
        expect(list.total).toBe(0);
    });

    it('deleteMember_oneOfManyMembers_returnsSuccessAndOnlyTargetIsRemoved', async () => {
        // Arrange
        const alice = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        const bob = await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});

        // Act
        const result: ActionResult<void> = await deleteMember(alice.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listMembers();
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(bob.id);
    });

    it('deleteMember_memberWithWorkoutSession_returnsSuccessAndCascadesSessionDeletion', async () => {
        // Arrange
        const seeded = await seedMember();
        const exercise = await exerciseService.createExercise({
            name: `Exercise-${Date.now()}`,
            description: 'Seeded for cascade test',
            muscleGroup: MuscleGroup.CHEST,
            equipmentNeeded: Equipment.BARBELL,
        });
        await workoutSessionService.createWorkoutSession(
            {memberId: seeded.id, date: '2024-06-01', duration: 60},
            [{exerciseId: exercise.id, sets: 3, reps: 10, weight: 50}],
        );

        // Act
        const result: ActionResult<void> = await deleteMember(seeded.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listMembers();
        expect(list.total).toBe(0);
        const sessionCount = await prisma.workoutSession.count();
        expect(sessionCount).toBe(0);
    });

    it('deleteMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<void> = await deleteMember(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('deleteMember_afterErrorOnNonExistentId_subsequentValidCallSucceeds', async () => {
        // Arrange
        const alice = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        const bob = await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});
        await deleteMember('00000000-0000-0000-0000-000000000000');

        // Act
        const result: ActionResult<void> = await deleteMember(bob.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listMembers();
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(alice.id);
    });

});

describe('deleteAdmin', () => {

    it('deleteAdmin_existingAdmin_returnsSuccessAndAdminNoLongerExists', async () => {
        // Arrange
        const seeded = await seedAdmin();

        // Act
        const result: ActionResult<void> = await deleteAdmin(seeded.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listAdmins();
        expect(list.total).toBe(0);
    });

    it('deleteAdmin_oneOfManyAdmins_returnsSuccessAndOnlyTargetIsRemoved', async () => {
        // Arrange
        const adminA = await seedAdmin({email: 'admin-a@gym.test', fullName: 'Admin Alpha', phone: '+40700000011'});
        const adminB = await seedAdmin({email: 'admin-b@gym.test', fullName: 'Admin Beta', phone: '+40700000012'});

        // Act
        const result: ActionResult<void> = await deleteAdmin(adminA.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listAdmins();
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(adminB.id);
    });

    it('deleteAdmin_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        // Arrange
        const id = '00000000-0000-0000-0000-000000000000';

        // Act
        const result: ActionResult<void> = await deleteAdmin(id);

        // Assert
        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('deleteAdmin_afterErrorOnNonExistentId_subsequentValidCallSucceeds', async () => {
        // Arrange
        const adminA = await seedAdmin({email: 'admin-a@gym.test', fullName: 'Admin Alpha', phone: '+40700000011'});
        const adminB = await seedAdmin({email: 'admin-b@gym.test', fullName: 'Admin Beta', phone: '+40700000012'});
        await deleteAdmin('00000000-0000-0000-0000-000000000000');

        // Act
        const result: ActionResult<void> = await deleteAdmin(adminB.id);

        // Assert
        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listAdmins();
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(adminA.id);
    });

});