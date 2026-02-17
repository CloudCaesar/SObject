import { PermissionQueryService } from './PermissionQueryService';
import { PermissionDomainService } from '../domain/PermissionDomainService';
import * as SalesforceHandler from '../handlers/salesforceHandler';

export class ObjectPermissionsService {
    private queryService: PermissionQueryService;
    private domainService: PermissionDomainService;

    constructor() {
        this.queryService = new PermissionQueryService();
        this.domainService = new PermissionDomainService();
    }

    async initialize(): Promise<void> {
        await this.queryService.initialize();
    }

    async getObjectPermissionsWithGroups(objectName: string) {
        // Get object permissions
        const objectPermRecords = await this.queryService.getObjectPermissionsSelector().selectBySObjectType(objectName);

        // Get all permission set groups
        let groupPermissions: any[] = [];
        try {
            const connection = await SalesforceHandler.getSalesforceConnection();
            const query = `SELECT Id, DeveloperName, MasterLabel FROM PermissionSetGroup LIMIT 1000`;
            const result = await connection.query(query);
            
            groupPermissions = result.records.map((psg: any) => ({
                Parent: {
                    Name: psg.DeveloperName,
                    Label: psg.MasterLabel,
                    IsCustom: true,
                    Description: `Permission Set Group`,
                    IsOwnedByProfile: false
                },
                PermissionsRead: false, // Not aggregating permissions for SObject view
                PermissionsCreate: false,
                PermissionsEdit: false,
                PermissionsDelete: false,
                PermissionsViewAllRecords: false,
                PermissionsModifyAllRecords: false,
                PermissionsViewAllFields: false,
                fromGroup: true
            }));
        } catch (error) {
            console.log('Permission set groups not available:', (error as Error).message);
        }

        // Combine regular permissions with group permissions
        const allPermissions = [...objectPermRecords, ...groupPermissions];

        return allPermissions.filter(perm => perm.Parent); // Filter out null parents
    }

    async getAllPermissionSetsForObject(objectName: string): Promise<any[]> {
        const objectPermRecords = await this.queryService.getObjectPermissionsSelector().selectBySObjectType(objectName);
        
        // Initialize perm variable for clarity
        let perm: any;
        
        // Step 1: Filter out records with null/undefined parents
        const recordsWithParents = objectPermRecords.filter((currentRecord) => {
            perm = currentRecord; // Assign to our initialized variable
            return perm.Parent;
        });
        
        // Step 2: Filter out profile permissions (profiles have IsOwnedByProfile = true)
        const nonProfileRecords = recordsWithParents.filter((currentRecord) => {
            perm = currentRecord; // Assign to our initialized variable
            return !perm.Parent.IsOwnedByProfile;
        });
        
        // Step 3: Filter out permission set group records (PSGs have Type = "Group")
        const permissionSetRecords = nonProfileRecords.filter((currentRecord) => {
            perm = currentRecord; // Assign to our initialized variable
            return perm.Parent.Type !== "Group";
        });
        
        // Step 4: Only include permission sets that actually grant permissions
        const permissionSetsWithPermissions = permissionSetRecords.filter((currentRecord) => {
            perm = currentRecord; // Assign to our initialized variable
            return perm.PermissionsRead || 
                   perm.PermissionsCreate || 
                   perm.PermissionsEdit || 
                   perm.PermissionsDelete ||
                   perm.PermissionsViewAllRecords ||
                   perm.PermissionsModifyAllRecords ||
                   perm.PermissionsViewAllFields;
        });
        
        // Result: Only permission sets with direct permissions on the object that grant access
        return permissionSetsWithPermissions;
    }

