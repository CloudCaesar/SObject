import * as assert from 'assert';
import * as sinon from 'sinon';
import { PermissionSetAssignmentSelector } from '../selectors/PermissionSetAssignmentSelector';

suite('PermissionSetAssignmentSelector Tests', () => {
    let selector: PermissionSetAssignmentSelector;
    let mockConnection: any;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        mockConnection = {
            query: sandbox.stub()
        };

        selector = new PermissionSetAssignmentSelector();
        (selector as any).connection = mockConnection;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should set the connection property', async () => {
            const newSelector = new PermissionSetAssignmentSelector();
            await newSelector.initialize();
            assert((newSelector as any).connection);
        });

        test('should return the selector instance', async () => {
            const newSelector = new PermissionSetAssignmentSelector();
            const result = await newSelector.initialize();
            assert.strictEqual(result, newSelector);
        });
    });

    suite('getQueryFields', () => {
        test('should return the correct field list', () => {
            const fields = selector.getQueryFields();
            const expectedFields = [
                'Id', 'PermissionSetId', 'AssigneeId', 'PermissionSetGroupId'
            ];
            assert.deepStrictEqual(fields, expectedFields);
        });
    });

    suite('selectByUserId', () => {
        test('should query permission set assignments for a user', async () => {
            const mockRecords = [{
                Id: '0Pa1',
                PermissionSetId: '0PS1',
                AssigneeId: '0051',
                PermissionSetGroupId: null
            }];
            mockConnection.query.resolves({ records: mockRecords });
            const userId = '005000000000001';

            const result = await selector.selectByUserId(userId);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes(`WHERE AssigneeId = '${userId}'`));
            assert(query.includes('PermissionSet.IsOwnedByProfile = false'));
            assert(query.includes('PermissionSetId != null'));
            assert(query.includes('PermissionSetGroupId = null'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectGroupsByUserId', () => {
        test('should query permission set group assignments for a user', async () => {
            const mockRecords = [{ PermissionSetGroupId: '0PG000000000001' }];
            mockConnection.query.resolves({ records: mockRecords });
            const userId = '005000000000001';

            const result = await selector.selectGroupsByUserId(userId);

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes(`WHERE AssigneeId = '${userId}'`));
            assert(query.includes('PermissionSetGroupId != null'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });
});