import { PermissionQueryService } from './PermissionQueryService';
import { PermissionDomainService } from '../domain/PermissionDomainService';
import { PermissionSetAssignmentSelector } from '../selectors/PermissionSetAssignmentSelector';
import { PermissionSetAssignment } from '../domain/PermissionSetAssignment';
import { PermissionSetGroupComponentSelector } from '../selectors/PermissionSetGroupComponentSelector';
import { PermissionSetGroupSelector } from '../selectors/PermissionSetGroupSelector';

export class UserPermissionsService {
    private queryService: PermissionQueryService;
    private domainService: PermissionDomainService;
    private psAssignmentSelector: PermissionSetAssignmentSelector;
    private psgComponentSelector: PermissionSetGroupComponentSelector;
    private psgSelector: PermissionSetGroupSelector;

    constructor() {
        this.queryService = new PermissionQueryService();
        this.domainService = new PermissionDomainService();
        this.psAssignmentSelector = new PermissionSetAssignmentSelector();
        this.psgComponentSelector = new PermissionSetGroupComponentSelector();
        this.psgSelector = new PermissionSetGroupSelector();
    }

    async initialize(): Promise<void> {
        console.log('[UserPermissionsService] Starting initialization');
        try {
            console.log('[UserPermissionsService] Initializing queryService...');
            await this.queryService.initialize();
            console.log('[UserPermissionsService] queryService initialized');
            
            console.log('[UserPermissionsService] Initializing psAssignmentSelector...');
            await this.psAssignmentSelector.initialize();
            console.log('[UserPermissionsService] psAssignmentSelector initialized');
            
            console.log('[UserPermissionsService] Initializing psgComponentSelector...');
            await this.psgComponentSelector.initialize();
            console.log('[UserPermissionsService] psgComponentSelector initialized');
            
            console.log('[UserPermissionsService] Initializing psgSelector...');
            await this.psgSelector.initialize();
            console.log('[UserPermissionsService] psgSelector initialized');
            
            console.log('[UserPermissionsService] Initialization complete');
        } catch (error) {
            console.error('[UserPermissionsService] Initialization failed:', error);
            throw error;
        }
    }
     
    async getUserPermissionsForObject(userId: string, objectName: string): Promise<any[]> {
        try {
            console.log(`[UserPermissions] Starting permission analysis for user ${userId} on object ${objectName}`);
            
            // Get all PermissionSetAssignments for the user
            const psAssignments = await this.psAssignmentSelector.selectByUserId(userId);
            console.log(`[UserPermissions] Retrieved ${psAssignments.length} permission set assignments for user ${userId}`);
            
            // Pass to PermissionSetAssignment domain class
            const psAssignmentDomain = PermissionSetAssignment.newInstance(psAssignments);
            
            // Get list of permissionSetIds
            const permissionSetIds = Array.from(psAssignmentDomain.getPermissionSetIds());
            console.log(`[UserPermissions] User ${userId} has ${permissionSetIds.length} unique permission sets assigned`);
            
            if (permissionSetIds.length === 0) {
                console.log(`[UserPermissions] User has no permission sets, returning empty array`);
                return [];
            }
            
            // Get all ObjectPermissions for this specific object
            console.log(`[UserPermissions] Fetching object permissions for ${objectName} from ${permissionSetIds.length} permission sets`);
            const objectPermissions = await this.queryService.getObjectPermissionsSelector().selectByParentIds(permissionSetIds, objectName);
            console.log(`[UserPermissions] Retrieved ${objectPermissions.length} object permissions for ${objectName}`);
            
            if (objectPermissions.length === 0) {
                console.log(`[UserPermissions] No object permissions found for ${objectName}, returning empty array`);
                return [];
            }
            
            // Extract unique permission set IDs from the object permissions (only those with actual permissions on this object)
            const objectPermissionParentIds = [...new Set(objectPermissions.map(op => op.ParentId))];
            console.log(`[UserPermissions] Found ${objectPermissionParentIds.length} permission sets with permissions on ${objectName}`);
            
            // Get only the PermissionSets that have permissions on this object
            console.log(`[UserPermissions] Fetching permission set records for these ${objectPermissionParentIds.length} permission sets`);
            const permissionSetsRecords = await this.queryService.getPermissionSetSelector().selectByIds(objectPermissionParentIds);
            console.log(`[UserPermissions] Retrieved ${permissionSetsRecords.length} permission sets`);
            
            // Use the PermissionSets domain class to aggregate permissions
            const permissionSetsDomain = PermissionDomainService.newPermissionSets(permissionSetsRecords);
            const permissionSetsWithAggregatedPerms = permissionSetsDomain.aggregatePermissionsForObject(objectPermissions, objectName);
            
            // // Create a new domain instance with the aggregated permissions
            // const permissionSetsDomainAggregated = PermissionDomainService.newPermissionSets(permissionSetsWithAggregatedPerms);
            
            // // Get all permission sets for the specific object
            // const permissionSetsForObject = permissionSetsDomainAggregated.getPermissionSetsForObject(objectName);
            
            // console.log(`[UserPermissions] Retrieved ${permissionSetsForObject.length} permission sets for object ${objectName}`);
            
            return permissionSetsWithAggregatedPerms;
        } catch (error) {
            console.error('[UserPermissions] Error in getUserPermissionsForObject:', error);
            throw error;
        }
    }

