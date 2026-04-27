import {prisma} from '@/lib/database';
import {userRepository} from '@/lib/di';
import {AdminListOptions, MemberListOptions, Role} from "@/lib/domain/user";
import {ConflictError, NotFoundError} from '@/lib/domain/errors';
import {CreateMemberInput, CreateAdminInput, UpdateMemberInput, UpdateAdminInput} from '@/lib/schema/user-schema';

beforeEach(async () => {
    await prisma.workoutSessionExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.user.deleteMany();
});

afterAll(async () => {
    await prisma.$disconnect();
});

const FIXED_HASH = '$2a$12$fixedHashValueUsedForDirectSeeding00000000000000000';

const seedMember = async (overrides: Partial<CreateMemberInput & { passwordHash: string; isActive: boolean }> = {}) => {
    const result = await prisma.user.create({
        data: {
            email: overrides.email ?? 'member@test.com',
            fullName: overrides.fullName ?? 'Test Member',
            phone: overrides.phone ?? '0700000000',
            dateOfBirth: overrides.dateOfBirth ?? new Date('1990-01-01'),
            passwordHash: overrides.passwordHash ?? FIXED_HASH,
            role: Role.MEMBER,
            member: {
                create: {
                    membershipStart: overrides.membershipStart ?? new Date('2024-01-01'),
                    isActive: overrides.isActive ?? true,
                },
            },
        },
        include: {member: true},
    });
    return result.member!;
};

const seedAdmin = async (overrides: Partial<CreateAdminInput & { passwordHash: string }> = {}) => {
    const result = await prisma.user.create({
        data: {
            email: overrides.email ?? 'admin@test.com',
            fullName: overrides.fullName ?? 'Test Admin',
            phone: overrides.phone ?? '0700000099',
            dateOfBirth: overrides.dateOfBirth ?? new Date('1985-01-01'),
            passwordHash: overrides.passwordHash ?? FIXED_HASH,
            role: Role.ADMIN,
            admin: {create: {}},
        },
        include: {admin: true},
    });
    return result.admin!;
};

