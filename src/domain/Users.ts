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
