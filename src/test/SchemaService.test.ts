import * as assert from 'assert';
import * as sinon from 'sinon';
import { SchemaService } from '../services/SchemaService';

suite('SchemaService Tests', () => {
    let service: SchemaService;
    let mockQueryService: any;
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();

        mockQueryService = {
            initialize: sandbox.stub().resolves(),
            getEntityDefinitionSelector: sandbox.stub()
        };

        service = new SchemaService();
        (service as any).queryService = mockQueryService;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should initialize the query service', async () => {
            await service.initialize();
            assert(mockQueryService.initialize.calledOnce);
        });
    });

    suite('getQueryableSObjects', () => {
        test('should delegate to entity definition selector', async () => {
            const mockEntitySelector = {
                selectQueryableSObjects: sandbox.stub().resolves(['Account', 'Contact'])
            };
            mockQueryService.getEntityDefinitionSelector.returns(mockEntitySelector);

            const result = await service.getQueryableSObjects();

            assert(mockEntitySelector.selectQueryableSObjects.calledOnce);
            assert.deepStrictEqual(result, ['Account', 'Contact']);
        });
    });

    suite('getOrgWideDefaults', () => {
        test('should delegate to entity definition selector', async () => {
            const mockDefaults = { InternalSharingModel: 'Private' };
            const mockEntitySelector = {
                selectOrgWideDefaults: sandbox.stub().resolves(mockDefaults)
            };
            mockQueryService.getEntityDefinitionSelector.returns(mockEntitySelector);

            const result = await service.getOrgWideDefaults('Account');

            assert(mockEntitySelector.selectOrgWideDefaults.calledWith('Account'));
            assert.deepStrictEqual(result, mockDefaults);
        });
    });
});