import * as assert from 'assert';
import { PermissionDomainService } from '../../src/domain/PermissionDomainService';
import { Users } from '../../src/domain/Users';
import { ObjectPermissions } from '../../src/domain/ObjectPermissions';
import { FieldPermissions } from '../../src/domain/FieldPermissions';
import { PermissionSets } from '../../src/domain/PermissionSets';
import { PermissionSetGroups } from '../../src/domain/PermissionSetGroups';

describe('PermissionDomainService', () => {
    describe('newUsers', () => {
        it('should create a Users domain instance', () => {
            // Arrange
            const records = [{ Id: '1', Name: 'Test User' }];

            // Act
            const users = PermissionDomainService.newUsers(records);

            // Assert
            assert.ok(users instanceof Users);
            assert.strictEqual(users.getRecords().length, 1);
        });
    });

    describe('newObjectPermissions', () => {
        it('should create an ObjectPermissions domain instance', () => {
            // Arrange
            const records = [{ ParentId: 'ps1', SobjectType: 'Account', PermissionsRead: true }];

            // Act
            const objectPerms = PermissionDomainService.newObjectPermissions(records);

            // Assert
            assert.ok(objectPerms instanceof ObjectPermissions);
            assert.strictEqual(objectPerms.getRecords().length, 1);
        });
    });

    describe('newFieldPermissions', () => {
        it('should create a FieldPermissions domain instance', () => {
            // Arrange
            const records = [{ ParentId: 'ps1', Field: 'Account.Name', PermissionsRead: true }];

            // Act
            const fieldPerms = PermissionDomainService.newFieldPermissions(records);

            // Assert
            assert.ok(fieldPerms instanceof FieldPermissions);
            assert.strictEqual(fieldPerms.getRecords().length, 1);
        });
    });

    describe('newPermissionSets', () => {
        it('should create a PermissionSets domain instance', () => {
            // Arrange
            const records = [{ Id: 'ps1', Name: 'Test Permission Set' }];

            // Act
            const permissionSets = PermissionDomainService.newPermissionSets(records);

            // Assert
            assert.ok(permissionSets instanceof PermissionSets);
            assert.strictEqual(permissionSets.getRecords().length, 1);
        });
    });

    describe('newPermissionSetGroups', () => {
        it('should create a PermissionSetGroups domain instance', () => {
            // Arrange
            const records = [{ Id: 'psg1', MasterLabel: 'Test Group' }];

            // Act
            const psg = PermissionDomainService.newPermissionSetGroups(records);

            // Assert
            assert.ok(psg instanceof PermissionSetGroups);
            assert.strictEqual(psg.getRecords().length, 1);
        });
    });

    describe('calculateEffectivePermissions', () => {
        it('should calculate effective permissions with field-level overrides', () => {
            // Arrange
            const objectPerms = [
                {
                    ParentId: 'ps1',
                    SobjectType: 'Account',
                    PermissionsRead: true,
                    PermissionsEdit: true
                },
                {
                    ParentId: 'ps2',
                    SobjectType: 'Account',
                    PermissionsRead: false,
                    PermissionsEdit: false
                }
            ];

            const fieldPerms = [
                {
                    ParentId: 'ps1',
                    Field: 'Account.Name',
                    PermissionsRead: false, // Override to false
                    PermissionsEdit: true   // Keep true
                }
            ];

            // Act
            const effective = PermissionDomainService.calculateEffectivePermissions(objectPerms, fieldPerms);

            // Assert
            assert.strictEqual(effective.length, 2);

            // First permission should have field override
            assert.strictEqual(effective[0].PermissionsRead, false); // Overridden
            assert.strictEqual(effective[0].PermissionsEdit, true);  // Not overridden
            assert.strictEqual(effective[0].isFieldOverride, true);

            // Second permission should not have field override
            assert.strictEqual(effective[1].PermissionsRead, false);
            assert.strictEqual(effective[1].PermissionsEdit, false);
            assert.strictEqual(effective[1].isFieldOverride, false);
        });

        it('should handle empty field permissions', () => {
            // Arrange
            const objectPerms = [
                {
                    ParentId: 'ps1',
                    SobjectType: 'Account',
                    PermissionsRead: true,
                    PermissionsEdit: false
                }
            ];

            // Act
            const effective = PermissionDomainService.calculateEffectivePermissions(objectPerms, []);

            // Assert
            assert.strictEqual(effective.length, 1);
            assert.strictEqual(effective[0].PermissionsRead, true);
            assert.strictEqual(effective[0].PermissionsEdit, false);
            assert.strictEqual(effective[0].isFieldOverride, false);
        });

        it('should handle empty object permissions', () => {
            // Arrange
            const fieldPerms = [
                {
                    ParentId: 'ps1',
                    Field: 'Account.Name',
                    PermissionsRead: true
                }
            ];

            // Act
            const effective = PermissionDomainService.calculateEffectivePermissions([], fieldPerms);

            // Assert
            assert.strictEqual(effective.length, 0);
        });
    });

    describe('groupPermissionsBySourceType', () => {
        it('should group permissions by profile and permission set', () => {
            // Arrange
            const permissions = [
                {
                    ParentId: 'profile1',
                    Parent: { IsOwnedByProfile: true, Name: 'System Administrator' },
                    PermissionsRead: true
                },
                {
                    ParentId: 'ps1',
                    Parent: { IsOwnedByProfile: false, Name: 'Test PS' },
                    PermissionsRead: true
                },
                {
                    ParentId: 'ps2',
                    Parent: { IsOwnedByProfile: false, Name: 'Test PS 2' },
                    PermissionsRead: false
                }
            ];

            // Act
            const grouped = PermissionDomainService.groupPermissionsBySourceType(permissions);

            // Assert
            assert.ok(grouped instanceof Map);
            assert.strictEqual(grouped.size, 2);

            const profiles = grouped.get('profile')!;
            assert.strictEqual(profiles.length, 1);
            assert.strictEqual(profiles[0].Parent.Name, 'System Administrator');

            const permissionSets = grouped.get('permission-set')!;
            assert.strictEqual(permissionSets.length, 2);
            assert.ok(permissionSets.some(ps => ps.Parent.Name === 'Test PS'));
            assert.ok(permissionSets.some(ps => ps.Parent.Name === 'Test PS 2'));
        });

        it('should handle permissions without Parent property', () => {
            // Arrange
            const permissions = [
                { ParentId: 'ps1', PermissionsRead: true } // No Parent property
            ];

            // Act
            const grouped = PermissionDomainService.groupPermissionsBySourceType(permissions);

            // Assert
            assert.ok(grouped instanceof Map);
            assert.strictEqual(grouped.size, 1);

            const permissionSets = grouped.get('permission-set')!;
            assert.strictEqual(permissionSets.length, 1);
        });

        it('should handle empty permissions array', () => {
            // Act
            const grouped = PermissionDomainService.groupPermissionsBySourceType([]);

            // Assert
            assert.ok(grouped instanceof Map);
            assert.strictEqual(grouped.size, 0);
        });
    });

    describe('flattenPsgComponents', () => {
        it('should flatten PSG component records', () => {
            // Arrange
            const psgRecords = [
                {
                    Id: 'psg1',
                    MasterLabel: 'Test Group 1',
                    DeveloperName: 'Test_Group_1',
                    PermissionSetGroupComponents: {
                        records: [
                            { PermissionSetId: 'ps1' },
                            { PermissionSetId: 'ps2' }
                        ]
                    }
                },
                {
                    Id: 'psg2',
                    MasterLabel: 'Test Group 2',
                    DeveloperName: 'Test_Group_2',
                    PermissionSetGroupComponents: {
                        records: [
                            { PermissionSetId: 'ps3' }
                        ]
                    }
                }
            ];

            // Act
            const flattened = PermissionDomainService.flattenPsgComponents(psgRecords);

            // Assert
            assert.strictEqual(flattened.length, 3);

            // Check first group components
            const group1Components = flattened.filter(f => f.PermissionSetGroupId === 'psg1');
            assert.strictEqual(group1Components.length, 2);
            assert.ok(group1Components.some(c => c.PermissionSetId === 'ps1'));
            assert.ok(group1Components.some(c => c.PermissionSetId === 'ps2'));
            assert.strictEqual(group1Components[0].GroupName, 'Test Group 1');
            assert.strictEqual(group1Components[0].GroupDeveloperName, 'Test_Group_1');

            // Check second group components
            const group2Components = flattened.filter(f => f.PermissionSetGroupId === 'psg2');
            assert.strictEqual(group2Components.length, 1);
            assert.strictEqual(group2Components[0].PermissionSetId, 'ps3');
        });

        it('should handle PSG records without components', () => {
            // Arrange
            const psgRecords = [
                {
                    Id: 'psg1',
                    MasterLabel: 'Test Group',
                    DeveloperName: 'Test_Group'
                    // No PermissionSetGroupComponents
                }
            ];

            // Act
            const flattened = PermissionDomainService.flattenPsgComponents(psgRecords);

            // Assert
            assert.strictEqual(flattened.length, 0);
        });

        it('should handle empty PSG records array', () => {
            // Act
            const flattened = PermissionDomainService.flattenPsgComponents([]);

            // Assert
            assert.strictEqual(flattened.length, 0);
        });

        it('should handle PSG records with empty components', () => {
            // Arrange
            const psgRecords = [
                {
                    Id: 'psg1',
                    MasterLabel: 'Test Group',
                    DeveloperName: 'Test_Group',
                    PermissionSetGroupComponents: {
                        records: []
                    }
                }
            ];

            // Act
            const flattened = PermissionDomainService.flattenPsgComponents(psgRecords);

            // Assert
            assert.strictEqual(flattened.length, 0);
        });
    });
});