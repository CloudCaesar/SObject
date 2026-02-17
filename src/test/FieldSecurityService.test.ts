import * as assert from 'assert';
import * as sinon from 'sinon';
import { FieldSecurityService } from '../services/FieldSecurityService';

suite('FieldSecurityService Tests', () => {
    let service: FieldSecurityService;
    let mockQueryService: any;
    let mockDomainService: any;
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();

        // Mock the query service and its selectors
        mockQueryService = {
            initialize: sandbox.stub().resolves(),
            getFieldPermissionsSelector: sandbox.stub(),
            getObjectPermissionsSelector: sandbox.stub(),
            getPermissionSetGroupSelector: sandbox.stub(),
            getUserSelector: sandbox.stub(),
            getEntityDefinitionSelector: sandbox.stub()
        };

        mockDomainService = {};

        service = new FieldSecurityService();
        (service as any).queryService = mockQueryService;
        (service as any).domainService = mockDomainService;
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

    suite('getFieldSecurityForObject', () => {
        test('should return empty result when no field permissions found', async () => {
            const mockFieldPermSelector = {
                selectByFieldName: sandbox.stub().resolves([])
            };
            mockQueryService.getFieldPermissionsSelector.returns(mockFieldPermSelector);

            const result = await service.getFieldSecurityForObject('Account', 'Name');

            assert.deepStrictEqual(result, { fieldPermissions: [], psgs: [] });
        });

        test('should calculate effective permissions correctly', async () => {
            // Mock field permissions
            const fieldPermRecords = [
                { ParentId: '001', PermissionsRead: true, PermissionsEdit: false }
            ];
            const mockFieldPermSelector = {
                selectByFieldName: sandbox.stub().resolves(fieldPermRecords)
            };

            // Mock object permissions
            const objPermRecords = [{
                ParentId: '001',
                Parent: {
                    Name: 'TestPermissionSet',
                    IsOwnedByProfile: false,
                    Type: 'PermissionSet'
                }
            }];
            const mockObjPermSelector = {
                selectByParentIds: sandbox.stub().resolves(objPermRecords)
            };

            mockQueryService.getFieldPermissionsSelector.returns(mockFieldPermSelector);
            mockQueryService.getObjectPermissionsSelector.returns(mockObjPermSelector);

            const result = await service.getFieldSecurityForObject('Account', 'Name');

            assert.strictEqual(result.fieldPermissions.length, 1);
            assert.strictEqual(result.fieldPermissions[0].source, 'TestPermissionSet');
            assert.strictEqual(result.fieldPermissions[0].sourceType, 'permission-set');
            assert.strictEqual(result.fieldPermissions[0].permissionsRead, true);
            assert.strictEqual(result.fieldPermissions[0].permissionsEdit, false);
        });

        test('should handle profile-based permissions', async () => {
            const fieldPermRecords = [
                { ParentId: '001', PermissionsRead: true, PermissionsEdit: true }
            ];
            const mockFieldPermSelector = {
                selectByFieldName: sandbox.stub().resolves(fieldPermRecords)
            };

            const objPermRecords = [{
                ParentId: '001',
                Parent: {
                    IsOwnedByProfile: true,
                    Profile: { Name: 'System Administrator' }
                }
            }];
            const mockObjPermSelector = {
                selectByParentIds: sandbox.stub().resolves(objPermRecords)
            };

            mockQueryService.getFieldPermissionsSelector.returns(mockFieldPermSelector);
            mockQueryService.getObjectPermissionsSelector.returns(mockObjPermSelector);

            const result = await service.getFieldSecurityForObject('Account', 'Name');

            assert.strictEqual(result.fieldPermissions.length, 1);
            assert.strictEqual(result.fieldPermissions[0].source, 'System Administrator');
            assert.strictEqual(result.fieldPermissions[0].sourceType, 'profile');
        });

        test('should handle PSG permissions', async () => {
            const fieldPermRecords = [
                { ParentId: '001', PermissionsRead: true, PermissionsEdit: false }
            ];
            const mockFieldPermSelector = {
                selectByFieldName: sandbox.stub().resolves(fieldPermRecords)
            };

            const objPermRecords = [{
                ParentId: '001',
                Parent: {
                    Name: 'TestPS',
                    IsOwnedByProfile: false,
                    Type: 'PermissionSet'
                }
            }];
            const mockObjPermSelector = {
                selectByParentIds: sandbox.stub().resolves(objPermRecords)
            };

            // Mock PSG components and details
            const mockPsgSelector = {
                selectComponentsByPermissionSetIds: sandbox.stub().resolves([
                    { PermissionSetGroupId: '0PG1', PermissionSetId: '001' }
                ]),
                selectById: sandbox.stub().resolves([
                    { Id: '0PG1', MasterLabel: 'Test PSG' }
                ]),
                selectAssignmentsByGroupIds: sandbox.stub().resolves([])
            };

            mockQueryService.getFieldPermissionsSelector.returns(mockFieldPermSelector);
            mockQueryService.getObjectPermissionsSelector.returns(mockObjPermSelector);
            mockQueryService.getPermissionSetGroupSelector.returns(mockPsgSelector);

            const result = await service.getFieldSecurityForObject('Account', 'Name');

            assert.strictEqual(result.psgs.length, 1);
            assert.strictEqual(result.psgs[0].name, 'Test PSG');
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