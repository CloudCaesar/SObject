import { UserSelector } from '../selectors/UserSelector';
import { PermissionSetSelector } from '../selectors/PermissionSetSelector';
import { ObjectPermissionsSelector } from '../selectors/ObjectPermissionsSelector';
import { FieldPermissionsSelector } from '../selectors/FieldPermissionsSelector';
import { PermissionSetGroupSelector } from '../selectors/PermissionSetGroupSelector';
import { EntityDefinitionSelector } from '../selectors/EntityDefinitionSelector';

/**
 * Service class to coordinate all selectors for permission analysis
 */
export class PermissionQueryService {
    private userSelector: UserSelector;
    private permissionSetSelector: PermissionSetSelector;
    private objectPermissionsSelector: ObjectPermissionsSelector;
    private fieldPermissionsSelector: FieldPermissionsSelector;
    private permissionSetGroupSelector: PermissionSetGroupSelector;
    private entityDefinitionSelector: EntityDefinitionSelector;

    constructor() {
        this.userSelector = new UserSelector();
        this.permissionSetSelector = new PermissionSetSelector();
        this.objectPermissionsSelector = new ObjectPermissionsSelector();
        this.fieldPermissionsSelector = new FieldPermissionsSelector();
        this.permissionSetGroupSelector = new PermissionSetGroupSelector();
        this.entityDefinitionSelector = new EntityDefinitionSelector();
    }

    async initialize() {
        console.log('[PermissionQueryService] Starting initialization');
        try {
            console.log('[PermissionQueryService] Initializing userSelector...');
            await this.userSelector.initialize();
            console.log('[PermissionQueryService] userSelector initialized');
            
            console.log('[PermissionQueryService] Initializing permissionSetSelector...');
            await this.permissionSetSelector.initialize();
            console.log('[PermissionQueryService] permissionSetSelector initialized');
            
            console.log('[PermissionQueryService] Initializing objectPermissionsSelector...');
            await this.objectPermissionsSelector.initialize();
            console.log('[PermissionQueryService] objectPermissionsSelector initialized');
            
            console.log('[PermissionQueryService] Initializing fieldPermissionsSelector...');
            await this.fieldPermissionsSelector.initialize();
            console.log('[PermissionQueryService] fieldPermissionsSelector initialized');
            
            console.log('[PermissionQueryService] Initializing permissionSetGroupSelector...');
            await this.permissionSetGroupSelector.initialize();
            console.log('[PermissionQueryService] permissionSetGroupSelector initialized');
            
            console.log('[PermissionQueryService] Initializing entityDefinitionSelector...');
            await this.entityDefinitionSelector.initialize();
            console.log('[PermissionQueryService] entityDefinitionSelector initialized');
            
            console.log('[PermissionQueryService] All selectors initialized successfully');
        } catch (error) {
            console.error('[PermissionQueryService] Initialization failed:', error);
            throw error;
        }
        return this;
    }

    // Expose selectors for use
    getUserSelector(): UserSelector {
        return this.userSelector;
    }

    getPermissionSetSelector(): PermissionSetSelector {
        return this.permissionSetSelector;
    }

    getObjectPermissionsSelector(): ObjectPermissionsSelector {
        return this.objectPermissionsSelector;
    }

    getFieldPermissionsSelector(): FieldPermissionsSelector {
        return this.fieldPermissionsSelector;
    }

    getPermissionSetGroupSelector(): PermissionSetGroupSelector {
        return this.permissionSetGroupSelector;
    }

    getEntityDefinitionSelector(): EntityDefinitionSelector {
        return this.entityDefinitionSelector;
    }
}
