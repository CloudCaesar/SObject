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
