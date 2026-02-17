import * as assert from 'assert';
import { ObjectPermissions } from '../../src/domain/ObjectPermissions';

describe('ObjectPermissions', () => {
    let objectPermissions: ObjectPermissions;
    let mockRecords: any[];

    beforeEach(() => {
        mockRecords = [
            {
                ParentId: 'ps1',
                SobjectType: 'Account',
                PermissionsRead: true,
                PermissionsEdit: false,
                Parent: { IsOwnedByProfile: false, Name: 'TestPS1' }
            },
            {
                ParentId: 'ps1',
                SobjectType: 'Contact',
                PermissionsRead: true,
                PermissionsEdit: true,
                Parent: { IsOwnedByProfile: false, Name: 'TestPS1' }
            },
            {
                ParentId: 'ps2',
                SobjectType: 'Account',
                PermissionsRead: false,
                PermissionsEdit: true,
                Parent: { IsOwnedByProfile: true, Name: 'System Administrator' }
            },
            {
                ParentId: 'ps3',
                SobjectType: 'Account',
                PermissionsRead: false,
                PermissionsEdit: false,
                Parent: { IsOwnedByProfile: false, Name: 'TestPS3' }
            }
        ];
        objectPermissions = new ObjectPermissions(mockRecords);
    });

    describe('constructor', () => {
        it('should create instance with provided records', () => {
            // Assert
            assert.strictEqual(objectPermissions.getRecords().length, 4);
            assert.deepStrictEqual(objectPermissions.getRecords(), mockRecords);
        });

        it('should handle empty record list', () => {
            // Act
            const emptyPermissions = new ObjectPermissions([]);

            // Assert
            assert.strictEqual(emptyPermissions.getRecords().length, 0);
        });

        it('should handle null record list', () => {
            // Act
            const nullPermissions = new ObjectPermissions(null as any);

            // Assert
            assert.strictEqual(nullPermissions.getRecords().length, 0);
        });
    });

    describe('newInstance', () => {
        it('should create new instance using factory method', () => {
            // Act
            const instance = ObjectPermissions.newInstance(mockRecords);

            // Assert
            assert.ok(instance instanceof ObjectPermissions);
            assert.strictEqual(instance.getRecords().length, 4);
        });
    });

    describe('getRecords', () => {
        it('should return all permission records', () => {
            // Act
            const records = objectPermissions.getRecords();

            // Assert
            assert.strictEqual(records.length, 4);
            assert.deepStrictEqual(records, mockRecords);
        });
    });

    describe('getPermissionsMap', () => {
        it('should return permissions mapped by ParentId', () => {
            // Act
            const map = objectPermissions.getPermissionsMap();

            // Assert
            assert.ok(map instanceof Map);
            assert.strictEqual(map.size, 3); // 3 unique ParentIds
            assert.ok(map.has('ps1'));
            assert.ok(map.has('ps2'));
            assert.ok(map.has('ps3'));
        });
    });

    describe('getPermissionsBySObjectType', () => {
        it('should return permissions for specific SObject type', () => {
            // Act
            const accountPermissions = objectPermissions.getPermissionsBySObjectType('Account');

            // Assert
            assert.strictEqual(accountPermissions.length, 3);
            assert.ok(accountPermissions.every(p => p.SobjectType === 'Account'));
        });

        it('should return empty array for non-existing SObject type', () => {
            // Act
            const leadPermissions = objectPermissions.getPermissionsBySObjectType('Lead');

            // Assert
            assert.strictEqual(leadPermissions.length, 0);
        });
    });

    describe('getPermissionsWithAccess', () => {
        it('should return permissions with either read or edit access', () => {
            // Act
            const withAccess = objectPermissions.getPermissionsWithAccess();

            // Assert
            assert.strictEqual(withAccess.length, 3);
            assert.ok(withAccess.every(p => p.PermissionsRead || p.PermissionsEdit));
            // Should not include the permission with neither read nor edit
            assert.ok(!withAccess.some(p => p.ParentId === 'ps3'));
        });
    });

    describe('getPermissionsByParentIds', () => {
        it('should return permissions for specified parent IDs', () => {
            // Act
            const permissions = objectPermissions.getPermissionsByParentIds(['ps1', 'ps2']);

            // Assert
            assert.strictEqual(permissions.length, 3);
            assert.ok(permissions.some(p => p.ParentId === 'ps1'));
            assert.ok(permissions.some(p => p.ParentId === 'ps2'));
            assert.ok(!permissions.some(p => p.ParentId === 'ps3'));
        });

        it('should return empty array for non-existing parent IDs', () => {
            // Act
            const permissions = objectPermissions.getPermissionsByParentIds(['nonexistent']);

            // Assert
            assert.strictEqual(permissions.length, 0);
        });

        it('should handle empty parent IDs array', () => {
            // Act
            const permissions = objectPermissions.getPermissionsByParentIds([]);

            // Assert
            assert.strictEqual(permissions.length, 0);
        });
    });

    describe('getUniqueParentIds', () => {
        it('should return unique parent IDs', () => {
            // Act
            const parentIds = objectPermissions.getUniqueParentIds();

            // Assert
            assert.strictEqual(parentIds.length, 3);
            assert.ok(parentIds.includes('ps1'));
            assert.ok(parentIds.includes('ps2'));
            assert.ok(parentIds.includes('ps3'));
        });
    });

    describe('getProfilePermissions', () => {
        it('should return only profile-owned permissions', () => {
            // Act
            const profilePermissions = objectPermissions.getProfilePermissions();

            // Assert
            assert.strictEqual(profilePermissions.length, 1);
            assert.ok(profilePermissions[0].Parent.IsOwnedByProfile);
            assert.strictEqual(profilePermissions[0].Parent.Name, 'System Administrator');
        });

        it('should return empty array when no profile permissions', () => {
            // Arrange
            const noProfileRecords = mockRecords.map(r => ({
                ...r,
                Parent: { ...r.Parent, IsOwnedByProfile: false }
            }));
            const noProfilePermissions = new ObjectPermissions(noProfileRecords);

            // Act
            const profilePermissions = noProfilePermissions.getProfilePermissions();

            // Assert
            assert.strictEqual(profilePermissions.length, 0);
        });
    });

    describe('getPermissionSetPermissions', () => {
        it('should return only permission set owned permissions', () => {
            // Act
            const psPermissions = objectPermissions.getPermissionSetPermissions();

            // Assert
            assert.strictEqual(psPermissions.length, 3);
            assert.ok(psPermissions.every(p => !p.Parent.IsOwnedByProfile));
        });

        it('should return empty array when no permission set permissions', () => {
            // Arrange
            const noPsRecords = mockRecords.map(r => ({
                ...r,
                Parent: { ...r.Parent, IsOwnedByProfile: true }
            }));
            const noPsPermissions = new ObjectPermissions(noPsRecords);

            // Act
            const psPermissions = noPsPermissions.getPermissionSetPermissions();

            // Assert
            assert.strictEqual(psPermissions.length, 0);
        });
    });

    describe('getReadablePermissions', () => {
        it('should return only permissions with read access', () => {
            // Act
            const readable = objectPermissions.getReadablePermissions();

            // Assert
            assert.strictEqual(readable.length, 2);
            assert.ok(readable.every(p => p.PermissionsRead === true));
        });
    });

    describe('getEditablePermissions', () => {
        it('should return only permissions with edit access', () => {
            // Act
            const editable = objectPermissions.getEditablePermissions();

            // Assert
            assert.strictEqual(editable.length, 2);
            assert.ok(editable.every(p => p.PermissionsEdit === true));
        });
    });

    describe('count', () => {
        it('should return the number of permission records', () => {
            // Act
            const count = objectPermissions.count();

            // Assert
            assert.strictEqual(count, 4);
        });

        it('should return 0 for empty permissions', () => {
            // Arrange
            const emptyPermissions = new ObjectPermissions([]);

            // Act
            const count = emptyPermissions.count();

            // Assert
            assert.strictEqual(count, 0);
        });
    });
});