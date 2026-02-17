import * as assert from 'assert';
import * as sinon from 'sinon';
import { PermissionSetGroupComponentSelector } from '../selectors/PermissionSetGroupComponentSelector';

suite('PermissionSetGroupComponentSelector Tests', () => {
    let selector: PermissionSetGroupComponentSelector;
    let mockConnection: any;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        mockConnection = {
            query: sandbox.stub()
        };

        selector = new PermissionSetGroupComponentSelector();
        (selector as any).connection = mockConnection;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should set the connection property', async () => {
            const newSelector = new PermissionSetGroupComponentSelector();
            await newSelector.initialize();
            assert((newSelector as any).connection);
        });

        test('should return the selector instance', async () => {
            const newSelector = new PermissionSetGroupComponentSelector();
            const result = await newSelector.initialize();
            assert.strictEqual(result, newSelector);
        });
    });

    suite('getQueryFields', () => {
        test('should return the correct field list', () => {
            const fields = selector.getQueryFields();
            const expectedFields = ['PermissionSetGroupId', 'PermissionSetId'];
            assert.deepStrictEqual(fields, expectedFields);
        });
    });

    suite('selectComponentsByPermissionSetIds', () => {
        test('should return empty array for empty input', async () => {
            const result = await selector.selectComponentsByPermissionSetIds([]);
            assert.deepStrictEqual(result, []);
            assert(mockConnection.query.notCalled);
        });

        test('should query components by permission set IDs', async () => {
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

    suite('selectComponentsByPermissionSetGroupIds', () => {
        test('should return empty array for empty input', async () => {
            const result = await selector.selectComponentsByPermissionSetGroupIds([]);
            assert.deepStrictEqual(result, []);
            assert(mockConnection.query.notCalled);
        });

        test('should query components by PSG IDs', async () => {
            const mockRecords = [{ PermissionSetGroupId: '0PG1', PermissionSetId: '0PS1' }];
            mockConnection.query.resolves({ records: mockRecords });
            const psgIds = ['0PG000000000001', '0PG000000000002'];

            const result = await selector.selectComponentsByPermissionSetGroupIds(psgIds);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('FROM PermissionSetGroupComponent WHERE PermissionSetGroupId IN'));
            assert(query.includes("'0PG000000000001'"));
            assert(query.includes("'0PG000000000002'"));
            assert(query.includes('LIMIT 1000'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('extractUniquePsgIds', () => {
        test('should extract unique PSG IDs from component records', () => {
            const componentRecords = [
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS1' },
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS2' },
                { PermissionSetGroupId: '0PG2', PermissionSetId: '0PS3' },
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS4' }
            ];

            const result = selector.extractUniquePsgIds(componentRecords);

            assert.deepStrictEqual(result.sort(), ['0PG1', '0PG2']);
        });

        test('should handle empty array', () => {
            const result = selector.extractUniquePsgIds([]);
            assert.deepStrictEqual(result, []);
        });
    });

    suite('extractUniquePermissionSetIds', () => {
        test('should extract unique PermissionSet IDs from component records', () => {
            const componentRecords = [
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS1' },
                { PermissionSetGroupId: '0PG2', PermissionSetId: '0PS1' },
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS2' },
                { PermissionSetGroupId: '0PG2', PermissionSetId: '0PS3' }
            ];

            const result = selector.extractUniquePermissionSetIds(componentRecords);

            assert.deepStrictEqual(result.sort(), ['0PS1', '0PS2', '0PS3']);
        });

        test('should handle empty array', () => {
            const result = selector.extractUniquePermissionSetIds([]);
            assert.deepStrictEqual(result, []);
        });
    });

    suite('groupByPermissionSetGroupId', () => {
        test('should group components by PSG ID', () => {
            const componentRecords = [
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS1' },
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS2' },
                { PermissionSetGroupId: '0PG2', PermissionSetId: '0PS3' }
            ];

            const result = selector.groupByPermissionSetGroupId(componentRecords);

            assert(result instanceof Map);
            assert.strictEqual(result.size, 2);
            assert.deepStrictEqual(result.get('0PG1'), [
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS1' },
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS2' }
            ]);
            assert.deepStrictEqual(result.get('0PG2'), [
                { PermissionSetGroupId: '0PG2', PermissionSetId: '0PS3' }
            ]);
        });
    });

    suite('groupByPermissionSetId', () => {
        test('should group components by PermissionSet ID', () => {
            const componentRecords = [
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS1' },
                { PermissionSetGroupId: '0PG2', PermissionSetId: '0PS1' },
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS2' }
            ];

            const result = selector.groupByPermissionSetId(componentRecords);

            assert(result instanceof Map);
            assert.strictEqual(result.size, 2);
            assert.deepStrictEqual(result.get('0PS1'), [
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS1' },
                { PermissionSetGroupId: '0PG2', PermissionSetId: '0PS1' }
            ]);
            assert.deepStrictEqual(result.get('0PS2'), [
                { PermissionSetGroupId: '0PG1', PermissionSetId: '0PS2' }
            ]);
        });
    });
});