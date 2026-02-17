import * as assert from 'assert';
import * as sinon from 'sinon';
import { UserPermissionsService } from '../services/UserPermissionsService';

suite('UserPermissionsService Tests', () => {
    let service: UserPermissionsService;
    let mockQueryService: any;
    let mockPsAssignmentSelector: any;
    let mockPsgComponentSelector: any;
    let mockPsgSelector: any;
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();

        mockQueryService = {
            initialize: sandbox.stub().resolves(),
            getObjectPermissionsSelector: sandbox.stub(),
            getPermissionSetSelector: sandbox.stub(),
            getUserSelector: sandbox.stub(),
            getEntityDefinitionSelector: sandbox.stub()
        };

        mockPsAssignmentSelector = {
            initialize: sandbox.stub().resolves(),
            selectByUserId: sandbox.stub()
        };

        mockPsgComponentSelector = {
            initialize: sandbox.stub().resolves(),
            selectComponentsByPermissionSetIds: sandbox.stub()
        };

        mockPsgSelector = {
            initialize: sandbox.stub().resolves(),
            selectById: sandbox.stub()
        };

        service = new UserPermissionsService();
        (service as any).queryService = mockQueryService;
        (service as any).psAssignmentSelector = mockPsAssignmentSelector;
        (service as any).psgComponentSelector = mockPsgComponentSelector;
        (service as any).psgSelector = mockPsgSelector;
    });

    teardown(() => {
        sandbox.restore();
    });

    suite('initialize', () => {
        test('should initialize all selectors', async () => {
            await service.initialize();

            assert(mockQueryService.initialize.calledOnce);
            assert(mockPsAssignmentSelector.initialize.calledOnce);
            assert(mockPsgComponentSelector.initialize.calledOnce);
            assert(mockPsgSelector.initialize.calledOnce);
        });
    });

    suite('getUserPermissionsForObject', () => {
        test('should return empty array when user has no permission sets', async () => {
            mockPsAssignmentSelector.selectByUserId.resolves([]);

            const result = await service.getUserPermissionsForObject('005000000000001', 'Account');

            assert.deepStrictEqual(result, []);
        });

        test('should return empty array when no object permissions found', async () => {
            mockPsAssignmentSelector.selectByUserId.resolves([
                { PermissionSetId: '0PS000000000001' }
            ]);

            const mockObjPermSelector = {
                selectByParentIds: sandbox.stub().resolves([])
            };
            mockQueryService.getObjectPermissionsSelector.returns(mockObjPermSelector);

            const result = await service.getUserPermissionsForObject('005000000000001', 'Account');

            assert.deepStrictEqual(result, []);
        });

        test('should aggregate permissions correctly', async () => {
            mockPsAssignmentSelector.selectByUserId.resolves([
                { PermissionSetId: '0PS000000000001' }
            ]);

            const mockObjPermSelector = {
                selectByParentIds: sandbox.stub().resolves([
                    { ParentId: '0PS000000000001', PermissionsRead: true, PermissionsEdit: false }
                ])
            };

            const mockPsSelector = {
                selectByIds: sandbox.stub().resolves([
                    { Id: '0PS000000000001', Name: 'TestPermissionSet' }
                ])
            };

            mockQueryService.getObjectPermissionsSelector.returns(mockObjPermSelector);
            mockQueryService.getPermissionSetSelector.returns(mockPsSelector);

            const result = await service.getUserPermissionsForObject('005000000000001', 'Account');

            assert(mockObjPermSelector.selectByParentIds.calledWith(['0PS000000000001'], 'Account'));
            assert(mockPsSelector.selectByIds.calledWith(['0PS000000000001']));
            assert(Array.isArray(result));
        });
    });

    suite('getUserPermissionSetGroupsForObject', () => {
        test('should return empty array when user has no permission sets', async () => {
            mockPsAssignmentSelector.selectByUserId.resolves([]);

            const result = await service.getUserPermissionSetGroupsForObject('005000000000001', 'Account');

            assert.deepStrictEqual(result, []);
        });

        test('should aggregate PSG permissions correctly', async () => {
            mockPsAssignmentSelector.selectByUserId.resolves([
                { PermissionSetId: '0PS000000000001' }
            ]);

            const mockObjPermSelector = {
                selectByParentIds: sandbox.stub().resolves([
                    { ParentId: '0PS000000000001', PermissionsRead: true }
                ])
            };

            const mockPsSelector = {
                selectByIds: sandbox.stub().resolves([
                    { Id: '0PS000000000001', Name: 'TestPermissionSet' }
                ])
            };

            mockPsgComponentSelector.selectComponentsByPermissionSetIds.resolves([
                { PermissionSetGroupId: '0PG000000000001', PermissionSetId: '0PS000000000001' }
            ]);

            mockPsgSelector.selectById.resolves([
                { Id: '0PG000000000001', MasterLabel: 'Test PSG' }
            ]);

            mockQueryService.getObjectPermissionsSelector.returns(mockObjPermSelector);
            mockQueryService.getPermissionSetSelector.returns(mockPsSelector);

            const result = await service.getUserPermissionSetGroupsForObject('005000000000001', 'Account');

            assert(mockPsgComponentSelector.selectComponentsByPermissionSetIds.called);
            assert(mockPsgSelector.selectById.called);
            assert(Array.isArray(result));
        });
    });

    suite('getActiveUsers', () => {
        test('should return users domain object', async () => {
            const mockUserRecords = [
                { Id: '0051', Name: 'Test User' }
            ];

            const mockUserSelector = {
                selectActive: sandbox.stub().resolves(mockUserRecords)
            };

            mockQueryService.getUserSelector.returns(mockUserSelector);

            const result = await service.getActiveUsers();

            assert(mockUserSelector.selectActive.calledOnce);
            // Should return a domain object, not raw records
            assert(result);
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
        test('should return org-wide defaults when found', async () => {
            const mockDefaults = { InternalSharingModel: 'Private' };
            const mockEntitySelector = {
                selectOrgWideDefaults: sandbox.stub().resolves(mockDefaults)
            };
            mockQueryService.getEntityDefinitionSelector.returns(mockEntitySelector);

            const result = await service.getOrgWideDefaults('Account');

            assert(mockEntitySelector.selectOrgWideDefaults.calledWith('Account'));
            assert.deepStrictEqual(result, mockDefaults);
        });

        test('should return empty object when no defaults found', async () => {
            const mockEntitySelector = {
                selectOrgWideDefaults: sandbox.stub().resolves(null)
            };
            mockQueryService.getEntityDefinitionSelector.returns(mockEntitySelector);

            const result = await service.getOrgWideDefaults('Account');

            assert.deepStrictEqual(result, {});
        });

        test('should return empty object when query fails', async () => {
            const mockEntitySelector = {
                selectOrgWideDefaults: sandbox.stub().rejects(new Error('Query failed'))
            };
            mockQueryService.getEntityDefinitionSelector.returns(mockEntitySelector);

            const result = await service.getOrgWideDefaults('Account');

            assert.deepStrictEqual(result, {});
        });
    });

    suite('getUserProfilePermissionsForObject', () => {
        test('should return empty array when user not found', async () => {
            const mockUserSelector = {
                selectById: sandbox.stub().resolves([])
            };
            mockQueryService.getUserSelector.returns(mockUserSelector);

            const result = await service.getUserProfilePermissionsForObject('005000000000001', 'Account');

            assert.deepStrictEqual(result, []);
        });

        test('should return profile permissions', async () => {
            const mockUserRecords = [{
                Id: '005000000000001',
                Profile: { Id: '00e000000000001', Name: 'System Administrator' }
            }];

            const mockUserSelector = {
                selectById: sandbox.stub().resolves(mockUserRecords)
            };

            const mockObjPermSelector = {
                selectByProfileName: sandbox.stub().resolves([
                    { ParentId: '00e000000000001', PermissionsRead: true }
                ])
            };

            mockQueryService.getUserSelector.returns(mockUserSelector);
            mockQueryService.getObjectPermissionsSelector.returns(mockObjPermSelector);

            const result = await service.getUserProfilePermissionsForObject('005000000000001', 'Account');

            assert(mockObjPermSelector.selectByProfileName.calledWith('System Administrator', 'Account'));
            assert(Array.isArray(result));
        });
    });
});