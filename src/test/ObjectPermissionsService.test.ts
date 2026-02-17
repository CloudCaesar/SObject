import * as assert from 'assert';
import * as sinon from 'sinon';
import { ObjectPermissionsService } from '../../src/services/ObjectPermissionsService';

describe('ObjectPermissionsService', () => {
    let service: ObjectPermissionsService;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        service = new ObjectPermissionsService();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('initialize', () => {
        it('should initialize the service successfully', async () => {
            // Act
            await service.initialize();

            // Assert - no exceptions thrown
            assert.ok(true);
        });
    });

    describe('getAllPermissionSetsForObject', () => {
        it('should return permission sets with actual permissions', async () => {
            // Arrange
            const objectName = 'Account';
            const objectPermRecords = [
                {
                    Parent: { Name: 'TestPS1', IsOwnedByProfile: false, Type: 'Regular' },
                    PermissionsRead: true,
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false
                },
                {
                    Parent: { Name: 'TestPS2', IsOwnedByProfile: true, Type: 'Regular' },
                    PermissionsRead: true,
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false
                },
                {
                    Parent: { Name: 'TestPS3', IsOwnedByProfile: false, Type: 'Group' },
                    PermissionsRead: true,
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false
                },
                {
                    Parent: { Name: 'TestPS4', IsOwnedByProfile: false, Type: 'Regular' },
                    PermissionsRead: false,
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false
                }
            ];

            const mockSelector = {
                selectBySObjectType: sandbox.stub().resolves(objectPermRecords)
            };

            // Mock the internal selector
            (service as any).objectPermissionsSelector = mockSelector;

            // Act
            const result = await service.getAllPermissionSetsForObject(objectName);

            // Assert
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].Parent.Name, 'TestPS1');
        });

        it('should handle empty results', async () => {
            // Arrange
            const objectName = 'Account';
            const mockSelector = {
                selectBySObjectType: sandbox.stub().resolves([])
            };

            (service as any).objectPermissionsSelector = mockSelector;

            // Act
            const result = await service.getAllPermissionSetsForObject(objectName);

            // Assert
            assert.strictEqual(result.length, 0);
        });
    });

    describe('getAllPermissionSetGroupsForObject', () => {
        it('should return aggregated permission set group permissions', async () => {
            // Arrange
            const objectName = 'Account';
            const objectPermRecords = [
                {
                    ParentId: 'ps1',
                    Parent: { Name: 'PS1', IsOwnedByProfile: false },
                    PermissionsRead: true,
                    PermissionsCreate: false
                },
                {
                    ParentId: 'ps2',
                    Parent: { Name: 'PS2', IsOwnedByProfile: false },
                    PermissionsRead: false,
                    PermissionsCreate: true
                }
            ];

            const psgComponents = [
                { PermissionSetGroupId: 'psg1', PermissionSetId: 'ps1' },
                { PermissionSetGroupId: 'psg1', PermissionSetId: 'ps2' }
            ];

            const psgRecords = [
                { Id: 'psg1', DeveloperName: 'TestGroup', MasterLabel: 'Test Group' }
            ];

            const mockObjectPermSelector = {
                selectBySObjectType: sandbox.stub().resolves(objectPermRecords)
            };
            const mockPsgSelector = {
                selectComponentsByPermissionSetIds: sandbox.stub().resolves(psgComponents),
                selectById: sandbox.stub().resolves(psgRecords)
            };

            (service as any).objectPermissionsSelector = mockObjectPermSelector;
            (service as any).permissionSetGroupSelector = mockPsgSelector;

            // Act
            const result = await service.getAllPermissionSetGroupsForObject(objectName);

            // Assert
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].Parent.Name, 'TestGroup');
            assert.strictEqual(result[0].PermissionsRead, true);
            assert.strictEqual(result[0].PermissionsCreate, true);
            assert.strictEqual(result[0].fromGroup, true);
        });

        it('should handle permission set groups not available', async () => {
            // Arrange
            const objectName = 'Account';
            const objectPermRecords = [
                {
                    ParentId: 'ps1',
                    Parent: { Name: 'PS1', IsOwnedByProfile: false },
                    PermissionsRead: true
                }
            ];

            const mockObjectPermSelector = {
                selectBySObjectType: sandbox.stub().resolves(objectPermRecords)
            };
            const mockPsgSelector = {
                selectComponentsByPermissionSetIds: sandbox.stub().throws(new Error('PSG not available')),
                selectById: sandbox.stub().resolves([])
            };

            (service as any).objectPermissionsSelector = mockObjectPermSelector;
            (service as any).permissionSetGroupSelector = mockPsgSelector;

            // Act
            const result = await service.getAllPermissionSetGroupsForObject(objectName);

            // Assert
            assert.strictEqual(result.length, 0);
        });

        it('should filter out profile permissions', async () => {
            // Arrange
            const objectName = 'Account';
            const objectPermRecords = [
                {
                    ParentId: 'ps1',
                    Parent: { Name: 'PS1', IsOwnedByProfile: true },
                    PermissionsRead: true
                }
            ];

            const mockObjectPermSelector = {
                selectBySObjectType: sandbox.stub().resolves(objectPermRecords)
            };

            (service as any).objectPermissionsSelector = mockObjectPermSelector;

            // Act
            const result = await service.getAllPermissionSetGroupsForObject(objectName);

            // Assert
            assert.strictEqual(result.length, 0);
        });
    });

    describe('getAllProfilePermissionsForObject', () => {
        it('should return profile permissions with actual permissions', async () => {
            // Arrange
            const objectName = 'Account';
            const objectPermRecords = [
                {
                    ParentId: 'profile1',
                    Parent: {
                        IsOwnedByProfile: true,
                        Profile: { Name: 'System Administrator' }
                    },
                    PermissionsRead: true,
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false
                },
                {
                    ParentId: 'profile2',
                    Parent: {
                        IsOwnedByProfile: true,
                        Profile: { Name: 'Standard User' }
                    },
                    PermissionsRead: false,
                    PermissionsCreate: false,
                    PermissionsEdit: false,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false
                }
            ];

            const mockSelector = {
                selectBySObjectType: sandbox.stub().resolves(objectPermRecords)
            };

            (service as any).objectPermissionsSelector = mockSelector;

            // Act
            const result = await service.getAllProfilePermissionsForObject(objectName);

            // Assert
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].Parent.Name, 'System Administrator');
        });

        it('should handle profiles without Profile.Name', async () => {
            // Arrange
            const objectName = 'Account';
            const objectPermRecords = [
                {
                    ParentId: 'profile1',
                    Parent: {
                        IsOwnedByProfile: true,
                        Name: 'Fallback Name'
                    },
                    PermissionsRead: true
                }
            ];

            const mockSelector = {
                selectBySObjectType: sandbox.stub().resolves(objectPermRecords)
            };

            (service as any).objectPermissionsSelector = mockSelector;

            // Act
            const result = await service.getAllProfilePermissionsForObject(objectName);

            // Assert
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].Parent.Name, 'Fallback Name');
        });

        it('should handle empty results', async () => {
            // Arrange
            const objectName = 'Account';
            const mockSelector = {
                selectBySObjectType: sandbox.stub().resolves([])
            };

            (service as any).objectPermissionsSelector = mockSelector;

            // Act
            const result = await service.getAllProfilePermissionsForObject(objectName);

            // Assert
            assert.strictEqual(result.length, 0);
        });
    });

    describe('getOrgWideDefaults', () => {
        it('should return org wide defaults from entity definition selector', async () => {
            // Arrange
            const objectName = 'Account';
            const expectedDefaults = { externalSharingModel: 'Private' };

            const mockSelector = {
                selectOrgWideDefaults: sandbox.stub().resolves(expectedDefaults)
            };

            (service as any).entityDefinitionSelector = mockSelector;

            // Act
            const result = await service.getOrgWideDefaults(objectName);

            // Assert
            assert.strictEqual(result, expectedDefaults);
            sinon.assert.calledWith(mockSelector.selectOrgWideDefaults, objectName);
        });
    });

    describe('getQueryableSObjects', () => {
        it('should return queryable sobjects from entity definition selector', async () => {
            // Arrange
            const expectedSObjects = ['Account', 'Contact', 'Opportunity'];

            const mockSelector = {
                selectQueryableSObjects: sandbox.stub().resolves(expectedSObjects)
            };

            (service as any).entityDefinitionSelector = mockSelector;

            // Act
            const result = await service.getQueryableSObjects();

            // Assert
            assert.deepStrictEqual(result, expectedSObjects);
        });
    });
});