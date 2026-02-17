import * as SalesforceHandler from '../handlers/salesforceHandler';

export class PermissionSetAssignmentSelector {
    private connection: any;

    async initialize() {
        this.connection = await SalesforceHandler.getSalesforceConnection();
        return this;
    }

    getQueryFields(): string[] {
        return [
            'Id',
            'PermissionSetId',
            'AssigneeId',
            'PermissionSetGroupId'
        ];
    }

    /**
     * Query permission set assignments for a user (excluding profile-owned and group assignments)
     */
    async selectByUserId(userId: string): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSetAssignment WHERE AssigneeId = '${userId}' AND PermissionSet.IsOwnedByProfile = false AND PermissionSetId != null AND PermissionSetGroupId = null`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission set group assignments for a user
     */
    async selectGroupsByUserId(userId: string): Promise<any[]> {
        const query = `SELECT PermissionSetGroupId FROM PermissionSetAssignment WHERE AssigneeId = '${userId}' AND PermissionSetGroupId != null`;
        const result = await this.connection.query(query);
        return result.records;
    }
}
