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
