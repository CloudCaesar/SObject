import * as SalesforceHandler from '../handlers/salesforceHandler';

export class EntityDefinitionSelector {
    private connection: any;

    async initialize() {
        this.connection = await SalesforceHandler.getSalesforceConnection();
        return this;
    }

    /**
     * Query all queryable SObjects
     */
    async selectQueryableSObjects(): Promise<any[]> {
        const query = `SELECT QualifiedApiName, Label FROM EntityDefinition WHERE IsQueryable = true ORDER BY Label`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Get org-wide defaults for a specific SObject using Tooling API
     */
    async selectOrgWideDefaults(objectName: string): Promise<any> {
        try {
            console.log(`[OrgWideDefault] Querying org-wide defaults for ${objectName} via Tooling API...`);
            
            // For custom objects, DeveloperName doesn't include __c suffix
            // e.g., Test_Object__c has DeveloperName of Test_Object
            const developerName = objectName.endsWith('__c') ? objectName.slice(0, -3) : objectName;
            
            // Use Tooling API to query EntityDefinition for sharing models (org-wide defaults)
            const query = `SELECT DeveloperName, ExternalSharingModel, InternalSharingModel FROM EntityDefinition WHERE DeveloperName = '${developerName}' LIMIT 1`;
            console.log(`[OrgWideDefault] Tooling Query: ${query}`);
            
            const result = await this.connection.tooling.query(query);
            
            console.log(`[OrgWideDefault] Tooling API query successful, records: ${result.records?.length || 0}`);
            
            if (result.records && result.records.length > 0) {
                console.log(`[OrgWideDefault] Successfully retrieved org-wide defaults for ${objectName}:`, result.records[0]);
                return result.records[0];
            }
            
            console.log(`[OrgWideDefault] No org-wide defaults found for ${objectName}`);
            return null;
        } catch (error) {
            console.error(`[OrgWideDefault] Tooling API query failed:`, error);
            return null;
        }
    }
}
