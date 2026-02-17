import * as SalesforceHandler from '../handlers/salesforceHandler';

export class FieldPermissionsSelector {
    private connection: any;

    async initialize() {
        this.connection = await SalesforceHandler.getSalesforceConnection();
        return this;
    }

    getQueryFields(): string[] {
        return [
            'SObjectType',
            'Field',
            'PermissionsRead',
            'PermissionsEdit',
            'ParentId',
            'Parent.Label',
            'Parent.Name',
            'Parent.IsOwnedByProfile',
            'Parent.Profile.Name',
            'Parent.Profile.Id'
        ];
    }

    /**
     * Query field permissions for a specific field (all parents)
     */
    async selectByFieldName(fullFieldName: string): Promise<any[]> {
        console.log(`[FieldPermissionsSelector] selectByFieldName: fullFieldName=${fullFieldName}`);
        
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM FieldPermissions WHERE Field = '${fullFieldName}' ORDER BY Parent.Label LIMIT 1000`;
        console.log(`[FieldPermissionsSelector] Executing query: ${query}`);
        
        const result = await this.connection.query(query);
        console.log(`[FieldPermissionsSelector] Query returned ${result.records.length} records`);
        
        return result.records;
    }

    /**
     * Map field permissions by ParentId for quick lookup
     */
    mapByParentId(records: any[]): Map<string, any> {
        const map = new Map<string, any>();
        for (const record of records) {
            map.set(record.ParentId, record);
        }
        return map;
    }
}
