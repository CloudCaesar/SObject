import * as assert from 'assert';
import * as sinon from 'sinon';
import { EntityDefinitionSelector } from '../selectors/EntityDefinitionSelector';

suite('EntityDefinitionSelector Tests', () => {
    let selector: EntityDefinitionSelector;
    let mockConnection: any;
    let sandbox: sinon.SinonSandbox;

    setup(async () => {
        sandbox = sinon.createSandbox();
        mockConnection = {
            query: sandbox.stub(),
            tooling: {
                query: sandbox.stub()
            }
        };

        selector = new EntityDefinitionSelector();
        (selector as any).connection = mockConnection;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should set the connection property', async () => {
            const newSelector = new EntityDefinitionSelector();
            await newSelector.initialize();
            assert((newSelector as any).connection);
        });

        test('should return the selector instance', async () => {
            const newSelector = new EntityDefinitionSelector();
            const result = await newSelector.initialize();
            assert.strictEqual(result, newSelector);
        });
    });

    suite('selectQueryableSObjects', () => {
        test('should query all queryable SObjects', async () => {
            const mockRecords = [
                { QualifiedApiName: 'Account', Label: 'Account' },
                { QualifiedApiName: 'Contact', Label: 'Contact' }
            ];
            mockConnection.query.resolves({ records: mockRecords });

            const result = await selector.selectQueryableSObjects();

            assert(mockConnection.query.calledOnce);
            const query = mockConnection.query.firstCall.args[0];
            assert(query.includes('FROM EntityDefinition WHERE IsQueryable = true'));
            assert(query.includes('ORDER BY Label'));
            assert.deepStrictEqual(result, mockRecords);
        });
    });

    suite('selectOrgWideDefaults', () => {
        test('should query org-wide defaults for standard object', async () => {
            const mockRecords = [{
                DeveloperName: 'Account',
                ExternalSharingModel: 'Private',
                InternalSharingModel: 'Private'
            }];
            mockConnection.tooling.query.resolves({ records: mockRecords });

            const result = await selector.selectOrgWideDefaults('Account');

            assert(mockConnection.tooling.query.calledOnce);
            const query = mockConnection.tooling.query.firstCall.args[0];
            assert(query.includes("WHERE DeveloperName = 'Account'"));
            assert(query.includes('ExternalSharingModel, InternalSharingModel'));
            assert.deepStrictEqual(result, mockRecords[0]);
        });

        test('should handle custom object names', async () => {
            const mockRecords = [{
                DeveloperName: 'Test_Object',
                ExternalSharingModel: 'Private',
                InternalSharingModel: 'Private'
            }];
            mockConnection.tooling.query.resolves({ records: mockRecords });

            const result = await selector.selectOrgWideDefaults('Test_Object__c');

            assert(mockConnection.tooling.query.calledOnce);
            const query = mockConnection.tooling.query.firstCall.args[0];
            assert(query.includes("WHERE DeveloperName = 'Test_Object'"));
            assert.deepStrictEqual(result, mockRecords[0]);
        });

        test('should return null when no records found', async () => {
            mockConnection.tooling.query.resolves({ records: [] });

            const result = await selector.selectOrgWideDefaults('NonExistentObject');

            assert.strictEqual(result, null);
        });

        test('should return null when query fails', async () => {
            mockConnection.tooling.query.rejects(new Error('Query failed'));

            const result = await selector.selectOrgWideDefaults('Account');

            assert.strictEqual(result, null);
        });
    });
});