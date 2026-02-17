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
