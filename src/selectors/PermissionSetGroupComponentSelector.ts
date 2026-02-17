import * as SalesforceHandler from '../handlers/salesforceHandler';

export class PermissionSetGroupComponentSelector {
    private connection: any;

    async initialize() {
        this.connection = await SalesforceHandler.getSalesforceConnection();
        return this;
    }

    /**
     * Get the query fields for PermissionSetGroupComponent
     */
    getQueryFields(): string[] {
        return [
            'PermissionSetGroupId',
            'PermissionSetId'
        ];
    }

    /**
     * Query permission set group components by specific permission set IDs
     */
    async selectComponentsByPermissionSetIds(permissionSetIds: string[]): Promise<any[]> {
        if (permissionSetIds.length === 0) {
            return [];
        }
        const idString = permissionSetIds.map(id => `'${id}'`).join(',');
        const fields = this.getQueryFields().join(', ');
        const query = `SELECT ${fields} FROM PermissionSetGroupComponent WHERE PermissionSetId IN (${idString}) LIMIT 1000`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission set group components by specific PSG IDs
     */
    async selectComponentsByPermissionSetGroupIds(psgIds: string[]): Promise<any[]> {
        if (psgIds.length === 0) {
            return [];
        }
        const idString = psgIds.map(id => `'${id}'`).join(',');
        const fields = this.getQueryFields().join(', ');
        const query = `SELECT ${fields} FROM PermissionSetGroupComponent WHERE PermissionSetGroupId IN (${idString}) LIMIT 1000`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Extract unique PSG IDs from components
     */
    extractUniquePsgIds(componentRecords: any[]): string[] {
        return [...new Set(componentRecords.map((r: any) => r.PermissionSetGroupId))];
    }

    /**
     * Extract unique PermissionSet IDs from components
     */
    extractUniquePermissionSetIds(componentRecords: any[]): string[] {
        return [...new Set(componentRecords.map((r: any) => r.PermissionSetId))];
    }

    /**
     * Group components by PSG ID
     */
    groupByPermissionSetGroupId(componentRecords: any[]): Map<string, any[]> {
        const grouped = new Map<string, any[]>();
        for (const comp of componentRecords) {
            if (!grouped.has(comp.PermissionSetGroupId)) {
                grouped.set(comp.PermissionSetGroupId, []);
            }
            grouped.get(comp.PermissionSetGroupId)!.push(comp);
        }
        return grouped;
    }

    /**
     * Group components by PermissionSet ID
     */
    groupByPermissionSetId(componentRecords: any[]): Map<string, any[]> {
        const grouped = new Map<string, any[]>();
        for (const comp of componentRecords) {
            if (!grouped.has(comp.PermissionSetId)) {
                grouped.set(comp.PermissionSetId, []);
            }
            grouped.get(comp.PermissionSetId)!.push(comp);
        }
        return grouped;
    }
}
