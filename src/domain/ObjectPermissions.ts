/**
 * Domain class for ObjectPermissions records
 * Encapsulates business logic for working with object-level permissions
 */
export class ObjectPermissions {
    private records: any[];

    constructor(recordList: any[]) {
        this.records = recordList || [];
    }

    /**
     * Factory method to create a new ObjectPermissions instance
     */
    static newInstance(recordList: any[]): ObjectPermissions {
        return new ObjectPermissions(recordList);
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
     * Get permissions by SObject type
     */
    getPermissionsBySObjectType(sObjectType: string): any[] {
        return this.records.filter(p => p.SobjectType === sObjectType);
    }

    /**
     * Get permissions where Read OR Edit is enabled
     */
    getPermissionsWithAccess(): any[] {
        return this.records.filter(p => p.PermissionsRead || p.PermissionsEdit);
    }

    /**
     * Get permissions by parent IDs
     */
    getPermissionsByParentIds(parentIds: string[]): any[] {
        const idSet = new Set(parentIds);
        return this.records.filter(p => idSet.has(p.ParentId));
    }

    /**
     * Get unique parent IDs
     */
    getUniqueParentIds(): string[] {
        return [...new Set(this.records.map(p => p.ParentId))];
    }

    /**
     * Get profile-owned permissions
     */
    getProfilePermissions(): any[] {
        return this.records.filter(p => p.Parent?.IsOwnedByProfile === true);
    }

    /**
     * Get permission set owned permissions
     */
    getPermissionSetPermissions(): any[] {
        return this.records.filter(p => p.Parent?.IsOwnedByProfile === false);
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
     * Get count of permissions
     */
    count(): number {
        return this.records.length;
    }
}