    async getAllPermissionSetGroupsForObject(objectName: string): Promise<any[]> {
        // Get object permissions
        const objectPermRecords = await this.queryService.getObjectPermissionsSelector().selectBySObjectType(objectName);
        const objectPermissions = PermissionDomainService.newObjectPermissions(objectPermRecords);

        // Get permission set groups that have permissions on this object
        const parentIds = objectPermissions.getUniqueParentIds();
        const nonProfileParentIds = parentIds.filter(id => {
            const perm = objectPermRecords.find(r => r.ParentId === id);
            return perm && !perm.Parent?.IsOwnedByProfile;
        });

        let groupPermissions: any[] = [];
        if (nonProfileParentIds.length > 0) {
            try {
                // Get PSG components for these permission sets
                const psgComponents = await this.queryService.getPermissionSetGroupSelector().selectComponentsByPermissionSetIds(nonProfileParentIds);
                
                // Get unique PSG IDs
                const psgIds = [...new Set(psgComponents.map(c => c.PermissionSetGroupId))];
                
                // Get PSG records
                const psgRecords = await this.queryService.getPermissionSetGroupSelector().selectById(psgIds);

                // For each PSG, aggregate permissions from its member permission sets that have permissions on this object
                for (const psgRecord of psgRecords) {
                    const psgId = psgRecord.Id;
                    
                    // Get all member permission sets for this PSG that have permissions on the object
                    const memberComponents = psgComponents.filter(c => c.PermissionSetGroupId === psgId);
                    const memberPsIds = memberComponents.map(c => c.PermissionSetId);

                    // Get member permission sets with their permissions
                    const memberPermissions = memberPsIds.map(memberPsId => {
                        const memberPerm = objectPermissions.getPermissionsMap().get(memberPsId);
                        if (memberPerm) {
                            return {
                                ...memberPerm,
                                memberPermissionSetName: memberPerm.Parent?.Name || memberPerm.Parent?.Label
                            };
                        }
                        return null;
                    }).filter(Boolean);

                    // Aggregate permissions from member permission sets
                    let aggregatedPerms = {
                        PermissionsRead: false,
                        PermissionsCreate: false,
                        PermissionsEdit: false,
                        PermissionsDelete: false,
                        PermissionsViewAllRecords: false,
                        PermissionsModifyAllRecords: false,
                        PermissionsViewAllFields: false
                    };

                    for (const memberPerm of memberPermissions) {
                        if (memberPerm) {
                            aggregatedPerms.PermissionsRead = aggregatedPerms.PermissionsRead || memberPerm.PermissionsRead;
                            aggregatedPerms.PermissionsCreate = aggregatedPerms.PermissionsCreate || memberPerm.PermissionsCreate;
                            aggregatedPerms.PermissionsEdit = aggregatedPerms.PermissionsEdit || memberPerm.PermissionsEdit;
                            aggregatedPerms.PermissionsDelete = aggregatedPerms.PermissionsDelete || memberPerm.PermissionsDelete;
                            aggregatedPerms.PermissionsViewAllRecords = aggregatedPerms.PermissionsViewAllRecords || memberPerm.PermissionsViewAllRecords;
                            aggregatedPerms.PermissionsModifyAllRecords = aggregatedPerms.PermissionsModifyAllRecords || memberPerm.PermissionsModifyAllRecords;
                            aggregatedPerms.PermissionsViewAllFields = aggregatedPerms.PermissionsViewAllFields || memberPerm.PermissionsViewAllFields;
                        }
                    }

                    // Create a permission record for the group
                    const groupPerm = {
                        Parent: {
                            Name: psgRecord.DeveloperName,
                            Label: psgRecord.MasterLabel,
                            IsCustom: true,
                            Description: `Permission Set Group`,
                            IsOwnedByProfile: false
                        },
                        PermissionsRead: aggregatedPerms.PermissionsRead,
                        PermissionsCreate: aggregatedPerms.PermissionsCreate,
                        PermissionsEdit: aggregatedPerms.PermissionsEdit,
                        PermissionsDelete: aggregatedPerms.PermissionsDelete,
                        PermissionsViewAllRecords: aggregatedPerms.PermissionsViewAllRecords,
                        PermissionsModifyAllRecords: aggregatedPerms.PermissionsModifyAllRecords,
                        PermissionsViewAllFields: aggregatedPerms.PermissionsViewAllFields,
                        fromGroup: true,
                        memberPermissions: memberPermissions // Include member permissions for expandable sections
                    };

                    groupPermissions.push(groupPerm);
                }
            } catch (error) {
                console.log('Permission set groups not available:', (error as Error).message);
            }
        }

        return groupPermissions.filter(perm => perm.Parent);
    }

    async getAllProfilePermissionsForObject(objectName: string): Promise<any[]> {
        const objectPermRecords = await this.queryService.getObjectPermissionsSelector().selectBySObjectType(objectName);

        // Get profile permissions that actually grant access
        const profilePerms = objectPermRecords.filter(perm =>
            perm.Parent &&
            perm.Parent.IsOwnedByProfile &&
            (perm.PermissionsRead ||
             perm.PermissionsCreate ||
             perm.PermissionsEdit ||
             perm.PermissionsDelete ||
             perm.PermissionsViewAllRecords ||
             perm.PermissionsModifyAllRecords ||
             perm.PermissionsViewAllFields)
        );

        // Debug: Print Parent.Profile.Name for all profile permissions
        console.log('Profile permissions found:');
        profilePerms.forEach(perm => {
            console.log(`- ParentId: ${perm.ParentId}, Parent.Profile.Name: ${perm.Parent?.Profile?.Name || 'undefined'}`);
        });

        // Update profile permissions with names from Parent.Profile.Name
        return profilePerms.map(perm => ({
            ...perm,
            Parent: {
                ...perm.Parent,
                Name: perm.Parent?.Profile?.Name || perm.Parent?.Name || 'Unknown Profile'
            }
        }));
    }

    async getOrgWideDefaults(objectName: string) {
        return await this.queryService.getEntityDefinitionSelector().selectOrgWideDefaults(objectName);
    }

    async getQueryableSObjects() {
        return await this.queryService.getEntityDefinitionSelector().selectQueryableSObjects();
    }
}