    async getUserPermissionSetGroupsForObject(userId: string, objectName: string): Promise<any[]> {
        try {
            console.log(`[UserPermissions] Starting permission set group analysis for user ${userId} on object ${objectName}`);
            
            // Get all PermissionSetAssignments for the user
            const psAssignments = await this.psAssignmentSelector.selectByUserId(userId);
            console.log(`[UserPermissions] Retrieved ${psAssignments.length} permission set assignments for user ${userId}`);
            
            // Pass to PermissionSetAssignment domain class
            const psAssignmentDomain = PermissionSetAssignment.newInstance(psAssignments);
            
            // Get list of permissionSetIds
            const permissionSetIds = Array.from(psAssignmentDomain.getPermissionSetIds());
            console.log(`[UserPermissions] User ${userId} has ${permissionSetIds.length} unique permission sets assigned`);
            
            if (permissionSetIds.length === 0) {
                console.log(`[UserPermissions] User has no permission sets, returning empty array`);
                return [];
            }
            
            // Get all ObjectPermissions for this specific object
            console.log(`[UserPermissions] Fetching object permissions for ${objectName} from ${permissionSetIds.length} permission sets`);
            const objectPermissions = await this.queryService.getObjectPermissionsSelector().selectByParentIds(permissionSetIds, objectName);
            console.log(`[UserPermissions] Retrieved ${objectPermissions.length} object permissions for ${objectName}`);
            
            if (objectPermissions.length === 0) {
                console.log(`[UserPermissions] No object permissions found for ${objectName}, returning empty array`);
                return [];
            }
            
            // Extract unique permission set IDs from the object permissions (only those with actual permissions on this object)
            const objectPermissionParentIds = [...new Set(objectPermissions.map(op => op.ParentId))];
            console.log(`[UserPermissions] Found ${objectPermissionParentIds.length} permission sets with permissions on ${objectName}`);
            
            // Get only the PermissionSets that have permissions on this object
            console.log(`[UserPermissions] Fetching permission set records for these ${objectPermissionParentIds.length} permission sets`);
            const permissionSetsRecords = await this.queryService.getPermissionSetSelector().selectByIds(objectPermissionParentIds);
            console.log(`[UserPermissions] Retrieved ${permissionSetsRecords.length} permission sets`);
            
            // Use the PermissionSets domain class to aggregate permissions
            const permissionSetsDomain = PermissionDomainService.newPermissionSets(permissionSetsRecords);
            const permissionSetsWithAggregatedPerms = permissionSetsDomain.aggregatePermissionsForObject(objectPermissions, objectName);
            
            // Get all permissionSetIds that have permissions on this object from the original domain
            const objectPermissionSetIds = Array.from(permissionSetsDomain.getPermissionSetIds());
            console.log(`[UserPermissions] Querying PermissionSetGroupComponents for ${objectPermissionSetIds.length} permission sets with object permissions`);
            console.log(`[UserPermissions] Permission set IDs: ${JSON.stringify(objectPermissionSetIds)}`);
            
            // Filter out any undefined values
            const validPermissionSetIds = objectPermissionSetIds.filter((id: any) => id);
            console.log(`[UserPermissions] Valid permission set IDs after filtering: ${JSON.stringify(validPermissionSetIds)}`);
            
            if (validPermissionSetIds.length === 0) {
                console.log(`[UserPermissions] No valid permission set IDs found, returning empty array`);
                return [];
            }
            
            // Query PermissionSetGroupComponents that share these permissionSetIds
            const psgComponents = await this.psgComponentSelector.selectComponentsByPermissionSetIds(validPermissionSetIds);
            console.log(`[UserPermissions] Retrieved ${psgComponents.length} PermissionSetGroupComponents`);
            
            if (psgComponents.length === 0) {
                console.log(`[UserPermissions] No permission set groups found for user's permission sets, returning empty array`);
                return [];
            }
            
            // Extract unique Permission Set Group IDs from the components
            const psgIds = [...new Set(psgComponents.map(comp => comp.PermissionSetGroupId))];
            console.log(`[UserPermissions] Found ${psgIds.length} Permission Set Groups containing these permission sets`);
            
            // Query the PermissionSetGroup records
            const psgRecords = await this.psgSelector.selectById(psgIds);
            console.log(`[UserPermissions] Retrieved ${psgRecords.length} Permission Set Group records`);
            
            // Create a PermissionSetGroups domain instance and aggregate permissions
            const permissionSetGroupsDomain = PermissionDomainService.newPermissionSetGroups(psgRecords);
            const psgWithAggregatedPerms = permissionSetGroupsDomain.aggregatePermissionsForGroups(psgComponents, permissionSetsWithAggregatedPerms);
            console.log(`[UserPermissions] Aggregated permissions for ${psgWithAggregatedPerms.length} permission set groups`);
            
            return psgWithAggregatedPerms;
        } catch (error) {
            console.error('[UserPermissions] Error in getUserPermissionSetGroupsForObject:', error);
            throw error;
        }
    }

