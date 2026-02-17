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
