import * as SalesforceHandler from '../handlers/salesforceHandler';

export class ObjectPermissionsSelector {
    private connection: any;

    async initialize() {
        this.connection = await SalesforceHandler.getSalesforceConnection();
        return this;
    }

    getQueryFields(): string[] {
        return [
            'ParentId',
            'SobjectType',
            'PermissionsRead',
            'PermissionsCreate',
            'PermissionsEdit',
            'PermissionsDelete',
            'PermissionsViewAllRecords',
            'PermissionsModifyAllRecords',
            'PermissionsViewAllFields',
            'Parent.Name',
            'Parent.Label',
            'Parent.Type',
            'Parent.IsCustom',
            'Parent.Description',
            'Parent.IsOwnedByProfile',
            'Parent.Profile.Name'
        ];
    }

    /**
     * Query object permissions by SObject type
     */
    async selectBySObjectType(sObjectType: string, additionalConditions: string = ''): Promise<any[]> {
        let where = `SobjectType = '${sObjectType}'`;
        if (additionalConditions) {
            where += ` AND ${additionalConditions}`;
        }
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM ObjectPermissions WHERE ${where} LIMIT 1000`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query object permissions for a specific profile
     */
    async selectByProfileId(profileId: string, sObjectType: string): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM ObjectPermissions WHERE ParentId = '${profileId}' AND SobjectType = '${sObjectType}'`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query object permissions for specific parent IDs (permission sets/groups)
     */
    async selectByParentIds(parentIds: string[], sObjectType: string): Promise<any[]> {
        if (parentIds.length === 0) {
            return [];
        }
        const idString = parentIds.map(id => `'${id}'`).join(',');
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM ObjectPermissions WHERE ParentId IN (${idString}) AND SobjectType = '${sObjectType}'`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query object permissions with read or edit permissions
     */
    async selectWithPermissionsBySObjectType(sObjectType: string): Promise<any[]> {
        const where = `SobjectType = '${sObjectType}' AND (PermissionsRead = true OR PermissionsEdit = true)`;
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM ObjectPermissions WHERE ${where} LIMIT 1000`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query object permissions for a specific profile by profile name
     */
    async selectByProfileName(profileName: string, sObjectType: string): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')}
        FROM ObjectPermissions
        WHERE Parent.IsOwnedByProfile = true
          AND Parent.Profile.Name = '${profileName}'
          AND SobjectType = '${sObjectType}'
        ORDER BY SObjectType`;
        const result = await this.connection.query(query);
        return result.records;
    }
}
