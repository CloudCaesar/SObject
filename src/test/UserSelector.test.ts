import * as assert from 'assert';
import * as sinon from 'sinon';
import { UserSelector } from '../selectors/UserSelector';

suite('UserSelector Tests', () => {
    let selector: UserSelector;
    let mockConnection: any;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        mockConnection = {
            query: sandbox.stub()
        };

        selector = new UserSelector();
        (selector as any).connection = mockConnection;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should set the connection property', async () => {
            const newSelector = new UserSelector();
            await newSelector.initialize();
            assert((newSelector as any).connection);
        });

        test('should return the selector instance', async () => {
            const newSelector = new UserSelector();
            const result = await newSelector.initialize();
            assert.strictEqual(result, newSelector);
        });
    });

    suite('getQueryFields', () => {
        test('should return the correct field list', () => {
            const fields = selector.getQueryFields();
            const expectedFields = [
                'Id', 'Name', 'Username', 'Profile.Name', 'Profile.Id'
            ];
            assert.deepStrictEqual(fields, expectedFields);
        });
    });

    suite('selectActive', () => {
        test('should query all active users', async () => {
            const mockRecords = [
                { Id: '005000000000001', Name: 'Test User', IsActive: true }
            ];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectActive();

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('FROM User WHERE IsActive = true'));
            assert(query.includes('ORDER BY Name'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectProfilesByIds', () => {
        test('should return empty array for empty input', async () => {
            const result = await selector.selectProfilesByIds([]);
            assert.deepStrictEqual(result, []);
            assert(mockConnection.query.notCalled);
        });

        test('should query profiles by IDs', async () => {
            const mockRecords = [{ Id: '00e000000000001', Name: 'System Administrator' }];
            mockConnection.query.resolves({ records: mockRecords });
            const profileIds = ['00e000000000001', '00e000000000002'];

            const result = await selector.selectProfilesByIds(profileIds);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('FROM Profile WHERE Id IN'));
            assert(query.includes("'00e000000000001'"));
            assert(query.includes("'00e000000000002'"));
            assert(query.includes('LIMIT 1000'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectById', () => {
        test('should query user by ID', async () => {
            const mockRecords = [{ Id: '005000000000001', Profile: { Name: 'System Admin' } }];
            mockConnection.query.resolves({ records: mockRecords });
            const userId = '005000000000001';

            const result = await selector.selectById(userId);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes(`WHERE Id = '${userId}'`));
            assert(query.includes('Profile.Name, Profile.Id'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });
});