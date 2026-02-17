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

import { PermissionQueryService } from './PermissionQueryService';
import { PermissionDomainService } from '../domain/PermissionDomainService';

export class FieldSecurityService {
    private queryService: PermissionQueryService;
    private domainService: PermissionDomainService;

    constructor() {
        this.queryService = new PermissionQueryService();
        this.domainService = new PermissionDomainService();
    }

    async initialize(): Promise<void> {
        await this.queryService.initialize();
    }

    async getFieldSecurityForObject(objectName: string, fieldName: string) {
        const fullFieldName = `${objectName}.${fieldName}`;
        console.log(`[FieldSecurityService] getFieldSecurityForObject: objectName=${objectName}, fieldName=${fieldName}, fullFieldName=${fullFieldName}`);

        try {
            // Step 1: Get field-level permissions for the specific field
            console.log(`[FieldSecurityService] Step 1: Querying field permissions for ${fullFieldName}`);
            const fieldPermRecords = await this.queryService.getFieldPermissionsSelector().selectByFieldName(fullFieldName);
            console.log(`[FieldSecurityService] Step 1 complete: Retrieved ${fieldPermRecords.length} field permission records`);

            if (fieldPermRecords.length === 0) {
                console.log(`[FieldSecurityService] No field-level permissions found for ${fullFieldName}`);
                return { fieldPermissions: [], psgs: [] };
            }

            // Get parent IDs that have field permissions
            const parentIds = [...new Set(fieldPermRecords.map(fp => fp.ParentId))];
            console.log(`[FieldSecurityService] Step 2: Found ${parentIds.length} unique parents with field permissions`);

            // Step 2: Get object-level permissions for these parents
            console.log(`[FieldSecurityService] Step 3: Querying object permissions for ${objectName} and ${parentIds.length} parents`);
            const objPermRecords = await this.queryService.getObjectPermissionsSelector().selectByParentIds(parentIds, objectName);
            console.log(`[FieldSecurityService] Step 3 complete: Retrieved ${objPermRecords.length} object permission records`);

            // Step 3: Calculate effective permissions (field overrides object)
            console.log(`[FieldSecurityService] Step 4: Calculating effective permissions`);
            const effectivePermissions: any[] = [];
            
            // Create a map of object permissions by ParentId for quick lookup
            const objPermMap = new Map<string, any>();
            for (const objPerm of objPermRecords) {
                objPermMap.set(objPerm.ParentId, objPerm);
            }
            
            // For each field permission, determine effective permissions
            for (const fieldPerm of fieldPermRecords) {
                const parentId = fieldPerm.ParentId;
                const objPerm = objPermMap.get(parentId);
                
                // Skip if we don't have object permission data for this parent
                if (!objPerm) {
                    console.log(`[FieldSecurityService] Skipping field permission for parent ${parentId} - no object permission data`);
                    continue;
                }
                
                // Use field-level permissions (they override object-level)
                const effectiveRead = fieldPerm.PermissionsRead;
                const effectiveEdit = fieldPerm.PermissionsEdit;
                
                // Determine source type and name from the object permission parent information (which has correct profile names)
                let source = '';
                let sourceType = '';
                
                if (objPerm?.Parent?.IsOwnedByProfile || objPerm?.Parent?.Type === 'Profile') {
                    source = objPerm.Parent?.Profile?.Name || objPerm.Parent?.Name || 'Unknown Profile';
                    sourceType = 'profile';
                } else if (objPerm?.Parent?.Type === 'Group') {
                    // This might be a Permission Set Group
                    source = objPerm?.Parent?.Name || objPerm?.Parent?.Label || 'Unknown Permission Set Group';
                    sourceType = 'psg';
                } else if (!objPerm?.Parent?.IsOwnedByProfile && objPerm?.Parent?.Type !== 'Profile') {
                    // Only treat as permission set if it's not owned by profile
                    source = objPerm?.Parent?.Name || objPerm?.Parent?.Label || 'Unknown Permission Set';
                    sourceType = 'permission-set';
                } else {
                    // Skip this record - it's a profile-based permission set that shouldn't be displayed separately
                    continue;
                }
                
                effectivePermissions.push({
                    parentId: parentId,
                    permissionsRead: effectiveRead,
                    permissionsEdit: effectiveEdit,
                    source: source,
                    sourceType: sourceType,
                    isFieldOverride: true
                });
            }
            
            console.log(`[FieldSecurityService] Step 4 complete: Calculated ${effectivePermissions.length} effective permissions`);

            // Step 5: Find PSGs that contain permission sets with field permissions
            const grantingPsIds = effectivePermissions
                .filter(perm => perm.sourceType === 'permission-set')
                .map(perm => perm.parentId);

            console.log(`[FieldSecurityService] Found ${grantingPsIds.length} permission sets to check for PSG membership`);

            let psgs: any[] = [];
            if (grantingPsIds.length > 0) {
                try {
                    // Get PSG components for these permission sets
                    console.log(`[FieldSecurityService] Step 5: Querying PSG components for ${grantingPsIds.length} permission sets`);
                    const psgComponents = await this.queryService.getPermissionSetGroupSelector().selectComponentsByPermissionSetIds(grantingPsIds);
                    console.log(`[FieldSecurityService] Step 5 complete: Retrieved ${psgComponents.length} PSG components`);
                    
                    // Get unique PSG IDs and details
                    const psgIds = [...new Set(psgComponents.map(comp => comp.PermissionSetGroupId))];
                    console.log(`[FieldSecurityService] Step 6: Found ${psgIds.length} unique PSGs`);
                    
                    const psgDetails = await this.queryService.getPermissionSetGroupSelector().selectById(psgIds);
                    console.log(`[FieldSecurityService] Step 6 complete: Retrieved ${psgDetails.length} PSG details`);

                    // Create PSG structures with members
                    for (const psgDetail of psgDetails) {
                        // Get components for this PSG
                        const componentsForThisPsg = psgComponents.filter(comp => comp.PermissionSetGroupId === psgDetail.Id);
                        
                        // Create members array
                        const members: any[] = [];
                        for (const comp of componentsForThisPsg) {
                            // Find the permission set in effective permissions
                            const perm = effectivePermissions.find(p => p.parentId === comp.PermissionSetId);
                            
                            // Create member object
                            const member = {
                                id: comp.PermissionSetId,
                                name: perm ? perm.source : 'Unknown Permission Set',
                                read: perm ? perm.permissionsRead : false,
                                edit: perm ? perm.permissionsEdit : false
                            };
                            
                            members.push(member);
                        }

                        psgs.push({
                            id: psgDetail.Id,
                            name: psgDetail.MasterLabel,
                            members
                        });
                        console.log(`[FieldSecurityService] Created PSG: ${psgDetail.MasterLabel} with ${members.length} members`);
                    }

                    // Step 7: Find profiles that have these PSGs assigned and add effective permissions
                    console.log(`[FieldSecurityService] Step 7: Finding profiles with PSG assignments`);
                    if (psgIds.length > 0) {
                        const psgAssignments = await this.queryService.getPermissionSetGroupSelector().selectAssignmentsByGroupIds(psgIds);
                        console.log(`[FieldSecurityService] Step 7 complete: Retrieved ${psgAssignments.length} PSG assignments`);
                        
                        // Get unique profile IDs from assignments
                        const profileIds = [...new Set(psgAssignments.map(assignment => assignment.AssigneeId))];
                        console.log(`[FieldSecurityService] Found ${profileIds.length} profiles with PSG assignments`);
                        
                        if (profileIds.length > 0) {
                            // Get profile details
                            const profiles = await this.queryService.getUserSelector().selectProfilesByIds(profileIds);
                            console.log(`[FieldSecurityService] Retrieved ${profiles.length} profile details`);
                            
                            // For each PSG, find the permission sets with field permissions and add effective permissions for assigned profiles
                            for (const psgDetail of psgDetails) {
                                const psgAssignmentsForGroup = psgAssignments.filter(assignment => assignment.PermissionSetGroupId === psgDetail.Id);
                                const psgComponentsForGroup = psgComponents.filter(comp => comp.PermissionSetGroupId === psgDetail.Id);
                                
                                // Find permission sets in this PSG that have field permissions
                                const psWithFieldPerms = psgComponentsForGroup
                                    .map(comp => effectivePermissions.find(perm => perm.parentId === comp.PermissionSetId))
                                    .filter(perm => perm != null);
                                
                                if (psWithFieldPerms.length > 0) {
                                    // Get the maximum permissions from the permission sets in this PSG
                                    const maxRead = psWithFieldPerms.some(perm => perm.permissionsRead);
                                    const maxEdit = psWithFieldPerms.some(perm => perm.permissionsEdit);
                                    
                                    // Add effective permissions for each profile assigned to this PSG
                                    for (const assignment of psgAssignmentsForGroup) {
                                        const profile = profiles.find(p => p.Id === assignment.AssigneeId);
                                        if (profile) {
                                            effectivePermissions.push({
                                                parentId: assignment.AssigneeId,
                                                permissionsRead: maxRead,
                                                permissionsEdit: maxEdit,
                                                source: profile.Name || 'Unknown Profile',
                                                sourceType: 'psg',
                                                isFieldOverride: false,
                                                viaPSG: psgDetail.MasterLabel
                                            });
                                            console.log(`[FieldSecurityService] Added effective permission for profile ${profile.Name} via PSG ${psgDetail.MasterLabel}`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('[FieldSecurityService] PSG aggregation failed:', error);
                    console.error('[FieldSecurityService] Error details:', (error as Error).message);
                }
            }

            console.log(`[FieldSecurityService] getFieldSecurityForObject complete: ${effectivePermissions.length} permissions, ${psgs.length} PSGs`);
            return { fieldPermissions: effectivePermissions, psgs };
        } catch (error) {
            console.error('[FieldSecurityService] getFieldSecurityForObject failed with error:', error);
            console.error('[FieldSecurityService] Error message:', (error as Error).message);
            console.error('[FieldSecurityService] Error stack:', (error as Error).stack);
            throw error;
        }
    }

    async getQueryableSObjects() {
        return await this.queryService.getEntityDefinitionSelector().selectQueryableSObjects();
    }

    async getOrgWideDefaults(objectName: string) {
        return await this.queryService.getEntityDefinitionSelector().selectOrgWideDefaults(objectName);
    }
}