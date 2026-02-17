/**
 * Domain class for FieldPermissions records
 * Encapsulates business logic for working with field-level permissions
 */
export class FieldPermissions {
    private records: any[];

    constructor(recordList: any[]) {
        this.records = recordList || [];
    }

    /**
     * Factory method to create a new FieldPermissions instance
     */
    static newInstance(recordList: any[]): FieldPermissions {
        return new FieldPermissions(recordList);
    }

    /**
     * Get all permission records
     */
    getRecords(): any[] {
        return this.records;
    }

    /**
     * Get permissions as a map keyed by ParentId
     */
    getPermissionsMap(): Map<string, any> {
        const map = new Map<string, any>();
        for (const perm of this.records) {
            map.set(perm.ParentId, perm);
        }
        return map;
    }

    /**
     * Get permissions for a specific parent ID
     */
    getPermissionByParentId(parentId: string): any | undefined {
        return this.records.find(p => p.ParentId === parentId);
    }

    /**
     * Filter permissions that grant read access
     */
    getReadablePermissions(): any[] {
        return this.records.filter(p => p.PermissionsRead === true);
    }

    /**
     * Filter permissions that grant edit access
     */
    getEditablePermissions(): any[] {
        return this.records.filter(p => p.PermissionsEdit === true);
    }

    /**
     * Get permissions with either read or edit access
     */
    getPermissionsWithAccess(): any[] {
        return this.records.filter(p => p.PermissionsRead || p.PermissionsEdit);
    }

    /**
     * Get unique parent IDs
     */
    getUniqueParentIds(): string[] {
        return [...new Set(this.records.map(p => p.ParentId))];
    }

    /**
     * Get count of permissions
     */
    count(): number {
        return this.records.length;
    }
}
