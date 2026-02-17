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

export class UserSelector {
    private connection: any;

    async initialize() {
        this.connection = await SalesforceHandler.getSalesforceConnection();
        return this;
    }

    getQueryFields(): string[] {
        return [
            'Id',
            'Name',
            'Username',
            'Profile.Name',
            'Profile.Id'
        ];
    }

    /**
     * Query all active users
     */
    async selectActive(): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM User WHERE IsActive = true ORDER BY Name`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query profiles by IDs
     */
    async selectProfilesByIds(profileIds: string[]): Promise<any[]> {
        if (profileIds.length === 0) {
            return [];
        }
        const idString = profileIds.map(id => `'${id}'`).join(',');
        const query = `SELECT Id, Name FROM Profile WHERE Id IN (${idString}) LIMIT 1000`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Get a specific user's profile information
     */
    async selectById(userId: string): Promise<any[]> {
        const query = `SELECT Id, Profile.Name, Profile.Id FROM User WHERE Id = '${userId}'`;
        const result = await this.connection.query(query);
        return result.records;
    }
}