    async getActiveUsers() {
        const userRecords = await this.queryService.getUserSelector().selectActive();
        return PermissionDomainService.newUsers(userRecords);
    }

    async getQueryableSObjects() {
        return await this.queryService.getEntityDefinitionSelector().selectQueryableSObjects();
    }

    async getOrgWideDefaults(objectName: string) {
        try {
            const owdRecord = await this.queryService.getEntityDefinitionSelector().selectOrgWideDefaults(objectName);
            if (owdRecord) {
                console.log(`[UserPermissions] Retrieved org-wide defaults for ${objectName}: ${owdRecord.InternalAccessLevel}/${owdRecord.ExternalAccessLevel}`);
            } else {
                console.log(`[UserPermissions] No org-wide defaults found for ${objectName}`);
            }
            return owdRecord || {};
        } catch (owdError) {
            console.error(`[UserPermissions] Error fetching org-wide defaults for ${objectName}: ${owdError}`);
            return {};
        }
    }

    async getUserProfilePermissionsForObject(userId: string, objectName: string): Promise<any[]> {
        try {
            console.log(`[UserPermissions] Fetching user profile permissions for user ${userId} on object ${objectName}`);
            
            // Get the user record to get their profile
            const userRecords = await this.queryService.getUserSelector().selectById(userId);
            if (!userRecords || userRecords.length === 0) {
                console.log(`[UserPermissions] User not found: ${userId}`);
                return [];
            }
            
            const userRecord = userRecords[0];
            const profileId = userRecord.Profile?.Id;
            const profileName = userRecord.Profile?.Name;
            console.log(`[UserPermissions] User ${userId} has profile: ${profileName} (${profileId})`);
            
            if (!profileName) {
                console.log(`[UserPermissions] Could not determine profile name for user ${userId}`);
                return [];
            }
            
            // Query ObjectPermissions for this profile and object
            const profileObjectPermissions = await this.queryService.getObjectPermissionsSelector().selectByProfileName(profileName, objectName);
            console.log(`[UserPermissions] Retrieved ${profileObjectPermissions.length} profile object permissions for ${objectName}`);
            
            if (profileObjectPermissions.length === 0) {
                console.log(`[UserPermissions] No profile permissions found for ${objectName}`);
                return [];
            }
            
            // Use ObjectPermissions domain to process results
            const objectPermissionsDomain = PermissionDomainService.newObjectPermissions(profileObjectPermissions);
            const profilePermissions = objectPermissionsDomain.getProfilePermissions();
            
            console.log(`[UserPermissions] Retrieved ${profilePermissions.length} profile permissions for ${objectName}`);
            return profileObjectPermissions;
        } catch (error) {
            console.error('[UserPermissions] Error in getUserProfilePermissionsForObject:', error);
            throw error;
        }
    }
}