/**
 * Domain class for PermissionSetGroup records
 * Encapsulates business logic for working with permission set groups
 */
export class PermissionSetGroups {
    private records: any[];

    constructor(recordList: any[]) {
        this.records = recordList || [];
    }

    /**
     * Factory method to create a new PermissionSetGroups instance
     */
    static newInstance(recordList: any[]): PermissionSetGroups {
        return new PermissionSetGroups(recordList);
    }

    /**
     * Get all group records
     */
    getRecords(): any[] {
        return this.records;
    }

    /**
     * Get groups as a map keyed by ID
     */
    getGroupsMap(): Map<string, any> {
        const map = new Map<string, any>();
        for (const group of this.records) {
            map.set(group.Id, group);
        }
        return map;
    }

    /**
     * Get group IDs
     */
    getGroupIds(): string[] {
        return this.records.map(g => g.Id);
    }

    /**
     * Get group by ID
     */
    getGroupById(groupId: string): any | undefined {
        return this.records.find(g => g.Id === groupId);
    }

    /**
     * Get groups by IDs
     */
    getGroupsByIds(groupIds: string[]): any[] {
        const idSet = new Set(groupIds);
        return this.records.filter(g => idSet.has(g.Id));
    }

    /**
     * Get group members count for each group
     */
    getGroupWithMembersCount(): any[] {
        return this.records.map(g => ({
            ...g,
            memberCount: (g.PermissionSetGroupComponents?.records || []).length
        }));
    }

    /**
     * Extract unique member permission set IDs from all groups
     */
    getUniqueMemberPermissionSetIds(): string[] {
        const memberIds = new Set<string>();
        for (const group of this.records) {
            const components = group.PermissionSetGroupComponents?.records || [];
            for (const component of components) {
                memberIds.add(component.PermissionSetId);
            }
        }
        return Array.from(memberIds);
    }

    /**
     * Get count of groups
     */
    count(): number {
        return this.records.length;
    }

    /**
     * Aggregate ObjectPermissions from member permission sets for a specific SObject
     * Returns Permission Set Groups enhanced with aggregated permissions from their member permission sets
     */
    aggregatePermissionsForGroups(psgComponents: any[], permissionSets: any[]): any[] {
        // Create a map of permission sets keyed by PermissionSetId for quick lookup
        const psMap = new Map<string, any>();
        for (const ps of permissionSets) {
            // Extract the PermissionSetId from the Parent if it exists
            const psId = ps.ParentId;
            if (psId) {
                psMap.set(psId, ps);
            }
        }

        // Create a map of components grouped by PermissionSetGroupId
        const componentsByGroupId = new Map<string, any[]>();
        for (const component of psgComponents) {
            if (!componentsByGroupId.has(component.PermissionSetGroupId)) {
                componentsByGroupId.set(component.PermissionSetGroupId, []);
            }
            componentsByGroupId.get(component.PermissionSetGroupId)!.push(component);
        }

        // Build result array of groups with aggregated permissions
        const result: any[] = [];
        for (const group of this.records) {
            const groupComponents = componentsByGroupId.get(group.Id) || [];
            
            if (groupComponents.length === 0) {
                // Skip groups with no components related to our permission sets
                continue;
            }

            // Aggregate permissions from all member permission sets
            const aggregatedPerms: any = {
                PermissionSetGroupId: group.Id,
                PermissionSetGroupName: group.DeveloperName,
                PermissionSetGroupLabel: group.MasterLabel,
                Read: false,
                Create: false,
                Edit: false,
                Delete: false,
                ViewAllRecords: false,
                ModifyAllRecords: false,
                ViewAllFields: false,
                memberPermissionSets: [] as any[]
            };

            for (const component of groupComponents) {
                const memberPs = psMap.get(component.PermissionSetId);
                if (memberPs) {
                    // Aggregate permission flags using OR logic
                    aggregatedPerms.Read = aggregatedPerms.Read || memberPs.PermissionsRead === true;
                    aggregatedPerms.Create = aggregatedPerms.Create || memberPs.PermissionsCreate === true;
                    aggregatedPerms.Edit = aggregatedPerms.Edit || memberPs.PermissionsEdit === true;
                    aggregatedPerms.Delete = aggregatedPerms.Delete || memberPs.PermissionsDelete === true;
                    aggregatedPerms.ViewAllRecords = aggregatedPerms.ViewAllRecords || memberPs.PermissionsViewAllRecords === true;
                    aggregatedPerms.ModifyAllRecords = aggregatedPerms.ModifyAllRecords || memberPs.PermissionsModifyAllRecords === true;
                    aggregatedPerms.ViewAllFields = aggregatedPerms.ViewAllFields || memberPs.PermissionsViewAllFields === true;

                    // Track which permission sets are in this group
                    aggregatedPerms.memberPermissionSets.push({
                        PermissionSetId: component.PermissionSetId,
                        PermissionSetName: memberPs.Parent?.Name || memberPs.Name,
                        PermissionSetLabel: memberPs.Parent?.Label || memberPs.Label
                    });
                }
            }

            result.push(aggregatedPerms);
        }

        return result;
    }
}
