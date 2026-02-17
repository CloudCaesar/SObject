import * as assert from 'assert';
import * as sinon from 'sinon';
import { PermissionSetSelector } from '../selectors/PermissionSetSelector';

suite('PermissionSetSelector Tests', () => {
    let selector: PermissionSetSelector;
    let mockConnection: any;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        mockConnection = {
            query: sandbox.stub()
        };

        // Mock the SalesforceHandler
        const mockSalesforceHandler = {
            getSalesforceConnection: sandbox.stub().resolves(mockConnection)
        };

        // Replace the import temporarily for testing
        selector = new PermissionSetSelector();
        (selector as any).connection = mockConnection;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should set the connection property', async () => {
            const newSelector = new PermissionSetSelector();
            await newSelector.initialize();
            assert((newSelector as any).connection);
        });

        test('should return the selector instance', async () => {
            const newSelector = new PermissionSetSelector();
            const result = await newSelector.initialize();
            assert.strictEqual(result, newSelector);
        });
    });

    suite('getQueryFields', () => {
        test('should return the correct field list', () => {
            const fields = selector.getQueryFields();
            const expectedFields = [
                'Id', 'Name', 'Label', 'Description', 'IsCustom',
                'IsOwnedByProfile', 'HasActivationRequired', 'NamespacePrefix'
            ];
            assert.deepStrictEqual(fields, expectedFields);
        });
    });

    suite('selectAll', () => {
        test('should query all permission sets', async () => {
            const mockRecords = [{ Id: '1', Name: 'Test' }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectAll();

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('SELECT'));
            assert(query.includes('FROM PermissionSet'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectByIds', () => {
        test('should return empty array for empty input', async () => {
            const result = await selector.selectByIds([]);
            assert.deepStrictEqual(result, []);
            assert(mockConnection.query.notCalled);
        });

        test('should query permission sets by IDs', async () => {
            const mockRecords = [{ Id: '1', Name: 'Test' }];
            mockConnection.query.resolves({ records: mockRecords });
            const ids = ['001000000000001', '001000000000002'];

            const result = await selector.selectByIds(ids);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('WHERE Id IN'));
            assert(query.includes("'001000000000001'"));
            assert(query.includes("'001000000000002'"));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectNonProfileOwned', () => {
        test('should query non-profile-owned permission sets', async () => {
            const mockRecords = [{ Id: '1', Name: 'Test', IsOwnedByProfile: false }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectNonProfileOwned();

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('WHERE IsOwnedByProfile = false'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectByName', () => {
        test('should query permission sets by name', async () => {
            const mockRecords = [{ Id: '1', Name: 'TestPermissionSet' }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectByName('TestPermissionSet');

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes("WHERE Name = 'TestPermissionSet'"));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectByPermissionSetGroupId', () => {
        test('should query permission sets by group ID', async () => {
            const mockRecords = [{ Id: '1', Name: 'Test' }];
            mockConnection.query.resolves({ records: mockRecords });
            const groupId = '0PG000000000001';

            const result = await selector.selectByPermissionSetGroupId(groupId);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes(`WHERE PermissionSetGroupId = '${groupId}'`));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectByProfileId', () => {
        test('should query permission sets by profile ID', async () => {
            const mockRecords = [{ Id: '1', Name: 'Test' }];
            mockConnection.query.resolves({ records: mockRecords });
            const profileId = '00e000000000001';

            const result = await selector.selectByProfileId(profileId);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes(`WHERE ProfileId = '${profileId}'`));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectCustomOnly', () => {
        test('should query only custom permission sets', async () => {
            const mockRecords = [{ Id: '1', Name: 'Test', IsCustom: true }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectCustomOnly();

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('WHERE IsCustom = true'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectByLicenseId', () => {
        test('should query permission sets by license ID', async () => {
            const mockRecords = [{ Id: '1', Name: 'Test' }];
            mockConnection.query.resolves({ records: mockRecords });
            const licenseId = '0PL000000000001';

            const result = await selector.selectByLicenseId(licenseId);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes(`WHERE LicenseId = '${licenseId}'`));
            assert.deepStrictEqual(result, mockRecords);
        });
    });
});