const seedWorkoutSession = async (memberId: string) => {
    return prisma.workoutSession.create({
        data: {
            memberId,
            date: new Date('2024-06-01'),
            duration: 60,
            notes: 'Test session',
        },
    });
};

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

        const result = await userRepository.createMember(inputCreateMember);

        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.fullName).toBe('Alice Smith');
        expect(result.user.role).toBe(Role.MEMBER);
        expect(result.isActive).toBe(true);
        expect(result.membershipStart).toEqual(new Date('2024-01-01'));
        const userInDb = await prisma.user.findUnique({where: {email: 'alice@test.com'}});
        expect(userInDb).not.toBeNull();
        expect(userInDb!.role).toBe(Role.MEMBER);
        const memberInDb = await prisma.member.findUnique({where: {id: result.id}});
        expect(memberInDb).not.toBeNull();
        expect(memberInDb!.isActive).toBe(true);
    });

    it('createMember_duplicateEmail_throwsConflictError', async () => {
        await seedMember({email: 'alice@test.com'});
        const inputCreateMember: CreateMemberInput = {
            email: 'alice@test.com',
            fullName: 'Alice Smith 2',
            phone: '0700000002',
            dateOfBirth: '1991-01-01',
            password: 'Secret123!',
            membershipStart: '2024-06-01',
        };

        const action = () => userRepository.createMember(inputCreateMember);

        await expect(action()).rejects.toThrow(ConflictError);
        const count = await prisma.user.count();
        expect(count).toBe(1);
    });

    it('createMember_afterConflict_subsequentValidCallSucceeds', async () => {
        await seedMember({email: 'alice@test.com'});
        const inputConflict: CreateMemberInput = {
            email: 'alice@test.com', fullName: 'X', phone: '0',
            dateOfBirth: '2000-01-01', password: 'p', membershipStart: '2024-01-01',
        };
        await userRepository.createMember(inputConflict).catch(() => {
        });
        const inputCreateMember: CreateMemberInput = {
            email: 'bob@test.com',
            fullName: 'Bob Jones',
            phone: '0700000003',
            dateOfBirth: '1988-03-10',
            password: 'Secret456!',
            membershipStart: '2024-02-01',
        };

        const result = await userRepository.createMember(inputCreateMember);

        expect(result.user.email).toBe('bob@test.com');
        const count = await prisma.user.count();
        expect(count).toBe(2);
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

        const result = await userRepository.createAdmin(inputCreateAdmin);

        expect(result.user.email).toBe('admin@test.com');
        expect(result.user.role).toBe(Role.ADMIN);
        const userInDb = await prisma.user.findUnique({where: {email: 'admin@test.com'}});
        expect(userInDb).not.toBeNull();
        expect(userInDb!.role).toBe(Role.ADMIN);
        const adminInDb = await prisma.admin.findUnique({where: {id: result.id}});
        expect(adminInDb).not.toBeNull();
    });

    it('createAdmin_duplicateEmail_throwsConflictError', async () => {
        await seedAdmin({email: 'admin@test.com'});
        const inputCreateAdmin: CreateAdminInput = {
            email: 'admin@test.com',
            fullName: 'Admin Two',
            phone: '0700000098',
            dateOfBirth: '1986-01-01',
            password: 'AdminPass2!',
        };

        const action = () => userRepository.createAdmin(inputCreateAdmin);

        await expect(action()).rejects.toThrow(ConflictError);
        const count = await prisma.user.count();
        expect(count).toBe(1);
    });

    it('createAdmin_afterConflict_subsequentValidCallSucceeds', async () => {
        await seedAdmin({email: 'admin@test.com'});
        const inputConflict: CreateAdminInput = {
            email: 'admin@test.com', fullName: 'X', phone: '0',
            dateOfBirth: '2000-01-01', password: 'p',
        };
        await userRepository.createAdmin(inputConflict).catch(() => {
        });
        const inputCreateAdmin: CreateAdminInput = {
            email: 'admin2@test.com',
            fullName: 'Admin Two',
            phone: '0700000097',
            dateOfBirth: '1987-04-15',
            password: 'AdminPass3!',
        };

        const result = await userRepository.createAdmin(inputCreateAdmin);

        expect(result.user.email).toBe('admin2@test.com');
        const count = await prisma.user.count();
        expect(count).toBe(2);
    });
});

