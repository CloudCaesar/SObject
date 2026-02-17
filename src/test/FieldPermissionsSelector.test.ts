import * as assert from 'assert';
import * as sinon from 'sinon';
import { FieldPermissionsSelector } from '../selectors/FieldPermissionsSelector';

suite('FieldPermissionsSelector Tests', () => {
    let selector: FieldPermissionsSelector;
    let mockConnection: any;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        mockConnection = {
            query: sandbox.stub()
        };

        selector = new FieldPermissionsSelector();
        (selector as any).connection = mockConnection;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should set the connection property', async () => {
            const newSelector = new FieldPermissionsSelector();
            await newSelector.initialize();
            assert((newSelector as any).connection);
        });

        test('should return the selector instance', async () => {
            const newSelector = new FieldPermissionsSelector();
            const result = await newSelector.initialize();
            assert.strictEqual(result, newSelector);
        });
    });

    suite('getQueryFields', () => {
        test('should return the correct field list', () => {
            const fields = selector.getQueryFields();
            const expectedFields = [
                'SObjectType', 'Field', 'PermissionsRead', 'PermissionsEdit', 'ParentId',
                'Parent.Label', 'Parent.Name', 'Parent.IsOwnedByProfile',
                'Parent.Profile.Name', 'Parent.Profile.Id'
            ];
            assert.deepStrictEqual(fields, expectedFields);
        });
    });

    suite('selectByFieldName', () => {
        test('should query field permissions by field name', async () => {
            const mockRecords = [
                { ParentId: '1', Field: 'Account.Name', PermissionsRead: true }
            ];
            mockConnection.query.resolves({ records: mockRecords });
            const fullFieldName = 'Account.Name';

            const result = await selector.selectByFieldName(fullFieldName);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes(`WHERE Field = '${fullFieldName}'`));
            assert(query.includes('ORDER BY Parent.Label'));
            assert(query.includes('LIMIT 1000'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('mapByParentId', () => {
        test('should map records by ParentId', () => {
            const records = [
                { ParentId: '001', Field: 'Account.Name', PermissionsRead: true },
                { ParentId: '002', Field: 'Account.Name', PermissionsRead: false },
                { ParentId: '001', Field: 'Account.Type', PermissionsRead: true }
            ];

            const result = selector.mapByParentId(records);

            assert(result instanceof Map);
            assert.strictEqual(result.size, 2);
            assert(result.has('001'));
            assert(result.has('002'));
            assert.deepStrictEqual(result.get('001'), records[0]);
            assert.deepStrictEqual(result.get('002'), records[1]);
        });

        test('should handle empty records array', () => {
            const result = selector.mapByParentId([]);
            assert(result instanceof Map);
            assert.strictEqual(result.size, 0);
        });
    });
});