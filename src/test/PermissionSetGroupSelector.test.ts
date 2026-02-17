import * as assert from 'assert';
import * as sinon from 'sinon';
import { PermissionSetGroupSelector } from '../selectors/PermissionSetGroupSelector';

suite('PermissionSetGroupSelector Tests', () => {
    let selector: PermissionSetGroupSelector;
    let mockConnection: any;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        mockConnection = {
            query: sandbox.stub()
        };

        selector = new PermissionSetGroupSelector();
        (selector as any).connection = mockConnection;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should set the connection property', async () => {
            const newSelector = new PermissionSetGroupSelector();
            await newSelector.initialize();
            assert((newSelector as any).connection);
        });

        test('should return the selector instance', async () => {
            const newSelector = new PermissionSetGroupSelector();
            const result = await newSelector.initialize();
            assert.strictEqual(result, newSelector);
        });
    });

    suite('getQueryFields', () => {
        test('should return the correct field list', () => {
            const fields = selector.getQueryFields();
            const expectedFields = ['Id', 'DeveloperName', 'MasterLabel'];
            assert.deepStrictEqual(fields, expectedFields);
        });
    });

    suite('selectComponentsByPermissionSetIds', () => {
        test('should return empty array for empty input', async () => {
            const result = await selector.selectComponentsByPermissionSetIds([]);
            assert.deepStrictEqual(result, []);
            assert(mockConnection.query.notCalled);
        });

        test('should query permission set group components by permission set IDs', async () => {
            const mockRecords = [{ PermissionSetGroupId: '0PG1', PermissionSetId: '0PS1' }];
            mockConnection.query.resolves({ records: mockRecords });
            const permissionSetIds = ['0PS000000000001', '0PS000000000002'];

            const result = await selector.selectComponentsByPermissionSetIds(permissionSetIds);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('FROM PermissionSetGroupComponent WHERE PermissionSetId IN'));
            assert(query.includes("'0PS000000000001'"));
            assert(query.includes("'0PS000000000002'"));
            assert(query.includes('LIMIT 1000'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectById', () => {
        test('should return empty array for empty input', async () => {
            const result = await selector.selectById([]);
            assert.deepStrictEqual(result, []);
            assert(mockConnection.query.notCalled);
        });

        test('should query permission set groups by IDs', async () => {
            const mockRecords = [{ Id: '0PG1', DeveloperName: 'TestGroup' }];
            mockConnection.query.resolves({ records: mockRecords });
            const psgIds = ['0PG000000000001', '0PG000000000002'];

            const result = await selector.selectById(psgIds);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('FROM PermissionSetGroup WHERE Id IN'));
            assert(query.includes("'0PG000000000001'"));
            assert(query.includes("'0PG000000000002'"));
            assert(query.includes('LIMIT 1000'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectWithComponentsByUserId', () => {
        test('should return empty array when user has no PSG assignments', async () => {
            mockConnection.query.onFirstCall().resolves({ records: [] });

            const result = await selector.selectWithComponentsByUserId('005000000000001');

            assert.deepStrictEqual(result, []);
        });

        test('should query PSG details with components for user', async () => {
            // Mock assignment query
            mockConnection.query.onFirstCall().resolves({
                records: [{ PermissionSetGroupId: '0PG000000000001' }]
            });

            // Mock PSG query
            mockConnection.query.onSecondCall().resolves({
                records: [{ Id: '0PG000000000001', DeveloperName: 'TestGroup' }]
            });

            // Mock component query
            mockConnection.query.onThirdCall().resolves({
                records: [{ PermissionSetGroupId: '0PG000000000001', PermissionSetId: '0PS000000000001' }]
            });

            const result = await selector.selectWithComponentsByUserId('005000000000001');

            assert.strictEqual(mockConnection.query.callCount, 3);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].Id, '0PG000000000001');
            assert(result[0].PermissionSetGroupComponents);
            assert.strictEqual(result[0].PermissionSetGroupComponents.records.length, 1);
        });
    });

    suite('selectAssignmentsByGroupIds', () => {
        test('should return empty array for empty input', async () => {
            const result = await selector.selectAssignmentsByGroupIds([]);
            assert.deepStrictEqual(result, []);
            assert(mockConnection.query.notCalled);
        });

        test('should query permission set group assignments by group IDs', async () => {
            const mockRecords = [{ PermissionSetGroupId: '0PG1', AssigneeId: '0051' }];
            mockConnection.query.resolves({ records: mockRecords });
            const psgIds = ['0PG000000000001', '0PG000000000002'];

            const result = await selector.selectAssignmentsByGroupIds(psgIds);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('FROM PermissionSetAssignment WHERE PermissionSetGroupId IN'));
            assert(query.includes("'0PG000000000001'"));
            assert(query.includes("'0PG000000000002'"));
            assert(query.includes('LIMIT 1000'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectAllMemberPermissionSetIds', () => {
        test('should query all permission set IDs that are members of PSGs', async () => {
            const mockRecords = [
                { PermissionSetId: '0PS000000000001' },
                { PermissionSetId: '0PS000000000002' }
            ];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectAllMemberPermissionSetIds();

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('FROM PermissionSetGroupComponent GROUP BY PermissionSetId'));
            assert(query.includes('LIMIT 10000'));
            assert.deepStrictEqual(result, ['0PS000000000001', '0PS000000000002']);
        });
    });
});