import * as assert from 'assert';
import * as sinon from 'sinon';
import { ObjectPermissionsSelector } from '../selectors/ObjectPermissionsSelector';

suite('ObjectPermissionsSelector Tests', () => {
    let selector: ObjectPermissionsSelector;
    let mockConnection: any;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        mockConnection = {
            query: sandbox.stub()
        };

        selector = new ObjectPermissionsSelector();
        (selector as any).connection = mockConnection;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should set the connection property', async () => {
            const newSelector = new ObjectPermissionsSelector();
            await newSelector.initialize();
            assert((newSelector as any).connection);
        });

        test('should return the selector instance', async () => {
            const newSelector = new ObjectPermissionsSelector();
            const result = await newSelector.initialize();
            assert.strictEqual(result, newSelector);
        });
    });

    suite('getQueryFields', () => {
        test('should return the correct field list', () => {
            const fields = selector.getQueryFields();
            const expectedFields = [
                'ParentId', 'SobjectType', 'PermissionsRead', 'PermissionsCreate',
                'PermissionsEdit', 'PermissionsDelete', 'PermissionsViewAllRecords',
                'PermissionsModifyAllRecords', 'PermissionsViewAllFields',
                'Parent.Name', 'Parent.Label', 'Parent.Type', 'Parent.IsCustom',
                'Parent.Description', 'Parent.IsOwnedByProfile', 'Parent.Profile.Name'
            ];
            assert.deepStrictEqual(fields, expectedFields);
        });
    });

    suite('selectBySObjectType', () => {
        test('should query object permissions by SObject type', async () => {
            const mockRecords = [{ ParentId: '1', SobjectType: 'Account' }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectBySObjectType('Account');

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes("WHERE SobjectType = 'Account'"));
            assert(query.includes('LIMIT 1000'));
            assert.deepStrictEqual(result, mockRecords);
        });

        test('should handle additional conditions', async () => {
            const mockRecords = [{ ParentId: '1', SobjectType: 'Account' }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectBySObjectType('Account', 'PermissionsRead = true');

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes("SobjectType = 'Account' AND PermissionsRead = true"));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectByProfileId', () => {
        test('should query object permissions by profile ID and SObject type', async () => {
            const mockRecords = [{ ParentId: '00e000000000001', SobjectType: 'Account' }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectByProfileId('00e000000000001', 'Account');

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes("WHERE ParentId = '00e000000000001'"));
            assert(query.includes("AND SobjectType = 'Account'"));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectByParentIds', () => {
        test('should return empty array for empty input', async () => {
            const result = await selector.selectByParentIds([], 'Account');
            assert.deepStrictEqual(result, []);
            assert(mockConnection.query.notCalled);
        });

        test('should query object permissions by parent IDs', async () => {
            const mockRecords = [{ ParentId: '001', SobjectType: 'Account' }];
            mockConnection.query.resolves({ records: mockRecords });
            const parentIds = ['001000000000001', '001000000000002'];

            const result = await selector.selectByParentIds(parentIds, 'Account');

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes("WHERE ParentId IN ('001000000000001','001000000000002')"));
            assert(query.includes("AND SobjectType = 'Account'"));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectWithPermissionsBySObjectType', () => {
        test('should query object permissions with read or edit permissions', async () => {
            const mockRecords = [{ ParentId: '1', SobjectType: 'Account', PermissionsRead: true }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectWithPermissionsBySObjectType('Account');

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes("SobjectType = 'Account' AND (PermissionsRead = true OR PermissionsEdit = true)"));
            assert(query.includes('LIMIT 1000'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectByProfileName', () => {
        test('should query object permissions by profile name', async () => {
            const mockRecords = [{ ParentId: '1', SobjectType: 'Account' }];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectByProfileName('System Administrator', 'Account');

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('WHERE Parent.IsOwnedByProfile = true'));
            assert(query.includes("AND Parent.Profile.Name = 'System Administrator'"));
            assert(query.includes("AND SobjectType = 'Account'"));
            assert(query.includes('ORDER BY SObjectType'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });
});