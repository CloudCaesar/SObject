import * as assert from 'assert';
import { FieldPermissions } from '../../src/domain/FieldPermissions';

describe('FieldPermissions', () => {
    let fieldPermissions: FieldPermissions;
    let mockRecords: any[];

    beforeEach(() => {
        mockRecords = [
            {
                ParentId: 'ps1',
                PermissionsRead: true,
                PermissionsEdit: false,
                Field: 'Account.Name'
            },
            {
                ParentId: 'ps1',
                PermissionsRead: true,
                PermissionsEdit: true,
                Field: 'Account.Type'
            },
            {
                ParentId: 'ps2',
                PermissionsRead: false,
                PermissionsEdit: true,
                Field: 'Account.Name'
            },
            {
                ParentId: 'ps3',
                PermissionsRead: false,
                PermissionsEdit: false,
                Field: 'Account.Name'
            }
        ];
        fieldPermissions = new FieldPermissions(mockRecords);
    });

    describe('constructor', () => {
        it('should create instance with provided records', () => {
            // Assert
            assert.strictEqual(fieldPermissions.getRecords().length, 4);
            assert.deepStrictEqual(fieldPermissions.getRecords(), mockRecords);
        });

        it('should handle empty record list', () => {
            // Act
            const emptyPermissions = new FieldPermissions([]);

            // Assert
            assert.strictEqual(emptyPermissions.getRecords().length, 0);
        });

        it('should handle null record list', () => {
            // Act
            const nullPermissions = new FieldPermissions(null as any);

            // Assert
            assert.strictEqual(nullPermissions.getRecords().length, 0);
        });
    });

    describe('newInstance', () => {
        it('should create new instance using factory method', () => {
            // Act
            const instance = FieldPermissions.newInstance(mockRecords);

            // Assert
            assert.ok(instance instanceof FieldPermissions);
            assert.strictEqual(instance.getRecords().length, 4);
        });
    });

    describe('getRecords', () => {
        it('should return all permission records', () => {
            // Act
            const records = fieldPermissions.getRecords();

            // Assert
            assert.strictEqual(records.length, 4);
            assert.deepStrictEqual(records, mockRecords);
        });

        it('should return empty array for empty permissions', () => {
            // Arrange
            const emptyPermissions = new FieldPermissions([]);

            // Act
            const records = emptyPermissions.getRecords();

            // Assert
            assert.deepStrictEqual(records, []);
        });
    });

    describe('getPermissionsMap', () => {
        it('should return permissions mapped by ParentId', () => {
            // Act
            const map = fieldPermissions.getPermissionsMap();

            // Assert
            assert.ok(map instanceof Map);
            assert.strictEqual(map.size, 3); // 3 unique ParentIds
            assert.ok(map.has('ps1'));
            assert.ok(map.has('ps2'));
            assert.ok(map.has('ps3'));
        });

        it('should handle empty permissions', () => {
            // Arrange
            const emptyPermissions = new FieldPermissions([]);

            // Act
            const map = emptyPermissions.getPermissionsMap();

            // Assert
            assert.ok(map instanceof Map);
            assert.strictEqual(map.size, 0);
        });
    });

    describe('getPermissionByParentId', () => {
        it('should return permission for existing parent ID', () => {
            // Act
            const permission = fieldPermissions.getPermissionByParentId('ps1');

            // Assert
            assert.ok(permission);
            assert.strictEqual(permission.ParentId, 'ps1');
            assert.strictEqual(permission.Field, 'Account.Name');
        });

        it('should return undefined for non-existing parent ID', () => {
            // Act
            const permission = fieldPermissions.getPermissionByParentId('nonexistent');

            // Assert
            assert.strictEqual(permission, undefined);
        });

        it('should handle empty permissions', () => {
            // Arrange
            const emptyPermissions = new FieldPermissions([]);

            // Act
            const permission = emptyPermissions.getPermissionByParentId('ps1');

            // Assert
            assert.strictEqual(permission, undefined);
        });
    });

    describe('getReadablePermissions', () => {
        it('should return only permissions with read access', () => {
            // Act
            const readable = fieldPermissions.getReadablePermissions();

            // Assert
            assert.strictEqual(readable.length, 2);
            assert.ok(readable.every(p => p.PermissionsRead === true));
            assert.ok(readable.some(p => p.Field === 'Account.Name'));
            assert.ok(readable.some(p => p.Field === 'Account.Type'));
        });

        it('should return empty array when no readable permissions', () => {
            // Arrange
            const noReadPermissions = new FieldPermissions([
                { ParentId: 'ps1', PermissionsRead: false, PermissionsEdit: true, Field: 'Account.Name' }
            ]);

            // Act
            const readable = noReadPermissions.getReadablePermissions();

            // Assert
            assert.strictEqual(readable.length, 0);
        });
    });

    describe('getEditablePermissions', () => {
        it('should return only permissions with edit access', () => {
            // Act
            const editable = fieldPermissions.getEditablePermissions();

            // Assert
            assert.strictEqual(editable.length, 2);
            assert.ok(editable.every(p => p.PermissionsEdit === true));
            assert.ok(editable.some(p => p.Field === 'Account.Type'));
            assert.ok(editable.some(p => p.Field === 'Account.Name' && p.ParentId === 'ps2'));
        });

        it('should return empty array when no editable permissions', () => {
            // Arrange
            const noEditPermissions = new FieldPermissions([
                { ParentId: 'ps1', PermissionsRead: true, PermissionsEdit: false, Field: 'Account.Name' }
            ]);

            // Act
            const editable = noEditPermissions.getEditablePermissions();

            // Assert
            assert.strictEqual(editable.length, 0);
        });
    });

    describe('getPermissionsWithAccess', () => {
        it('should return permissions with either read or edit access', () => {
            // Act
            const withAccess = fieldPermissions.getPermissionsWithAccess();

            // Assert
            assert.strictEqual(withAccess.length, 3);
            assert.ok(withAccess.every(p => p.PermissionsRead || p.PermissionsEdit));
            // Should not include the permission with neither read nor edit
            assert.ok(!withAccess.some(p => p.ParentId === 'ps3'));
        });

        it('should return empty array when no permissions have access', () => {
            // Arrange
            const noAccessPermissions = new FieldPermissions([
                { ParentId: 'ps1', PermissionsRead: false, PermissionsEdit: false, Field: 'Account.Name' }
            ]);

            // Act
            const withAccess = noAccessPermissions.getPermissionsWithAccess();

            // Assert
            assert.strictEqual(withAccess.length, 0);
        });
    });

    describe('getUniqueParentIds', () => {
        it('should return unique parent IDs', () => {
            // Act
            const parentIds = fieldPermissions.getUniqueParentIds();

            // Assert
            assert.strictEqual(parentIds.length, 3);
            assert.ok(parentIds.includes('ps1'));
            assert.ok(parentIds.includes('ps2'));
            assert.ok(parentIds.includes('ps3'));
        });

        it('should handle duplicate parent IDs', () => {
            // Arrange
            const duplicateRecords = [
                { ParentId: 'ps1', PermissionsRead: true, Field: 'Account.Name' },
                { ParentId: 'ps1', PermissionsRead: false, Field: 'Account.Type' },
                { ParentId: 'ps2', PermissionsRead: true, Field: 'Account.Name' }
            ];
            const duplicatePermissions = new FieldPermissions(duplicateRecords);

            // Act
            const parentIds = duplicatePermissions.getUniqueParentIds();

            // Assert
            assert.strictEqual(parentIds.length, 2);
            assert.ok(parentIds.includes('ps1'));
            assert.ok(parentIds.includes('ps2'));
        });

        it('should return empty array for empty permissions', () => {
            // Arrange
            const emptyPermissions = new FieldPermissions([]);

            // Act
            const parentIds = emptyPermissions.getUniqueParentIds();

            // Assert
            assert.deepStrictEqual(parentIds, []);
        });
    });

    describe('count', () => {
        it('should return the number of permission records', () => {
            // Act
            const count = fieldPermissions.count();

            // Assert
            assert.strictEqual(count, 4);
        });

        it('should return 0 for empty permissions', () => {
            // Arrange
            const emptyPermissions = new FieldPermissions([]);

            // Act
            const count = emptyPermissions.count();

            // Assert
            assert.strictEqual(count, 0);
        });
    });
});