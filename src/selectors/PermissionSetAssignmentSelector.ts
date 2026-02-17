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
