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
 * Domain class for PermissionSetAssignment records
 * Encapsulates business logic for working with permission set assignments
 */
export class PermissionSetAssignment {
    private records: any[];

    constructor(recordList: any[]) {
        this.records = recordList || [];
    }

    /**
     * Factory method to create a new PermissionSetAssignment instance
     */
    static newInstance(recordList: any[]): PermissionSetAssignment {
        return new PermissionSetAssignment(recordList);
    }

    /**
     * Get all permission set assignment records
     */
    getRecords(): any[] {
        return this.records;
    }

    /**
     * Get a Set of all unique PermissionSetIds
     */
    getPermissionSetIds(): Set<string> {
        return new Set(this.records.map(psa => psa.PermissionSetId));
    }

    /**
     * Get permission set assignments as a map keyed by ID
     */
    getAssignmentsMap(): Map<string, any> {
        const map = new Map<string, any>();
        for (const psa of this.records) {
            map.set(psa.Id, psa);
        }
        return map;
    }

    /**
     * Get assignments for a specific user
     */
    getAssignmentsByUserId(userId: string): any[] {
        return this.records.filter(psa => psa.AssigneeId === userId);
    }

    /**
     * Get all unique assignee IDs
     */
    getAssigneeIds(): Set<string> {
        return new Set(this.records.map(psa => psa.AssigneeId));
    }

    /**
     * Get assignments for a specific permission set
     */
    getAssignmentsByPermissionSetId(permissionSetId: string): any[] {
        return this.records.filter(psa => psa.PermissionSetId === permissionSetId);
    }

    /**
     * Get count of assignments
     */
    count(): number {
        return this.records.length;
    }
}
