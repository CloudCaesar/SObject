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

/**
 * Domain class for User records
 * Encapsulates business logic and data transformations for Users
 */
export class Users {
    private records: any[];

    constructor(recordList: any[]) {
        this.records = recordList || [];
    }

    /**
     * Factory method to create a new Users instance
     */
    static newInstance(recordList: any[]): Users {
        return new Users(recordList);
    }

    /**
     * Get all user records
     */
    getRecords(): any[] {
        return this.records;
    }

    /**
     * Get users as a map keyed by ID
     */
    getUsersMap(): Map<string, any> {
        const map = new Map<string, any>();
        for (const user of this.records) {
            map.set(user.Id, user);
        }
        return map;
    }

    /**
     * Get user IDs
     */
    getUserIds(): string[] {
        return this.records.map(u => u.Id);
    }

    /**
     * Get active users only
     */
    getActiveUsers(): any[] {
        return this.records.filter(u => u.IsActive === true);
    }

    /**
     * Find user by ID
     */
    getUserById(userId: string): any {
        return this.records.find(u => u.Id === userId);
    }

    /**
     * Get count of users
     */
    count(): number {
        return this.records.length;
    }
}
