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
