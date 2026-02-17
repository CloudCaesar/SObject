import * as assert from 'assert';
import { PermissionSetGroups } from '../../src/domain/PermissionSetGroups';

describe('PermissionSetGroups', () => {
    let permissionSetGroups: PermissionSetGroups;
    let mockRecords: any[];

    beforeEach(() => {
        mockRecords = [
            {
                Id: 'psg1',
                DeveloperName: 'Test_Group_1',
                MasterLabel: 'Test Group 1',
                PermissionSetGroupComponents: {
                    records: [
                        { PermissionSetId: 'ps1' },
                        { PermissionSetId: 'ps2' }
                    ]
                }
            },
            {
                Id: 'psg2',
                DeveloperName: 'Test_Group_2',
                MasterLabel: 'Test Group 2',
                PermissionSetGroupComponents: {
                    records: [
                        { PermissionSetId: 'ps3' }
                    ]
                }
            },
            {
                Id: 'psg3',
                DeveloperName: 'Empty_Group',
                MasterLabel: 'Empty Group',
                PermissionSetGroupComponents: {
                    records: []
                }
            }
        ];
        permissionSetGroups = new PermissionSetGroups(mockRecords);
    });

    describe('constructor', () => {
        it('should create instance with provided records', () => {
            // Assert
            assert.strictEqual(permissionSetGroups.getRecords().length, 3);
            assert.deepStrictEqual(permissionSetGroups.getRecords(), mockRecords);
        });

        it('should handle empty record list', () => {
            // Act
            const emptyGroups = new PermissionSetGroups([]);

            // Assert
            assert.strictEqual(emptyGroups.getRecords().length, 0);
        });

        it('should handle null record list', () => {
            // Act
            const nullGroups = new PermissionSetGroups(null as any);

            // Assert
            assert.strictEqual(nullGroups.getRecords().length, 0);
        });
    });

    describe('newInstance', () => {
        it('should create new instance using factory method', () => {
            // Act
            const instance = PermissionSetGroups.newInstance(mockRecords);

            // Assert
            assert.ok(instance instanceof PermissionSetGroups);
            assert.strictEqual(instance.getRecords().length, 3);
        });
    });

    describe('getRecords', () => {
        it('should return all group records', () => {
            // Act
            const records = permissionSetGroups.getRecords();

            // Assert
            assert.strictEqual(records.length, 3);
            assert.deepStrictEqual(records, mockRecords);
        });
    });

    describe('getGroupsMap', () => {
        it('should return groups mapped by ID', () => {
            // Act
            const map = permissionSetGroups.getGroupsMap();

            // Assert
            assert.ok(map instanceof Map);
            assert.strictEqual(map.size, 3);
            assert.ok(map.has('psg1'));
            assert.ok(map.has('psg2'));
            assert.ok(map.has('psg3'));
            assert.strictEqual(map.get('psg1').DeveloperName, 'Test_Group_1');
        });
    });

    describe('getGroupIds', () => {
        it('should return all group IDs', () => {
            // Act
            const ids = permissionSetGroups.getGroupIds();

            // Assert
            assert.strictEqual(ids.length, 3);
            assert.ok(ids.includes('psg1'));
            assert.ok(ids.includes('psg2'));
            assert.ok(ids.includes('psg3'));
        });
    });

    describe('getGroupById', () => {
        it('should return group for existing ID', () => {
            // Act
            const group = permissionSetGroups.getGroupById('psg1');

            // Assert
            assert.ok(group);
            assert.strictEqual(group.Id, 'psg1');
            assert.strictEqual(group.DeveloperName, 'Test_Group_1');
        });

        it('should return undefined for non-existing ID', () => {
            // Act
            const group = permissionSetGroups.getGroupById('nonexistent');

            // Assert
            assert.strictEqual(group, undefined);
        });
    });

    describe('getGroupsByIds', () => {
        it('should return groups for specified IDs', () => {
            // Act
            const groups = permissionSetGroups.getGroupsByIds(['psg1', 'psg3']);

            // Assert
            assert.strictEqual(groups.length, 2);
            assert.ok(groups.some(g => g.Id === 'psg1'));
            assert.ok(groups.some(g => g.Id === 'psg3'));
            assert.ok(!groups.some(g => g.Id === 'psg2'));
        });

        it('should return empty array for non-existing IDs', () => {
            // Act
            const groups = permissionSetGroups.getGroupsByIds(['nonexistent']);

            // Assert
            assert.strictEqual(groups.length, 0);
        });

        it('should handle empty IDs array', () => {
            // Act
            const groups = permissionSetGroups.getGroupsByIds([]);

            // Assert
            assert.strictEqual(groups.length, 0);
        });
    });

    describe('getGroupWithMembersCount', () => {
        it('should return groups with member counts', () => {
            // Act
            const groupsWithCount = permissionSetGroups.getGroupWithMembersCount();

            // Assert
            assert.strictEqual(groupsWithCount.length, 3);

            const group1 = groupsWithCount.find(g => g.Id === 'psg1');
            assert.ok(group1);
            assert.strictEqual(group1.memberCount, 2);

            const group2 = groupsWithCount.find(g => g.Id === 'psg2');
            assert.ok(group2);
            assert.strictEqual(group2.memberCount, 1);

            const group3 = groupsWithCount.find(g => g.Id === 'psg3');
            assert.ok(group3);
            assert.strictEqual(group3.memberCount, 0);
        });

        it('should handle groups without PermissionSetGroupComponents', () => {
            // Arrange
            const recordsWithoutComponents = [
                { Id: 'psg1', DeveloperName: 'Test_Group' } // No PermissionSetGroupComponents
            ];
            const groupsWithoutComponents = new PermissionSetGroups(recordsWithoutComponents);

            // Act
            const groupsWithCount = groupsWithoutComponents.getGroupWithMembersCount();

            // Assert
            assert.strictEqual(groupsWithCount.length, 1);
            assert.strictEqual(groupsWithCount[0].memberCount, 0);
        });
    });

    describe('getUniqueMemberPermissionSetIds', () => {
        it('should return unique member permission set IDs from all groups', () => {
            // Act
            const memberIds = permissionSetGroups.getUniqueMemberPermissionSetIds();

            // Assert
            assert.strictEqual(memberIds.length, 3);
            assert.ok(memberIds.includes('ps1'));
            assert.ok(memberIds.includes('ps2'));
            assert.ok(memberIds.includes('ps3'));
        });

        it('should handle groups without components', () => {
            // Arrange
            const recordsWithoutComponents = [
                { Id: 'psg1', DeveloperName: 'Test_Group' } // No PermissionSetGroupComponents
            ];
            const groupsWithoutComponents = new PermissionSetGroups(recordsWithoutComponents);

            // Act
            const memberIds = groupsWithoutComponents.getUniqueMemberPermissionSetIds();

            // Assert
            assert.strictEqual(memberIds.length, 0);
        });

        it('should handle empty groups', () => {
            // Arrange
            const emptyGroups = new PermissionSetGroups([]);

            // Act
            const memberIds = emptyGroups.getUniqueMemberPermissionSetIds();

            // Assert
            assert.strictEqual(memberIds.length, 0);
        });
    });

    describe('count', () => {
        it('should return the number of group records', () => {
            // Act
            const count = permissionSetGroups.count();

            // Assert
            assert.strictEqual(count, 3);
        });

        it('should return 0 for empty groups', () => {
            // Arrange
            const emptyGroups = new PermissionSetGroups([]);

            // Act
            const count = emptyGroups.count();

            // Assert
            assert.strictEqual(count, 0);
        });
    });

    describe('aggregatePermissionsForGroups', () => {
        it('should aggregate permissions from member permission sets', () => {
            // Arrange
            const psgComponents = [
                { PermissionSetGroupId: 'psg1', PermissionSetId: 'ps1' },
                { PermissionSetGroupId: 'psg1', PermissionSetId: 'ps2' },
                { PermissionSetGroupId: 'psg2', PermissionSetId: 'ps3' }
            ];

            const permissionSets = [
                {
                    ParentId: 'ps1',
                    PermissionsRead: true,
                    PermissionsCreate: false,
                    PermissionsEdit: true,
                    PermissionsDelete: false,
                    PermissionsViewAllRecords: false,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: true,
                    Parent: { Name: 'Permission Set 1', Label: 'PS 1' }
                },
                {
                    ParentId: 'ps2',
                    PermissionsRead: false,
                    PermissionsCreate: true,
                    PermissionsEdit: false,
                    PermissionsDelete: true,
                    PermissionsViewAllRecords: true,
                    PermissionsModifyAllRecords: false,
                    PermissionsViewAllFields: false,
                    Parent: { Name: 'Permission Set 2', Label: 'PS 2' }
                },
                {
                    ParentId: 'ps3',
                    PermissionsRead: true,
                    PermissionsCreate: true,
                    PermissionsEdit: true,
                    PermissionsDelete: true,
                    PermissionsViewAllRecords: true,
                    PermissionsModifyAllRecords: true,
                    PermissionsViewAllFields: true,
                    Parent: { Name: 'Permission Set 3', Label: 'PS 3' }
                }
            ];

            // Act
            const aggregated = permissionSetGroups.aggregatePermissionsForGroups(psgComponents, permissionSets);

            // Assert
            assert.strictEqual(aggregated.length, 2); // psg3 has no components in psgComponents

            // Check first group (psg1)
            const group1 = aggregated.find(g => g.PermissionSetGroupId === 'psg1');
            assert.ok(group1);
            assert.strictEqual(group1.PermissionSetGroupName, 'Test_Group_1');
            assert.strictEqual(group1.Read, true); // ps1 has read
            assert.strictEqual(group1.Create, true); // ps2 has create
            assert.strictEqual(group1.Edit, true); // ps1 has edit
            assert.strictEqual(group1.Delete, true); // ps2 has delete
            assert.strictEqual(group1.ViewAllRecords, true); // ps2 has view all
            assert.strictEqual(group1.ModifyAllRecords, false);
            assert.strictEqual(group1.ViewAllFields, true); // ps1 has view all fields
            assert.strictEqual(group1.memberPermissionSets.length, 2);

            // Check second group (psg2)
            const group2 = aggregated.find(g => g.PermissionSetGroupId === 'psg2');
            assert.ok(group2);
            assert.strictEqual(group2.Read, true);
            assert.strictEqual(group2.Create, true);
            assert.strictEqual(group2.Edit, true);
            assert.strictEqual(group2.Delete, true);
            assert.strictEqual(group2.ViewAllRecords, true);
            assert.strictEqual(group2.ModifyAllRecords, true);
            assert.strictEqual(group2.ViewAllFields, true);
            assert.strictEqual(group2.memberPermissionSets.length, 1);
        });

        it('should skip groups with no components', () => {
            // Arrange
            const psgComponents: any[] = [];
            const permissionSets: any[] = [];

            // Act
            const aggregated = permissionSetGroups.aggregatePermissionsForGroups(psgComponents, permissionSets);

            // Assert
            assert.strictEqual(aggregated.length, 0);
        });

        it('should handle permission sets without Parent property', () => {
            // Arrange
            const psgComponents = [
                { PermissionSetGroupId: 'psg1', PermissionSetId: 'ps1' }
            ];

            const permissionSets = [
                {
                    ParentId: 'ps1',
                    PermissionsRead: true,
                    Name: 'Fallback Name',
                    Label: 'Fallback Label'
                    // No Parent property
                }
            ];

            // Act
            const aggregated = permissionSetGroups.aggregatePermissionsForGroups(psgComponents, permissionSets);

            // Assert
            assert.strictEqual(aggregated.length, 1);
            assert.strictEqual(aggregated[0].memberPermissionSets[0].PermissionSetName, 'Fallback Name');
            assert.strictEqual(aggregated[0].memberPermissionSets[0].PermissionSetLabel, 'Fallback Label');
        });
    });
});