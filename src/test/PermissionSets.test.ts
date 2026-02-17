import * as assert from 'assert';
import { PermissionSets } from '../../src/domain/PermissionSets';

describe('PermissionSets', () => {
    let permissionSets: PermissionSets;
    let mockRecords: any[];

    beforeEach(() => {
        mockRecords = [
            {
                Id: 'ps1',
                PermissionSetId: 'ps1',
                Name: 'Test_PS_1',
                Label: 'Test Permission Set 1',
                IsOwnedByProfile: false,
                AssigneeId: 'user1',
                SObjectType: 'Account'
            },
            {
                Id: 'ps2',
                PermissionSetId: 'ps2',
                Name: 'Test_PS_2',
                Label: 'Test Permission Set 2',
                IsOwnedByProfile: false,
                AssigneeId: 'user2',
                SObjectType: 'Contact'
            },
            {
                Id: 'ps3',
                PermissionSetId: 'ps3',
                Name: 'Test_PS_3',
                Label: 'Test Permission Set 3',
                IsOwnedByProfile: true,
                AssigneeId: 'user1',
                PermissionSetGroupId: 'psg1',
                SObjectType: 'Account'
            }
        ];
        permissionSets = new PermissionSets(mockRecords);
    });

    describe('constructor', () => {
        it('should create instance with provided records', () => {
            // Assert
            assert.strictEqual(permissionSets.getRecords().length, 3);
            assert.deepStrictEqual(permissionSets.getRecords(), mockRecords);
        });

        it('should handle empty record list', () => {
            // Act
            const emptyPS = new PermissionSets([]);

            // Assert
            assert.strictEqual(emptyPS.getRecords().length, 0);
        });

        it('should handle null record list', () => {
            // Act
            const nullPS = new PermissionSets(null as any);

            // Assert
            assert.strictEqual(nullPS.getRecords().length, 0);
        });
    });

    describe('newInstance', () => {
        it('should create new instance using factory method', () => {
            // Act
            const instance = PermissionSets.newInstance(mockRecords);

            // Assert
            assert.ok(instance instanceof PermissionSets);
            assert.strictEqual(instance.getRecords().length, 3);
        });
    });

    describe('getRecords', () => {
        it('should return all permission set records', () => {
            // Act
            const records = permissionSets.getRecords();

            // Assert
            assert.strictEqual(records.length, 3);
            assert.deepStrictEqual(records, mockRecords);
        });
    });

    describe('getPermissionSetsMap', () => {
        it('should return permission sets mapped by PermissionSetId', () => {
            // Act
            const map = permissionSets.getPermissionSetsMap();

            // Assert
            assert.ok(map instanceof Map);
            assert.strictEqual(map.size, 3);
            assert.ok(map.has('ps1'));
            assert.ok(map.has('ps2'));
            assert.ok(map.has('ps3'));
            assert.strictEqual(map.get('ps1').Name, 'Test_PS_1');
        });
    });

    describe('getPermissionSetIds', () => {
        it('should return all permission set IDs', () => {
            // Act
            const ids = permissionSets.getPermissionSetIds();

            // Assert
            assert.strictEqual(ids.length, 3);
            assert.ok(ids.includes('ps1'));
            assert.ok(ids.includes('ps2'));
            assert.ok(ids.includes('ps3'));
        });

        it('should handle records with only Id property', () => {
            // Arrange
            const recordsWithIdOnly = [
                { Id: 'ps1', Name: 'Test' }, // No PermissionSetId
                { PermissionSetId: 'ps2', Name: 'Test2' } // No Id
            ];
            const psWithIdOnly = new PermissionSets(recordsWithIdOnly);

            // Act
            const ids = psWithIdOnly.getPermissionSetIds();

            // Assert
            assert.strictEqual(ids.length, 2);
            assert.ok(ids.includes('ps1'));
            assert.ok(ids.includes('ps2'));
        });
    });

    describe('getUniquePermissionSetIds', () => {
        it('should return unique permission set IDs', () => {
            // Act
            const ids = permissionSets.getUniquePermissionSetIds();

            // Assert
            assert.strictEqual(ids.length, 3);
            assert.ok(ids.includes('ps1'));
            assert.ok(ids.includes('ps2'));
            assert.ok(ids.includes('ps3'));
        });

        it('should dedupe duplicate IDs', () => {
            // Arrange
            const duplicateRecords = [
                { Id: 'ps1', Name: 'Test1' },
                { Id: 'ps1', Name: 'Test2' },
                { Id: 'ps2', Name: 'Test3' }
            ];
            const psWithDuplicates = new PermissionSets(duplicateRecords);

            // Act
            const ids = psWithDuplicates.getUniquePermissionSetIds();

            // Assert
            assert.strictEqual(ids.length, 2);
            assert.ok(ids.includes('ps1'));
            assert.ok(ids.includes('ps2'));
        });
    });

    describe('getPermissionSetsByUserId', () => {
        it('should return permission sets for specific user', () => {
            // Act
            const userPS = permissionSets.getPermissionSetsByUserId('user1');

            // Assert
            assert.strictEqual(userPS.length, 2);
            assert.ok(userPS.some(ps => ps.Id === 'ps1'));
            assert.ok(userPS.some(ps => ps.Id === 'ps3'));
        });

        it('should return empty array for user with no assignments', () => {
            // Act
            const userPS = permissionSets.getPermissionSetsByUserId('nonexistent');

            // Assert
            assert.strictEqual(userPS.length, 0);
        });
    });

    describe('getAssigneeIds', () => {
        it('should return unique assignee IDs', () => {
            // Act
            const assignees = permissionSets.getAssigneeIds();

            // Assert
            assert.strictEqual(assignees.length, 2);
            assert.ok(assignees.includes('user1'));
            assert.ok(assignees.includes('user2'));
        });
    });

    describe('getNonGroupAssignments', () => {
        it('should return permission sets not assigned via groups', () => {
            // Act
            const nonGroup = permissionSets.getNonGroupAssignments();

            // Assert
            assert.strictEqual(nonGroup.length, 2);
            assert.ok(nonGroup.some(ps => ps.Id === 'ps1'));
            assert.ok(nonGroup.some(ps => ps.Id === 'ps2'));
            assert.ok(!nonGroup.some(ps => ps.Id === 'ps3'));
        });
    });

    describe('getGroupAssignments', () => {
        it('should return permission sets assigned via groups', () => {
            // Act
            const groupAssignments = permissionSets.getGroupAssignments();

            // Assert
            assert.strictEqual(groupAssignments.length, 1);
            assert.strictEqual(groupAssignments[0].Id, 'ps3');
        });
    });

    describe('count', () => {
        it('should return the number of permission set records', () => {
            // Act
            const count = permissionSets.count();

            // Assert
            assert.strictEqual(count, 3);
        });
    });

    describe('getPermissionSetsForObject', () => {
        it('should return permission sets for specific object', () => {
            // Act
            const accountPS = permissionSets.getPermissionSetsForObject('Account');

            // Assert
            assert.strictEqual(accountPS.length, 2);
            assert.ok(accountPS.some(ps => ps.Id === 'ps1'));
            assert.ok(accountPS.some(ps => ps.Id === 'ps3'));
        });

        it('should handle case-insensitive matching', () => {
            // Act
            const accountPS = permissionSets.getPermissionSetsForObject('account');

            // Assert
            assert.strictEqual(accountPS.length, 2);
        });

        it('should handle SObjectType vs SobjectType variations', () => {
            // Arrange
            const recordsWithSObjectType = [
                { Id: 'ps1', SObjectType: 'Account', Name: 'Test' }
            ];
            const psWithSObjectType = new PermissionSets(recordsWithSObjectType);

            // Act
            const accountPS = psWithSObjectType.getPermissionSetsForObject('Account');

            // Assert
            assert.strictEqual(accountPS.length, 1);
        });
    });

    describe('aggregatePermissionsForObject', () => {
        it('should aggregate object permissions for permission sets', () => {
            // Arrange
            const objectPermissions = [
                {
                    ParentId: 'ps1',
                    SobjectType: 'Account',
                    PermissionsRead: true,
                    PermissionsCreate: false,
                    PermissionsEdit: true,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: true
                },
                {
                    ParentId: 'ps2',
                    SobjectType: 'Account',
                    PermissionsRead: false,
                    PermissionsCreate: true,
                    PermissionsEdit: false,
                    PermissionsDelete: true,
                    PermissionsViewAllRecords: true,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false
                },
                {
                    ParentId: 'ps1',
                    SobjectType: 'Contact', // Different object
                    PermissionsRead: true
                }
            ];

            // Act
            const aggregated = permissionSets.aggregatePermissionsForObject(objectPermissions, 'Account');

            // Assert
            assert.strictEqual(aggregated.length, 2);

            // Check first permission set
            const ps1Perm = aggregated.find(p => p.ParentId === 'ps1');
            assert.ok(ps1Perm);
            assert.strictEqual(ps1Perm.PermissionsRead, true);
            assert.strictEqual(ps1Perm.PermissionsCreate, false);
            assert.strictEqual(ps1Perm.PermissionsEdit, true);
            assert.strictEqual(ps1Perm.PermissionsDelete, false);
            assert.strictEqual(ps1Perm.PermissionsViewAllRecords, false);
            assert.strictEqual(ps1Perm.PermissionsModifyAllRecords, false);
            assert.strictEqual(ps1Perm.PermissionsViewAllFields, true);
            assert.ok(ps1Perm.Parent);
            assert.strictEqual(ps1Perm.Parent.Name, 'Test_PS_1');
            assert.strictEqual(ps1Perm.isPermissionSet, true);

            // Check second permission set
            const ps2Perm = aggregated.find(p => p.ParentId === 'ps2');
            assert.ok(ps2Perm);
            assert.strictEqual(ps2Perm.PermissionsRead, false);
            assert.strictEqual(ps2Perm.PermissionsCreate, true);
            assert.strictEqual(ps2Perm.PermissionsEdit, false);
            assert.strictEqual(ps2Perm.PermissionsDelete, true);
            assert.strictEqual(ps2Perm.PermissionsViewAllRecords, true);
            assert.strictEqual(ps2Perm.PermissionsModifyAllRecords, false);
            assert.strictEqual(ps2Perm.PermissionsViewAllFields, false);
        });

        it('should handle case-insensitive object name matching', () => {
            // Arrange
            const objectPermissions = [
                {
                    ParentId: 'ps1',
                    SobjectType: 'ACCOUNT', // Uppercase
                    PermissionsRead: true
                }
            ];

            // Act
            const aggregated = permissionSets.aggregatePermissionsForObject(objectPermissions, 'account');

            // Assert
            assert.strictEqual(aggregated.length, 1);
        });

        it('should skip permission sets without permissions for the object', () => {
            // Arrange
            const objectPermissions = [
                {
                    ParentId: 'ps1',
                    SobjectType: 'Account',
                    PermissionsRead: true
                }
            ];

            // Act
            const aggregated = permissionSets.aggregatePermissionsForObject(objectPermissions, 'Account');

            // Assert
            assert.strictEqual(aggregated.length, 1);
            assert.strictEqual(aggregated[0].ParentId, 'ps1');
        });

        it('should handle SObjectType vs SobjectType variations', () => {
            // Arrange
            const objectPermissions = [
                {
                    ParentId: 'ps1',
                    SObjectType: 'Account', // Capital S
                    PermissionsRead: true
                }
            ];

            // Act
            const aggregated = permissionSets.aggregatePermissionsForObject(objectPermissions, 'Account');

            // Assert
            assert.strictEqual(aggregated.length, 1);
        });
    });
});