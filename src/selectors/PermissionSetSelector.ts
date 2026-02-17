import * as SalesforceHandler from '../handlers/salesforceHandler';

export class PermissionSetSelector {
    private connection: any;

    async initialize() {
        this.connection = await SalesforceHandler.getSalesforceConnection();
        return this;
    }

    getQueryFields(): string[] {
        return [
            'Id',
            'Name',
            'Label',
            'Description',
            'IsCustom',
            'IsOwnedByProfile',
            'HasActivationRequired',
            'NamespacePrefix'
        ];
    }

    /**
     * Query all permission sets
     */
    async selectAll(): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSet`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission sets by IDs
     */
    async selectByIds(permissionSetIds: string[]): Promise<any[]> {
        if (permissionSetIds.length === 0) {
            return [];
        }
        const ids = permissionSetIds.map(id => `'${id}'`).join(', ');
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSet WHERE Id IN (${ids})`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query non-profile-owned permission sets
     */
    async selectNonProfileOwned(): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSet WHERE IsOwnedByProfile = false`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission sets by name
     */
    async selectByName(name: string): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSet WHERE Name = '${name}'`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission sets by permission set group ID
     */
    async selectByPermissionSetGroupId(groupId: string): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSet WHERE PermissionSetGroupId = '${groupId}'`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission sets by profile ID
     */
    async selectByProfileId(profileId: string): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSet WHERE ProfileId = '${profileId}'`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query custom permission sets only
     */
    async selectCustomOnly(): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSet WHERE IsCustom = true`;
        const result = await this.connection.query(query);
        return result.records;
    }

    /**
     * Query permission sets with a specific license
     */
    async selectByLicenseId(licenseId: string): Promise<any[]> {
        const query = `SELECT ${this.getQueryFields().join(', ')} FROM PermissionSet WHERE LicenseId = '${licenseId}'`;
        const result = await this.connection.query(query);
        return result.records;
    }
}

