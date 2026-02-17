import { Users } from './Users';
import { ObjectPermissions } from './ObjectPermissions';
import { FieldPermissions } from './FieldPermissions';
import { PermissionSets } from './PermissionSets';
import { PermissionSetGroups } from './PermissionSetGroups';

/**
 * Domain service to coordinate all domain classes
 * Provides factory methods and business logic orchestration
 */
export class PermissionDomainService {
    /**
     * Create a Users domain instance
     */
    static newUsers(recordList: any[]): Users {
        return Users.newInstance(recordList);
    }

    /**
     * Create an ObjectPermissions domain instance
     */
    static newObjectPermissions(recordList: any[]): ObjectPermissions {
        return ObjectPermissions.newInstance(recordList);
    }

    /**
     * Create a FieldPermissions domain instance
     */
    static newFieldPermissions(recordList: any[]): FieldPermissions {
        return FieldPermissions.newInstance(recordList);
    }

    /**
     * Create a PermissionSets domain instance
     */
    static newPermissionSets(recordList: any[]): PermissionSets {
        return PermissionSets.newInstance(recordList);
    }

    /**
     * Create a PermissionSetGroups domain instance
     */
    static newPermissionSetGroups(recordList: any[]): PermissionSetGroups {
        return PermissionSetGroups.newInstance(recordList);
    }

    /**
     * Calculate effective permissions combining object-level and field-level permissions
     * @param objectPerms - Object-level permissions
     * @param fieldPerms - Field-level permissions (may override object-level)
     * @returns Array of effective permissions with override flags
     */
    static calculateEffectivePermissions(objectPerms: any[], fieldPerms: any[]): any[] {
        const fieldPermMap = new Map<string, any>();
        for (const fp of fieldPerms) {
            fieldPermMap.set(fp.ParentId, fp);
        }

        const effectivePermissions = [];
        for (const op of objectPerms) {
            const parentId = op.ParentId;
            const fieldPerm = fieldPermMap.get(parentId);

            const effectiveRead = fieldPerm ? fieldPerm.PermissionsRead : op.PermissionsRead;
            const effectiveEdit = fieldPerm ? fieldPerm.PermissionsEdit : op.PermissionsEdit;

            effectivePermissions.push({
                ...op,
                PermissionsRead: effectiveRead,
                PermissionsEdit: effectiveEdit,
                isFieldOverride: !!fieldPerm
            });
        }

        return effectivePermissions;
    }

    /**
     * Group permissions by source type (profile, permission set, permission set group)
     */
    static groupPermissionsBySourceType(permissions: any[]): Map<string, any[]> {
        const grouped = new Map<string, any[]>();

        for (const perm of permissions) {
            const sourceType = perm.Parent?.IsOwnedByProfile ? 'profile' : 'permission-set';
            if (!grouped.has(sourceType)) {
                grouped.set(sourceType, []);
            }
            grouped.get(sourceType)!.push(perm);
        }

        return grouped;
    }

    /**
     * Flatten PSG component records into a usable structure
     */
    static flattenPsgComponents(psgRecords: any[]): any[] {
        const flattened: any[] = [];
        for (const psg of psgRecords) {
            const components = psg.PermissionSetGroupComponents?.records || [];
            for (const component of components) {
                flattened.push({
                    PermissionSetGroupId: psg.Id,
                    PermissionSetId: component.PermissionSetId,
                    GroupName: psg.MasterLabel,
                    GroupDeveloperName: psg.DeveloperName
                });
            }
        }
        return flattened;
    }
}
