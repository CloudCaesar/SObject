/*
 * Copyright (c) 2026 Cloud CZR LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
