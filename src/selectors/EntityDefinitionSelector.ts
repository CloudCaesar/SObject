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