describe('findById', () => {
    it('findById_existingMemberUser_returnsUserWithMemberProfileAndNullAdmin', async () => {
        const member = await seedMember({email: 'alice@test.com'});
        const inputId: string = member.userId;

        const result = await userRepository.findById(inputId);

        expect(result.id).toBe(member.userId);
        expect(result.role).toBe(Role.MEMBER);
        expect(result.member).not.toBeNull();
        expect(result.member!.id).toBe(member.id);
        expect(result.admin).toBeNull();
    });

    it('findById_existingAdminUser_returnsUserWithAdminProfileAndNullMember', async () => {
        const admin = await seedAdmin({email: 'admin@test.com'});
        const inputId: string = admin.userId;

        const result = await userRepository.findById(inputId);

        expect(result.id).toBe(admin.userId);
        expect(result.role).toBe(Role.ADMIN);
        expect(result.admin).not.toBeNull();
        expect(result.admin!.id).toBe(admin.id);
        expect(result.member).toBeNull();
    });

    it('findById_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userRepository.findById(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });
});

describe('findMemberById', () => {
    it('findMemberById_existingMember_returnsMemberWithUserAndAllFieldsMatching', async () => {
        const seeded = await seedMember({
            email: 'alice@test.com',
            fullName: 'Alice Smith',
        });
        const inputId: string = seeded.id;

        const result = await userRepository.findMemberById(inputId);

        expect(result.id).toBe(seeded.id);
        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.fullName).toBe('Alice Smith');
        expect(result.user.role).toBe(Role.MEMBER);
    });

    it('findMemberById_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userRepository.findMemberById(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });
});

describe('findAdminById', () => {
    it('findAdminById_existingAdmin_returnsAdminWithUserAndAllFieldsMatching', async () => {
        const seeded = await seedAdmin({
            email: 'admin@test.com',
            fullName: 'Admin User',
        });
        const inputId: string = seeded.id;

        const result = await userRepository.findAdminById(inputId);

        expect(result.id).toBe(seeded.id);
        expect(result.user.email).toBe('admin@test.com');
        expect(result.user.fullName).toBe('Admin User');
        expect(result.user.role).toBe(Role.ADMIN);
    });

    it('findAdminById_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userRepository.findAdminById(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });
});

describe('findByEmail', () => {
    it('findByEmail_existingEmail_returnsUserWithMemberProfile', async () => {
        await seedMember({email: 'alice@test.com'});
        const inputEmail: string = 'alice@test.com';

        const result = await userRepository.findByEmail(inputEmail);

        expect(result).not.toBeNull();
        expect(result!.email).toBe('alice@test.com');
        expect(result!.role).toBe(Role.MEMBER);
        expect(result!.member).not.toBeNull();
        expect(result!.admin).toBeNull();
    });

    it('findByEmail_nonExistentEmail_returnsNull', async () => {
        const inputEmail: string = 'nobody@test.com';

        const result = await userRepository.findByEmail(inputEmail);

        expect(result).toBeNull();
    });
});

describe('findMembers', () => {
    it('findMembers_noOptions_returnsAllMembersOrderedByFullNameAsc', async () => {
        await seedMember({email: 'charlie@test.com', fullName: 'Charlie'});
        await seedMember({email: 'alice@test.com', fullName: 'Alice'});
        await seedMember({email: 'bob@test.com', fullName: 'Bob'});
        const inputOptions: MemberListOptions | undefined = undefined;

        const result = await userRepository.findMembers(inputOptions);

        expect(result.total).toBe(3);
        expect(result.items).toHaveLength(3);
        expect(result.items[0].user.fullName).toBe('Alice');
        expect(result.items[1].user.fullName).toBe('Bob');
        expect(result.items[2].user.fullName).toBe('Charlie');
    });

    it('findMembers_noMembers_returnsEmptyPage', async () => {
        const inputOptions: MemberListOptions | undefined = undefined;

        const result = await userRepository.findMembers(inputOptions);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('findMembers_searchByName_returnsOnlyMatchingMember', async () => {
        await seedMember({email: 'alice@test.com', fullName: 'Alice Smith'});
        await seedMember({email: 'bob@test.com', fullName: 'Bob Jones'});
        const inputOptions: MemberListOptions = {search: 'alice'};

        const result = await userRepository.findMembers(inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].user.email).toBe('alice@test.com');
    });

    it('findMembers_searchByEmail_returnsOnlyMatchingMember', async () => {
        await seedMember({email: 'alice@test.com', fullName: 'Alice Smith'});
        await seedMember({email: 'bob@test.com', fullName: 'Bob Jones'});
        const inputOptions: MemberListOptions = {search: 'bob@test.com'};

        const result = await userRepository.findMembers(inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].user.email).toBe('bob@test.com');
    });

    it('findMembers_pageSizeExceedsTotal_returnsAllRows', async () => {
        await seedMember({email: 'alice@test.com', fullName: 'Alice'});
        await seedMember({email: 'bob@test.com', fullName: 'Bob'});
        const inputOptions: MemberListOptions = {pageSize: 100};

        const result = await userRepository.findMembers(inputOptions);

        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
    });

    it('findMembers_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        await seedMember({email: 'alice@test.com', fullName: 'Alice Smith'});
        const inputOptions: MemberListOptions = {search: '%'};

        const result = await userRepository.findMembers(inputOptions);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('findMembers_pagination_returnsCorrectSlice', async () => {
        for (let i = 1; i <= 5; i++) {
            await seedMember({
                email: `m${i}@test.com`,
                fullName: `Member${i}`,
            });
        }
        const inputOptions: MemberListOptions = {page: 2, pageSize: 2};

        const result = await userRepository.findMembers(inputOptions);

        expect(result.total).toBe(5);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].user.fullName).toBe('Member3');
        expect(result.items[1].user.fullName).toBe('Member4');
    });
});

describe('findAdmins', () => {
    it('findAdmins_noOptions_returnsAllAdminsOrderedByFullNameAsc', async () => {
        await seedAdmin({email: 'charlie-a@test.com', fullName: 'Charlie Admin'});
        await seedAdmin({email: 'alice-a@test.com', fullName: 'Alice Admin'});
        const inputOptions: AdminListOptions | undefined = undefined;

        const result = await userRepository.findAdmins(inputOptions);

        expect(result.total).toBe(2);
        expect(result.items[0].user.fullName).toBe('Alice Admin');
        expect(result.items[1].user.fullName).toBe('Charlie Admin');
    });

    it('findAdmins_noAdmins_returnsEmptyPage', async () => {
        const inputOptions: AdminListOptions | undefined = undefined;

        const result = await userRepository.findAdmins(inputOptions);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('findAdmins_searchByName_returnsOnlyMatchingAdmin', async () => {
        await seedAdmin({email: 'alice-a@test.com', fullName: 'Alice Admin'});
        await seedAdmin({email: 'bob-a@test.com', fullName: 'Bob Admin'});
        const inputOptions: AdminListOptions = {search: 'alice'};

        const result = await userRepository.findAdmins(inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].user.email).toBe('alice-a@test.com');
    });

    it('findAdmins_searchByEmail_returnsOnlyMatchingAdmin', async () => {
        await seedAdmin({email: 'alice-a@test.com', fullName: 'Alice Admin'});
        await seedAdmin({email: 'bob-a@test.com', fullName: 'Bob Admin'});
        const inputOptions: AdminListOptions = {search: 'bob-a@test.com'};

        const result = await userRepository.findAdmins(inputOptions);

        expect(result.total).toBe(1);
        expect(result.items[0].user.email).toBe('bob-a@test.com');
    });

    it('findAdmins_pageSizeExceedsTotal_returnsAllRows', async () => {
        await seedAdmin({email: 'alice-a@test.com', fullName: 'Alice Admin'});
        await seedAdmin({email: 'bob-a@test.com', fullName: 'Bob Admin'});
        const inputOptions: AdminListOptions = {pageSize: 50};

        const result = await userRepository.findAdmins(inputOptions);

        expect(result.total).toBe(2);
        expect(result.items).toHaveLength(2);
    });

    it('findAdmins_searchTermContainsLikeWildcard_treatedAsLiteralAndMatchesNoRows', async () => {
        await seedAdmin({email: 'alice-a@test.com', fullName: 'Alice Admin'});
        const inputOptions: AdminListOptions = {search: '%'};

        const result = await userRepository.findAdmins(inputOptions);

        expect(result.total).toBe(0);
        expect(result.items).toHaveLength(0);
    });

    it('findAdmins_pagination_returnsCorrectSlice', async () => {
        for (let i = 1; i <= 5; i++) {
            await seedAdmin({
                email: `a${i}@test.com`,
                fullName: `Admin${i}`,
            });
        }
        const inputOptions: AdminListOptions = {page: 2, pageSize: 2};

        const result = await userRepository.findAdmins(inputOptions);

        expect(result.total).toBe(5);
        expect(result.items).toHaveLength(2);
        expect(result.items[0].user.fullName).toBe('Admin3');
        expect(result.items[1].user.fullName).toBe('Admin4');
    });
});

describe('updateMember', () => {
    it('updateMember_allFields_returnsUpdatedMemberAndPersistsAllChanges', async () => {
        const seeded = await seedMember({
            email: 'alice@test.com',
            fullName: 'Alice Smith',
            phone: '0700000001',
        });
        const inputId: string = seeded.id;
        const inputUpdate: UpdateMemberInput = {
            email: 'alice2@test.com',
            fullName: 'Alice Updated',
            phone: '0700000002',
            dateOfBirth: '1991-06-20',
            password: 'NewPass1!',
            membershipStart: '2025-03-01',
        };

        const result = await userRepository.updateMember(inputId, inputUpdate);

        expect(result.user.email).toBe('alice2@test.com');
        expect(result.user.fullName).toBe('Alice Updated');
        expect(result.user.phone).toBe('0700000002');
        expect(result.membershipStart).toEqual(new Date('2025-03-01'));
        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        const memberInDb = await prisma.member.findUnique({where: {id: seeded.id}});
        expect(userInDb!.email).toBe('alice2@test.com');
        expect(userInDb!.fullName).toBe('Alice Updated');
        expect(memberInDb!.membershipStart).toEqual(new Date('2025-03-01'));
    });

    it('updateMember_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputUpdate: UpdateMemberInput = {fullName: 'X'};

        const action = () => userRepository.updateMember(inputId, inputUpdate);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('updateMember_duplicateEmail_throwsConflictErrorAndLeavesOriginalEmailIntact', async () => {
        const alice = await seedMember({email: 'alice@test.com', fullName: 'Alice'});
        await seedMember({email: 'bob@test.com', fullName: 'Bob'});
        const inputId: string = alice.id;
        const inputUpdate: UpdateMemberInput = {email: 'bob@test.com'};

        const action = () => userRepository.updateMember(inputId, inputUpdate);

        await expect(action()).rejects.toThrow(ConflictError);
        const aliceInDb = await prisma.user.findUnique({where: {id: alice.userId}});
        expect(aliceInDb!.email).toBe('alice@test.com');
    });

    it('updateMember_partialInput_onlySpecifiedFieldsChangeUnspecifiedFieldsUntouched', async () => {
        const seeded = await seedMember({
            email: 'alice@test.com',
            fullName: 'Alice Smith',
            phone: '0700000001',
        });
        const inputId: string = seeded.id;
        const inputUpdate: UpdateMemberInput = {fullName: 'Alice Renamed'};

        const result = await userRepository.updateMember(inputId, inputUpdate);

        expect(result.user.fullName).toBe('Alice Renamed');
        expect(result.user.email).toBe('alice@test.com');
        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        expect(userInDb!.fullName).toBe('Alice Renamed');
        expect(userInDb!.email).toBe('alice@test.com');
        expect(userInDb!.phone).toBe('0700000001');
    });

    it('updateMember_emptyInput_noFieldsMutated', async () => {
        const seeded = await seedMember({
            email: 'alice@test.com',
            fullName: 'Alice Smith',
            phone: '0700000001',
        });
        const inputId: string = seeded.id;
        const inputUpdate: UpdateMemberInput = {};

        const result = await userRepository.updateMember(inputId, inputUpdate);

        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.fullName).toBe('Alice Smith');
        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        expect(userInDb!.email).toBe('alice@test.com');
        expect(userInDb!.fullName).toBe('Alice Smith');
        expect(userInDb!.phone).toBe('0700000001');
    });

    it('updateMember_sameEmailAsSelf_doesNotThrowConflictErrorAndSucceeds', async () => {
        const seeded = await seedMember({
            email: 'alice@test.com',
            fullName: 'Alice Smith',
        });
        const inputId: string = seeded.id;
        const inputUpdate: UpdateMemberInput = {
            email: 'alice@test.com',
            fullName: 'Alice Still',
        };

        const result = await userRepository.updateMember(inputId, inputUpdate);

        expect(result.user.email).toBe('alice@test.com');
        expect(result.user.fullName).toBe('Alice Still');
        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        expect(userInDb!.email).toBe('alice@test.com');
    });

    it('updateMember_afterConflict_subsequentValidCallSucceeds', async () => {
        const alice = await seedMember({email: 'alice@test.com', fullName: 'Alice'});
        await seedMember({email: 'bob@test.com', fullName: 'Bob'});
        const inputConflictId: string = alice.id;
        const inputConflictUpdate: UpdateMemberInput = {email: 'bob@test.com'};
        await userRepository.updateMember(inputConflictId, inputConflictUpdate).catch(() => {
        });
        const inputValidId: string = alice.id;
        const inputValidUpdate: UpdateMemberInput = {fullName: 'Alice Renamed'};

        const result = await userRepository.updateMember(inputValidId, inputValidUpdate);

        expect(result.user.fullName).toBe('Alice Renamed');
        const aliceInDb = await prisma.user.findUnique({where: {id: alice.userId}});
        expect(aliceInDb!.fullName).toBe('Alice Renamed');
    });
});

describe('setMemberActive', () => {
    it('setMemberActive_activeToFalse_deactivatesMemberInDbAndReturnsFalse', async () => {
        const seeded = await seedMember({isActive: true});
        const inputId: string = seeded.id;
        const inputIsActive: boolean = false;

        const result = await userRepository.setMemberActive(inputId, inputIsActive);

        expect(result.isActive).toBe(false);
        const memberInDb = await prisma.member.findUnique({where: {id: seeded.id}});
        expect(memberInDb!.isActive).toBe(false);
    });

    it('setMemberActive_inactiveToTrue_activatesMemberInDbAndReturnsTrue', async () => {
        const seeded = await seedMember({isActive: false});
        const inputId: string = seeded.id;
        const inputIsActive: boolean = true;

        const result = await userRepository.setMemberActive(inputId, inputIsActive);

        expect(result.isActive).toBe(true);
        const memberInDb = await prisma.member.findUnique({where: {id: seeded.id}});
        expect(memberInDb!.isActive).toBe(true);
    });

    it('setMemberActive_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputIsActive: boolean = false;

        const action = () => userRepository.setMemberActive(inputId, inputIsActive);

        await expect(action()).rejects.toThrow(NotFoundError);
    });
});

describe('updateAdmin', () => {
    it('updateAdmin_allFields_returnsUpdatedAdminAndPersistsAllChanges', async () => {
        const seeded = await seedAdmin({
            email: 'admin@test.com',
            fullName: 'Admin User',
            phone: '0700000099',
        });
        const inputId: string = seeded.id;
        const inputUpdate: UpdateAdminInput = {
            email: 'admin2@test.com',
            fullName: 'Admin Updated',
            phone: '0700000098',
            dateOfBirth: '1986-07-10',
            password: 'NewAdminPass1!',
        };

        const result = await userRepository.updateAdmin(inputId, inputUpdate);

        expect(result.user.email).toBe('admin2@test.com');
        expect(result.user.fullName).toBe('Admin Updated');
        expect(result.user.phone).toBe('0700000098');
        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        expect(userInDb!.email).toBe('admin2@test.com');
        expect(userInDb!.fullName).toBe('Admin Updated');
    });

    it('updateAdmin_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';
        const inputUpdate: UpdateAdminInput = {fullName: 'X'};

        const action = () => userRepository.updateAdmin(inputId, inputUpdate);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('updateAdmin_duplicateEmail_throwsConflictErrorAndLeavesOriginalEmailIntact', async () => {
        const adminA = await seedAdmin({email: 'admin-a@test.com', fullName: 'Admin A'});
        await seedAdmin({email: 'admin-b@test.com', fullName: 'Admin B'});
        const inputId: string = adminA.id;
        const inputUpdate: UpdateAdminInput = {email: 'admin-b@test.com'};

        const action = () => userRepository.updateAdmin(inputId, inputUpdate);

        await expect(action()).rejects.toThrow(ConflictError);
        const adminAInDb = await prisma.user.findUnique({where: {id: adminA.userId}});
        expect(adminAInDb!.email).toBe('admin-a@test.com');
    });

    it('updateAdmin_partialInput_onlySpecifiedFieldsChangeUnspecifiedFieldsUntouched', async () => {
        const seeded = await seedAdmin({
            email: 'admin@test.com',
            fullName: 'Admin User',
            phone: '0700000099',
        });
        const inputId: string = seeded.id;
        const inputUpdate: UpdateAdminInput = {fullName: 'Admin Renamed'};

        const result = await userRepository.updateAdmin(inputId, inputUpdate);

        expect(result.user.fullName).toBe('Admin Renamed');
        expect(result.user.email).toBe('admin@test.com');
        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        expect(userInDb!.fullName).toBe('Admin Renamed');
        expect(userInDb!.email).toBe('admin@test.com');
        expect(userInDb!.phone).toBe('0700000099');
    });

    it('updateAdmin_emptyInput_noFieldsMutated', async () => {
        const seeded = await seedAdmin({
            email: 'admin@test.com',
            fullName: 'Admin User',
            phone: '0700000099',
        });
        const inputId: string = seeded.id;
        const inputUpdate: UpdateAdminInput = {};

        const result = await userRepository.updateAdmin(inputId, inputUpdate);

        expect(result.user.email).toBe('admin@test.com');
        expect(result.user.fullName).toBe('Admin User');
        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        expect(userInDb!.email).toBe('admin@test.com');
        expect(userInDb!.fullName).toBe('Admin User');
        expect(userInDb!.phone).toBe('0700000099');
    });

    it('updateAdmin_sameEmailAsSelf_doesNotThrowConflictErrorAndSucceeds', async () => {
        const seeded = await seedAdmin({
            email: 'admin@test.com',
            fullName: 'Admin User',
        });
        const inputId: string = seeded.id;
        const inputUpdate: UpdateAdminInput = {
            email: 'admin@test.com',
            fullName: 'Admin Still',
        };

        const result = await userRepository.updateAdmin(inputId, inputUpdate);

        expect(result.user.email).toBe('admin@test.com');
        expect(result.user.fullName).toBe('Admin Still');
        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        expect(userInDb!.email).toBe('admin@test.com');
    });

    it('updateAdmin_afterConflict_subsequentValidCallSucceeds', async () => {
        const adminA = await seedAdmin({email: 'admin-a@test.com', fullName: 'Admin A'});
        await seedAdmin({email: 'admin-b@test.com', fullName: 'Admin B'});
        const inputConflictId: string = adminA.id;
        const inputConflictUpdate: UpdateAdminInput = {
            email: 'admin-b@test.com',
        };
        await userRepository.updateAdmin(inputConflictId, inputConflictUpdate).catch(() => {
        });
        const inputValidUpdate: UpdateAdminInput = {
            fullName: 'Admin Renamed',
        };

        const result = await userRepository.updateAdmin(inputConflictId, inputValidUpdate);

        expect(result.user.fullName).toBe('Admin Renamed');
        const adminInDb = await prisma.user.findUnique({where: {id: adminA.userId}});
        expect(adminInDb!.fullName).toBe('Admin Renamed');
    });
});

describe('delete', () => {
    it('delete_member_removesUserAndMemberRowViaCascade', async () => {
        const seeded = await seedMember({email: 'alice@test.com'});
        const inputId: string = seeded.id;

        await userRepository.delete(inputId);

        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        const memberInDb = await prisma.member.findUnique({where: {id: seeded.id}});
        expect(userInDb).toBeNull();
        expect(memberInDb).toBeNull();
    });

    it('delete_admin_removesUserAndAdminRowViaCascade', async () => {
        const seeded = await seedAdmin({email: 'admin@test.com'});
        const inputId: string = seeded.id;

        await userRepository.delete(inputId);

        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        const adminInDb = await prisma.admin.findUnique({where: {id: seeded.id}});
        expect(userInDb).toBeNull();
        expect(adminInDb).toBeNull();
    });

    it('delete_memberWithWorkoutSession_cascadesWorkoutSessionDeletion', async () => {
        const seeded = await seedMember({email: 'alice@test.com'});
        const inputId: string = seeded.id;
        const session = await seedWorkoutSession(seeded.id);

        await userRepository.delete(inputId);

        const userInDb = await prisma.user.findUnique({where: {id: seeded.userId}});
        const memberInDb = await prisma.member.findUnique({where: {id: seeded.id}});
        const sessionInDb = await prisma.workoutSession.findUnique({where: {id: session.id}});
        expect(userInDb).toBeNull();
        expect(memberInDb).toBeNull();
        expect(sessionInDb).toBeNull();
    });

    it('delete_nonExistentId_throwsNotFoundError', async () => {
        const inputId: string = '00000000-0000-0000-0000-000000000000';

        const action = () => userRepository.delete(inputId);

        await expect(action()).rejects.toThrow(NotFoundError);
    });

    it('delete_afterErrorOnNonExistentId_subsequentValidCallOnDifferentRowSucceeds', async () => {
        const alice = await seedMember({email: 'alice@test.com', fullName: 'Alice'});
        const bob = await seedMember({email: 'bob@test.com', fullName: 'Bob'});
        const inputInvalidId: string = '00000000-0000-0000-0000-000000000000';
        await userRepository.delete(inputInvalidId).catch(() => {
        });
        const inputValidId: string = bob.id;

        await userRepository.delete(inputValidId);

        const aliceInDb = await prisma.user.findUnique({where: {id: alice.userId}});
        const bobInDb = await prisma.user.findUnique({where: {id: bob.userId}});
        expect(aliceInDb).not.toBeNull();
        expect(bobInDb).toBeNull();
    });
});