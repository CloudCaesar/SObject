/*
 * Copyright (c) 2026 Cloud CZR LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Domain class for PermissionSet records
 * Encapsulates business logic for working with permission sets
 */
export class PermissionSets {
    private records: any[];

    constructor(recordList: any[]) {
        this.records = recordList || [];
    }

    /**
     * Factory method to create a new PermissionSets instance
     */
    static newInstance(recordList: any[]): PermissionSets {
        return new PermissionSets(recordList);
    }

    /**
     * Get all permission set records
     */
    getRecords(): any[] {
        return this.records;
    }

    /**
     * Get permission sets as a map keyed by ID
     */
    getPermissionSetsMap(): Map<string, any> {
        const map = new Map<string, any>();
        for (const ps of this.records) {
            map.set(ps.PermissionSetId, ps);
        }
        return map;
    }

    /**
     * Get permission set IDs
     */
    getPermissionSetIds(): string[] {
        return this.records.map(ps => ps.Id || ps.PermissionSetId).filter(id => id);
    }

    /**
     * Get unique permission set IDs (deduped)
     */
    getUniquePermissionSetIds(): string[] {
        return [...new Set(this.records.map(ps => ps.Id || ps.PermissionSetId).filter(id => id))];
    }

    /**
     * Get permission sets for a specific user
     */
    getPermissionSetsByUserId(userId: string): any[] {
        return this.records.filter(ps => ps.AssigneeId === userId);
    }

    /**
     * Get all assignee IDs
     */
    getAssigneeIds(): string[] {
        return [...new Set(this.records.map(ps => ps.AssigneeId))];
    }

    /**
     * Filter out group assignments
     */
    getNonGroupAssignments(): any[] {
        return this.records.filter(ps => !ps.PermissionSetGroupId);
    }

    /**
     * Get only group assignments
     */
    getGroupAssignments(): any[] {
        return this.records.filter(ps => ps.PermissionSetGroupId);
    }

    /**
     * Get count of assignments
     */
    count(): number {
        return this.records.length;
    }

    /**
     * Get permission sets for a specific object from internal records
     */
    getPermissionSetsForObject(objectName: string): any[] {
        return this.records.filter(perm => {
            const permObjectName = (perm.SObjectType || '').trim();
            const targetObjectName = (objectName || '').trim();
            return permObjectName.toLowerCase() === targetObjectName.toLowerCase();
        });
    }

    /**
     * Aggregate ObjectPermissions with their respective PermissionSets for a specific SObject
     * Returns PermissionSets enhanced with their permissions on the specified object
     */
    aggregatePermissionsForObject(objectPermissions: any[], objectName: string): any[] {
        // Create a map of PermissionSet by ID for quick lookup
        const psMap = this.getPermissionSetsMap();

        // Create a map to store permissions by PermissionSetId
        const permsByParentId = new Map<string, any>();

        // Loop through ObjectPermissions to find permissions for this specific SObject
        for (const objPerm of objectPermissions) {
            // Check if this ObjectPermission is for the SObject we're interested in
            // Use case-insensitive comparison to handle variations
            const objPermType = (objPerm.SobjectType || objPerm.SObjectType || '').trim();
            const targetObjectName = (objectName || '').trim();
            
            if (objPermType.toLowerCase() !== targetObjectName.toLowerCase()) {
                continue;
            }

            console.log('[PermissionSets.aggregatePermissionsForObject] Processing objPerm:', objPerm);

            const parentId = objPerm.ParentId;

            // If we haven't seen this parent (permission set) before, create an entry
            if (!permsByParentId.has(parentId)) {
                permsByParentId.set(parentId, {
                    PermissionsRead: false,
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false
                });
            }

            // Get the permissions object for this parent
            const parentPerms = permsByParentId.get(parentId);

            // Aggregate permissions (additive - OR them together)
            parentPerms.PermissionsRead = parentPerms.PermissionsRead || objPerm.PermissionsRead || false;
            parentPerms.PermissionsCreate = parentPerms.PermissionsCreate || objPerm.PermissionsCreate || false;
            parentPerms.PermissionsEdit = parentPerms.PermissionsEdit || objPerm.PermissionsEdit || false;
            parentPerms.PermissionsDelete = parentPerms.PermissionsDelete || objPerm.PermissionsDelete || false;
            parentPerms.PermissionsViewAllRecords = parentPerms.PermissionsViewAllRecords || objPerm.PermissionsViewAllRecords || false;
            parentPerms.PermissionsModifyAllRecords = parentPerms.PermissionsModifyAllRecords || objPerm.PermissionsModifyAllRecords || false;
            parentPerms.PermissionsViewAllFields = parentPerms.PermissionsViewAllFields || objPerm.PermissionsViewAllFields || false;

            console.log('[PermissionSets.aggregatePermissionsForObject] Updated parentPerms:', parentPerms);
        }

        // Build result array of permission records with Parent reference
        const result: any[] = [];
        for (const ps of this.records) {
            const psId = ps.Id;
            const permissions = permsByParentId.get(psId);

            // Only include permission sets that have permissions for this object
            if (!permissions) {
                continue;
            }

            // Create a permission record with Parent property pointing to the PermissionSet
            const permissionRecord = {
                ...permissions,
                Parent: {
                    Id: ps.Id,
                    Name: ps.Name,
                    Label: ps.Label,
                    Description: ps.Description,
                    IsCustom: ps.IsCustom,
                    IsOwnedByProfile: ps.IsOwnedByProfile,
                    HasActivationRequired: ps.HasActivationRequired,
                    NamespacePrefix: ps.NamespacePrefix
                },
                ParentId: ps.Id,
                SObjectType: objectName,
                isPermissionSet: true
            };

            result.push(permissionRecord);
        }

        return result;
    }
}
