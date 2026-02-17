import * as assert from 'assert';
import * as sinon from 'sinon';
import { PermissionQueryService } from '../../src/services/PermissionQueryService';
import { UserSelector } from '../../src/selectors/UserSelector';
import { PermissionSetSelector } from '../../src/selectors/PermissionSetSelector';
import { ObjectPermissionsSelector } from '../../src/selectors/ObjectPermissionsSelector';
import { FieldPermissionsSelector } from '../../src/selectors/FieldPermissionsSelector';
import { PermissionSetGroupSelector } from '../../src/selectors/PermissionSetGroupSelector';
import { EntityDefinitionSelector } from '../../src/selectors/EntityDefinitionSelector';

describe('PermissionQueryService', () => {
    let service: PermissionQueryService;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        service = new PermissionQueryService();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create all selector instances', () => {
            // Assert
            assert.ok(service.getUserSelector() instanceof UserSelector);
            assert.ok(service.getPermissionSetSelector() instanceof PermissionSetSelector);
            assert.ok(service.getObjectPermissionsSelector() instanceof ObjectPermissionsSelector);
            assert.ok(service.getFieldPermissionsSelector() instanceof FieldPermissionsSelector);
            assert.ok(service.getPermissionSetGroupSelector() instanceof PermissionSetGroupSelector);
            assert.ok(service.getEntityDefinitionSelector() instanceof EntityDefinitionSelector);
        });
    });

    describe('initialize', () => {
        let mockUserSelector: sinon.SinonStubbedInstance<UserSelector>;
        let mockPermissionSetSelector: sinon.SinonStubbedInstance<PermissionSetSelector>;
        let mockObjectPermissionsSelector: sinon.SinonStubbedInstance<ObjectPermissionsSelector>;
        let mockFieldPermissionsSelector: sinon.SinonStubbedInstance<FieldPermissionsSelector>;
        let mockPermissionSetGroupSelector: sinon.SinonStubbedInstance<PermissionSetGroupSelector>;
        let mockEntityDefinitionSelector: sinon.SinonStubbedInstance<EntityDefinitionSelector>;

        beforeEach(() => {
            mockUserSelector = sandbox.createStubInstance(UserSelector);
            mockPermissionSetSelector = sandbox.createStubInstance(PermissionSetSelector);
            mockObjectPermissionsSelector = sandbox.createStubInstance(ObjectPermissionsSelector);
            mockFieldPermissionsSelector = sandbox.createStubInstance(FieldPermissionsSelector);
            mockPermissionSetGroupSelector = sandbox.createStubInstance(PermissionSetGroupSelector);
            mockEntityDefinitionSelector = sandbox.createStubInstance(EntityDefinitionSelector);

            // Replace the selectors with mocks
            (service as any).userSelector = mockUserSelector;
            (service as any).permissionSetSelector = mockPermissionSetSelector;
            (service as any).objectPermissionsSelector = mockObjectPermissionsSelector;
            (service as any).fieldPermissionsSelector = mockFieldPermissionsSelector;
            (service as any).permissionSetGroupSelector = mockPermissionSetGroupSelector;
            (service as any).entityDefinitionSelector = mockEntityDefinitionSelector;
        });

        it('should initialize all selectors successfully', async () => {
            // Arrange
            mockUserSelector.initialize.resolves();
            mockPermissionSetSelector.initialize.resolves();
            mockObjectPermissionsSelector.initialize.resolves();
            mockFieldPermissionsSelector.initialize.resolves();
            mockPermissionSetGroupSelector.initialize.resolves();
            mockEntityDefinitionSelector.initialize.resolves();

            // Act
            const result = await service.initialize();

            // Assert
            assert.strictEqual(result, service);
            sinon.assert.calledOnce(mockUserSelector.initialize);
            sinon.assert.calledOnce(mockPermissionSetSelector.initialize);
            sinon.assert.calledOnce(mockObjectPermissionsSelector.initialize);
            sinon.assert.calledOnce(mockFieldPermissionsSelector.initialize);
            sinon.assert.calledOnce(mockPermissionSetGroupSelector.initialize);
            sinon.assert.calledOnce(mockEntityDefinitionSelector.initialize);
        });

        it('should throw error when userSelector initialization fails', async () => {
            // Arrange
            const testError = new Error('User selector init failed');
            mockUserSelector.initialize.rejects(testError);
            mockPermissionSetSelector.initialize.resolves();
            mockObjectPermissionsSelector.initialize.resolves();
            mockFieldPermissionsSelector.initialize.resolves();
            mockPermissionSetGroupSelector.initialize.resolves();
            mockEntityDefinitionSelector.initialize.resolves();

            // Act & Assert
            await assert.rejects(
                () => service.initialize(),
                (error: Error) => {
                    assert.strictEqual(error, testError);
                    return true;
                }
            );

            // Verify other selectors were not initialized
            sinon.assert.notCalled(mockPermissionSetSelector.initialize);
        });

        it('should throw error when permissionSetSelector initialization fails', async () => {
            // Arrange
            const testError = new Error('Permission set selector init failed');
            mockUserSelector.initialize.resolves();
            mockPermissionSetSelector.initialize.rejects(testError);
            mockObjectPermissionsSelector.initialize.resolves();
            mockFieldPermissionsSelector.initialize.resolves();
            mockPermissionSetGroupSelector.initialize.resolves();
            mockEntityDefinitionSelector.initialize.resolves();

            // Act & Assert
            await assert.rejects(
                () => service.initialize(),
                (error: Error) => {
                    assert.strictEqual(error, testError);
                    return true;
                }
            );

            // Verify subsequent selectors were not initialized
            sinon.assert.notCalled(mockObjectPermissionsSelector.initialize);
        });

        it('should throw error when objectPermissionsSelector initialization fails', async () => {
            // Arrange
            const testError = new Error('Object permissions selector init failed');
            mockUserSelector.initialize.resolves();
            mockPermissionSetSelector.initialize.resolves();
            mockObjectPermissionsSelector.initialize.rejects(testError);
            mockFieldPermissionsSelector.initialize.resolves();
            mockPermissionSetGroupSelector.initialize.resolves();
            mockEntityDefinitionSelector.initialize.resolves();

            // Act & Assert
            await assert.rejects(
                () => service.initialize(),
                (error: Error) => {
                    assert.strictEqual(error, testError);
                    return true;
                }
            );

            // Verify subsequent selectors were not initialized
            sinon.assert.notCalled(mockFieldPermissionsSelector.initialize);
        });

        it('should throw error when fieldPermissionsSelector initialization fails', async () => {
            // Arrange
            const testError = new Error('Field permissions selector init failed');
            mockUserSelector.initialize.resolves();
            mockPermissionSetSelector.initialize.resolves();
            mockObjectPermissionsSelector.initialize.resolves();
            mockFieldPermissionsSelector.initialize.rejects(testError);
            mockPermissionSetGroupSelector.initialize.resolves();
            mockEntityDefinitionSelector.initialize.resolves();

            // Act & Assert
            await assert.rejects(
                () => service.initialize(),
                (error: Error) => {
                    assert.strictEqual(error, testError);
                    return true;
                }
            );

            // Verify subsequent selectors were not initialized
            sinon.assert.notCalled(mockPermissionSetGroupSelector.initialize);
        });

        it('should throw error when permissionSetGroupSelector initialization fails', async () => {
            // Arrange
            const testError = new Error('Permission set group selector init failed');
            mockUserSelector.initialize.resolves();
            mockPermissionSetSelector.initialize.resolves();
            mockObjectPermissionsSelector.initialize.resolves();
            mockFieldPermissionsSelector.initialize.resolves();
            mockPermissionSetGroupSelector.initialize.rejects(testError);
            mockEntityDefinitionSelector.initialize.resolves();

            // Act & Assert
            await assert.rejects(
                () => service.initialize(),
                (error: Error) => {
                    assert.strictEqual(error, testError);
                    return true;
                }
            );

            // Verify subsequent selectors were not initialized
            sinon.assert.notCalled(mockEntityDefinitionSelector.initialize);
        });

        it('should throw error when entityDefinitionSelector initialization fails', async () => {
            // Arrange
            const testError = new Error('Entity definition selector init failed');
            mockUserSelector.initialize.resolves();
            mockPermissionSetSelector.initialize.resolves();
            mockObjectPermissionsSelector.initialize.resolves();
            mockFieldPermissionsSelector.initialize.resolves();
            mockPermissionSetGroupSelector.initialize.resolves();
            mockEntityDefinitionSelector.initialize.rejects(testError);

            // Act & Assert
            await assert.rejects(
                () => service.initialize(),
                (error: Error) => {
                    assert.strictEqual(error, testError);
                    return true;
                }
            );
        });
    });

    describe('getUserSelector', () => {
        it('should return the user selector instance', () => {
            // Act
            const result = service.getUserSelector();

            // Assert
            assert.ok(result instanceof UserSelector);
        });
    });

    describe('getPermissionSetSelector', () => {
        it('should return the permission set selector instance', () => {
            // Act
            const result = service.getPermissionSetSelector();

            // Assert
            assert.ok(result instanceof PermissionSetSelector);
        });
    });

    describe('getObjectPermissionsSelector', () => {
        it('should return the object permissions selector instance', () => {
            // Act
            const result = service.getObjectPermissionsSelector();

            // Assert
            assert.ok(result instanceof ObjectPermissionsSelector);
        });
    });

    describe('getFieldPermissionsSelector', () => {
        it('should return the field permissions selector instance', () => {
            // Act
            const result = service.getFieldPermissionsSelector();

            // Assert
            assert.ok(result instanceof FieldPermissionsSelector);
        });
    });

    describe('getPermissionSetGroupSelector', () => {
        it('should return the permission set group selector instance', () => {
            // Act
            const result = service.getPermissionSetGroupSelector();

            // Assert
            assert.ok(result instanceof PermissionSetGroupSelector);
        });
    });

    describe('getEntityDefinitionSelector', () => {
        it('should return the entity definition selector instance', () => {
            // Act
            const result = service.getEntityDefinitionSelector();

            // Assert
            assert.ok(result instanceof EntityDefinitionSelector);
        });
    });
});