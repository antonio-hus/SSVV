import {prisma} from '@/lib/database';
import {userService} from '@/lib/di';
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
import {ActionResult} from '@/lib/domain/action-result';
import {
    AdminListOptions,
    AdminWithUser,
    MemberListOptions,
    MemberWithUser,
    MemberWithUserAndTempPassword
} from '@/lib/domain/user';
import {PageResult} from '@/lib/domain/pagination';
import {
    CreateAdminInput,
    CreateMemberInput,
    CreateMemberWithTempPasswordInput,
    UpdateAdminInput,
    UpdateMemberInput
} from '@/lib/schema/user-schema';

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
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
        const input: CreateMemberInput = {
            email: 'alice@gym.test',
            fullName: 'Alice Smith',
            phone: '+40700000001',
            dateOfBirth: '1990-05-15',
            password: 'ValidPass123!',
            membershipStart: '2024-01-01',
        };

        const result: ActionResult<MemberWithUser> = await createMember(input);

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
        await seedMember({email: 'alice@gym.test'});
        const input: CreateMemberInput = {
            email: 'alice@gym.test',
            fullName: 'Alice Clone',
            phone: '+40700000002',
            dateOfBirth: '1991-01-01',
            password: 'ValidPass123!',
            membershipStart: '2024-06-01',
        };

        const result: ActionResult<MemberWithUser> = await createMember(input);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await userService.listMembers();
        expect(list.total).toBe(1);
    });

    it('createMember_missingRequiredFields_returnsValidationFailureWithFieldErrors', async () => {
        const input = {} as unknown as CreateMemberInput;

        const result: ActionResult<MemberWithUser> = await createMember(input);

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
        const input: CreateMemberWithTempPasswordInput = {
            email: 'alice@gym.test',
            fullName: 'Alice Smith',
            phone: '+40700000001',
            dateOfBirth: '1990-05-15',
            membershipStart: '2024-01-01',
        };

        const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(input);

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
        const fetched = await userService.getMember((result as {
            success: true;
            data: MemberWithUserAndTempPassword
        }).data.id);
        expect(fetched.user.email).toBe('alice@gym.test');
    });

    it('createMemberWithTempPassword_duplicateEmail_returnsFailureWithConflictMessage', async () => {
        await seedMember({email: 'alice@gym.test'});
        const input: CreateMemberWithTempPasswordInput = {
            email: 'alice@gym.test',
            fullName: 'Alice Clone',
            phone: '+40700000002',
            dateOfBirth: '1991-01-01',
            membershipStart: '2024-06-01',
        };

        const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(input);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await userService.listMembers();
        expect(list.total).toBe(1);
    });

    it('createMemberWithTempPassword_missingRequiredFields_returnsValidationFailureWithFieldErrors', async () => {
        const input = {} as unknown as CreateMemberWithTempPasswordInput;

        const result: ActionResult<MemberWithUserAndTempPassword> = await createMemberWithTempPassword(input);

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
        const input: CreateAdminInput = {
            email: 'admin@gym.test',
            fullName: 'Admin User',
            phone: '+40700000010',
            dateOfBirth: '1985-03-20',
            password: 'AdminPass123!',
        };

        const result: ActionResult<AdminWithUser> = await createAdmin(input);

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
        await seedAdmin({email: 'admin@gym.test'});
        const input: CreateAdminInput = {
            email: 'admin@gym.test',
            fullName: 'Admin Clone',
            phone: '+40700000011',
            dateOfBirth: '1986-01-01',
            password: 'AdminPass123!',
        };

        const result: ActionResult<AdminWithUser> = await createAdmin(input);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const list = await userService.listAdmins();
        expect(list.total).toBe(1);
    });

    it('createAdmin_missingRequiredFields_returnsValidationFailureWithFieldErrors', async () => {
        const input = {} as unknown as CreateAdminInput;

        const result: ActionResult<AdminWithUser> = await createAdmin(input);

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
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith'});

        const result: ActionResult<MemberWithUser> = await getMember(seeded.id);

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
        const result: ActionResult<MemberWithUser> = await getMember('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('getAdmin', () => {

    it('getAdmin_existingId_returnsSuccessWithMatchingAdmin', async () => {
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User'});

        const result: ActionResult<AdminWithUser> = await getAdmin(seeded.id);

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
        const result: ActionResult<AdminWithUser> = await getAdmin('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('listMembers', () => {

    it('listMembers_defaultOptions_returnsSuccessWithAllMembers', async () => {
        await seedMember({email: 'charlie@gym.test', fullName: 'Charlie Brown', phone: '+40700000001'});
        await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000002'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000003'});

        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers();

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
        await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});
        const options: MemberListOptions = {search: 'alice'};

        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers(options);

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

    it('listMembers_emptyDatabase_returnsSuccessWithEmptyPage', async () => {
        const result: ActionResult<PageResult<MemberWithUser>> = await listMembers();

        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

});

describe('listAdmins', () => {

    it('listAdmins_defaultOptions_returnsSuccessWithAllAdmins', async () => {
        await seedAdmin({email: 'charlie-a@gym.test', fullName: 'Charlie Admin', phone: '+40700000011'});
        await seedAdmin({email: 'alice-a@gym.test', fullName: 'Alice Admin', phone: '+40700000012'});

        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins();

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

    it('listAdmins_searchByEmail_returnsSuccessWithMatchingAdmin', async () => {
        await seedAdmin({email: 'alice-a@gym.test', fullName: 'Alice Admin', phone: '+40700000011'});
        await seedAdmin({email: 'bob-a@gym.test', fullName: 'Bobby Admin', phone: '+40700000012'});
        const options: AdminListOptions = {search: 'bob-a@gym.test'};

        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins(options);

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

    it('listAdmins_emptyDatabase_returnsSuccessWithEmptyPage', async () => {
        const result: ActionResult<PageResult<AdminWithUser>> = await listAdmins();

        expect(result).toEqual({success: true, data: {items: [], total: 0}});
    });

});

describe('updateMember', () => {

    it('updateMember_validFullUpdate_returnsSuccessWithAllFieldsUpdated', async () => {
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith'});
        const data: UpdateMemberInput = {
            email: 'alice2@gym.test',
            fullName: 'Alice Updated',
            phone: '+40700000099',
            dateOfBirth: '1991-06-20',
            password: 'NewValidPass1!',
            membershipStart: '2025-03-01',
        };

        const result: ActionResult<MemberWithUser> = await updateMember(seeded.id, data);

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
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        const data: UpdateMemberInput = {fullName: 'Alice Renamed'};

        const result: ActionResult<MemberWithUser> = await updateMember(seeded.id, data);

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

    it('updateMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const data: UpdateMemberInput = {fullName: 'Ghost Member'};

        const result: ActionResult<MemberWithUser> = await updateMember('00000000-0000-0000-0000-000000000000', data);

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateMember_emailTakenByAnotherUser_returnsFailureWithConflictMessage', async () => {
        const alice = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});
        const data: UpdateMemberInput = {email: 'bob@gym.test'};

        const result: ActionResult<MemberWithUser> = await updateMember(alice.id, data);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await userService.getMember(alice.id);
        expect(fetched.user.email).toBe('alice@gym.test');
    });

    it('updateMember_emptyInput_returnsSuccessWithAllFieldsUnchanged', async () => {
        const seeded = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith'});
        const data: UpdateMemberInput = {};

        const result: ActionResult<MemberWithUser> = await updateMember(seeded.id, data);

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

    it('updateMember_invalidEmailFormat_returnsValidationFailureWithFieldErrors', async () => {
        const input = {email: 'not-an-email'} as unknown as UpdateMemberInput;

        const result: ActionResult<MemberWithUser> = await updateMember('00000000-0000-0000-0000-000000000000', input);

        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({email: expect.anything()}),
        });
    });

});

describe('updateAdmin', () => {

    it('updateAdmin_validFullUpdate_returnsSuccessWithAllFieldsUpdated', async () => {
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User'});
        const data: UpdateAdminInput = {
            email: 'admin2@gym.test',
            fullName: 'Admin Updated',
            phone: '+40700000099',
            dateOfBirth: '1986-07-10',
            password: 'NewAdminPass1!',
        };

        const result: ActionResult<AdminWithUser> = await updateAdmin(seeded.id, data);

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
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User', phone: '+40700000011'});
        const data: UpdateAdminInput = {fullName: 'Admin Renamed'};

        const result: ActionResult<AdminWithUser> = await updateAdmin(seeded.id, data);

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

    it('updateAdmin_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const data: UpdateAdminInput = {fullName: 'Ghost Admin'};

        const result: ActionResult<AdminWithUser> = await updateAdmin('00000000-0000-0000-0000-000000000000', data);

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

    it('updateAdmin_emailTakenByAnotherUser_returnsFailureWithConflictMessage', async () => {
        const adminA = await seedAdmin({email: 'admin-a@gym.test', fullName: 'Admin Alpha', phone: '+40700000011'});
        await seedAdmin({email: 'admin-b@gym.test', fullName: 'Admin Beta', phone: '+40700000012'});
        const data: UpdateAdminInput = {email: 'admin-b@gym.test'};

        const result: ActionResult<AdminWithUser> = await updateAdmin(adminA.id, data);

        expect(result).toEqual({success: false, message: expect.any(String)});
        const fetched = await userService.getAdmin(adminA.id);
        expect(fetched.user.email).toBe('admin-a@gym.test');
    });

    it('updateAdmin_emptyInput_returnsSuccessWithAllFieldsUnchanged', async () => {
        const seeded = await seedAdmin({email: 'admin@gym.test', fullName: 'Admin User'});
        const data: UpdateAdminInput = {};

        const result: ActionResult<AdminWithUser> = await updateAdmin(seeded.id, data);

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

    it('updateAdmin_invalidEmailFormat_returnsValidationFailureWithFieldErrors', async () => {
        const input = {email: 'not-an-email'} as unknown as UpdateAdminInput;

        const result: ActionResult<AdminWithUser> = await updateAdmin('00000000-0000-0000-0000-000000000000', input);

        expect(result).toEqual({
            success: false,
            message: 'Validation failed',
            errors: expect.objectContaining({email: expect.anything()}),
        });
    });

});

describe('suspendMember', () => {

    it('suspendMember_activeMember_returnsSuccessWithIsActiveFalse', async () => {
        const seeded = await seedMember();

        const result: ActionResult<MemberWithUser> = await suspendMember(seeded.id);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({id: seeded.id, isActive: false}),
        });
        const fetched = await userService.getMember(seeded.id);
        expect(fetched.isActive).toBe(false);
    });

    it('suspendMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<MemberWithUser> = await suspendMember('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('activateMember', () => {

    it('activateMember_suspendedMember_returnsSuccessWithIsActiveTrue', async () => {
        const seeded = await seedMember();
        await userService.suspendMember(seeded.id);

        const result: ActionResult<MemberWithUser> = await activateMember(seeded.id);

        expect(result).toEqual({
            success: true,
            data: expect.objectContaining({id: seeded.id, isActive: true}),
        });
        const fetched = await userService.getMember(seeded.id);
        expect(fetched.isActive).toBe(true);
    });

    it('activateMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<MemberWithUser> = await activateMember('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('deleteMember', () => {

    it('deleteMember_existingMember_returnsSuccessAndMemberNoLongerExists', async () => {
        const seeded = await seedMember();

        const result: ActionResult<void> = await deleteMember(seeded.id);

        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listMembers();
        expect(list.total).toBe(0);
    });

    it('deleteMember_oneOfManyMembers_returnsSuccessAndOnlyTargetIsRemoved', async () => {
        const alice = await seedMember({email: 'alice@gym.test', fullName: 'Alice Smith', phone: '+40700000001'});
        const bob = await seedMember({email: 'bob@gym.test', fullName: 'Bob Johnson', phone: '+40700000002'});

        const result: ActionResult<void> = await deleteMember(alice.id);

        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listMembers();
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(bob.id);
    });

    it('deleteMember_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<void> = await deleteMember('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});

describe('deleteAdmin', () => {

    it('deleteAdmin_existingAdmin_returnsSuccessAndAdminNoLongerExists', async () => {
        const seeded = await seedAdmin();

        const result: ActionResult<void> = await deleteAdmin(seeded.id);

        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listAdmins();
        expect(list.total).toBe(0);
    });

    it('deleteAdmin_oneOfManyAdmins_returnsSuccessAndOnlyTargetIsRemoved', async () => {
        const adminA = await seedAdmin({email: 'admin-a@gym.test', fullName: 'Admin Alpha', phone: '+40700000011'});
        const adminB = await seedAdmin({email: 'admin-b@gym.test', fullName: 'Admin Beta', phone: '+40700000012'});

        const result: ActionResult<void> = await deleteAdmin(adminA.id);

        expect(result).toEqual({success: true, data: undefined});
        const list = await userService.listAdmins();
        expect(list.total).toBe(1);
        expect(list.items[0].id).toBe(adminB.id);
    });

    it('deleteAdmin_nonExistentId_returnsFailureWithNotFoundMessage', async () => {
        const result: ActionResult<void> = await deleteAdmin('00000000-0000-0000-0000-000000000000');

        expect(result).toEqual({success: false, message: expect.any(String)});
    });

});