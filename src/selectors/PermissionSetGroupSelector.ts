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

export class PermissionSetGroupSelector {
    private connection: any;

    async initialize() {
        this.connection = await SalesforceHandler.getSalesforceConnection();
        return this;
    }

    /**
     * Get the query fields for PermissionSetGroup
     */
    getQueryFields(): string[] {
        return [
            'Id',
            'DeveloperName',
            'MasterLabel'
        ];
    }

    /**
     * Query permission set group components for specific permission set IDs
     */
    async selectComponentsByPermissionSetIds(permissionSetIds: string[]): Promise<any[]> {
        if (permissionSetIds.length === 0) {
            return [];
        }
        const idString = permissionSetIds.map(id => `'${id}'`).join(',');
        const query = `SELECT PermissionSetGroupId, PermissionSetId FROM PermissionSetGroupComponent WHERE PermissionSetId IN (${idString}) LIMIT 1000`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission set groups by IDs
     */
    async selectById(psgIds: string[]): Promise<any[]> {
        if (psgIds.length === 0) {
            return [];
        }
        const idString = psgIds.map(id => `'${id}'`).join(',');
        const fields = this.getQueryFields().join(', ');
        const query = `SELECT ${fields} FROM PermissionSetGroup WHERE Id IN (${idString}) LIMIT 1000`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission set group details with components for specific user
     */
    async selectWithComponentsByUserId(userId: string): Promise<any[]> {
        // First get the PSG IDs assigned to the user
        const assignmentQuery = `SELECT PermissionSetGroupId FROM PermissionSetAssignment WHERE AssigneeId = '${userId}' AND PermissionSetGroupId != null`;
        const assignmentResult = await this.connection.query(assignmentQuery);
        const psgIds = assignmentResult.records.map((r: any) => r.PermissionSetGroupId).filter((id: any) => id);

        if (psgIds.length === 0) {
            return [];
        }

        // Then get the PSG details
        const idString = psgIds.map((id: string) => `'${id}'`).join(',');
        const fields = this.getQueryFields().join(', ');
        const psgQuery = `SELECT ${fields} FROM PermissionSetGroup WHERE Id IN (${idString})`;
        const psgResult = await this.connection.query(psgQuery);

        // Then get the components for these PSGs
        const componentQuery = `SELECT PermissionSetGroupId, PermissionSetId FROM PermissionSetGroupComponent WHERE PermissionSetGroupId IN (${idString})`;
        const componentResult = await this.connection.query(componentQuery);

        // Combine the data
        const componentsByPsgId = new Map<string, any[]>();
        for (const comp of componentResult.records) {
            if (!componentsByPsgId.has(comp.PermissionSetGroupId)) {
                componentsByPsgId.set(comp.PermissionSetGroupId, []);
            }
            componentsByPsgId.get(comp.PermissionSetGroupId)!.push(comp);
        }

        // Add components to PSG records
        return psgResult.records.map((psg: any) => ({
            ...psg,
            PermissionSetGroupComponents: {
                records: componentsByPsgId.get(psg.Id) || []
            }
        }));
    }

    /**
     * Query permission set group assignments for specific PSG IDs
     */
    async selectAssignmentsByGroupIds(psgIds: string[]): Promise<any[]> {
        if (psgIds.length === 0) {
            return [];
        }
        const idString = psgIds.map(id => `'${id}'`).join(',');
        const query = `SELECT PermissionSetGroupId, AssigneeId FROM PermissionSetAssignment WHERE PermissionSetGroupId IN (${idString}) LIMIT 1000`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Get all permission set IDs that are members of any permission set group
     */
    async selectAllMemberPermissionSetIds(): Promise<string[]> {
        const query = `SELECT PermissionSetId FROM PermissionSetGroupComponent GROUP BY PermissionSetId LIMIT 10000`;
        const result = await this.connection.query(query);
        return result.records.map((r: any) => r.PermissionSetId);
    }
}
