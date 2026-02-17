export class UserPermissionsComponent {
    private objectName: string;
    private userName: string;
    private permissions: any[];
    private permissionSetGroups: any[];
    private profilePermissions: any;
    private effectiveObject: string;
    private orgWideDefaults: any;

    constructor(props: {
        objectName: string;
        userName: string;
        permissions: any[];
        permissionSetGroups: any[];
        profilePermissions: any;
        effectiveObject?: string;
        orgWideDefaults?: any;
    }) {
        this.objectName = props.objectName;
        this.userName = props.userName;
        this.permissions = props.permissions || [];
        this.permissionSetGroups = props.permissionSetGroups || [];
        this.profilePermissions = props.profilePermissions;
        this.effectiveObject = props.effectiveObject || props.objectName;
        this.orgWideDefaults = props.orgWideDefaults;
    }

    render(): string {
        const psgRows = this.permissionSetGroups.map(group => `
            <tr>
                <td>${group.PermissionSetGroupLabel || group.permissionSetGroupName || group.name || group.Parent?.Name || group.Parent?.Label || 'Unknown'}</td>
                <td>${this.renderPermissionStatus(group.Read)}</td>
                <td>${this.renderPermissionStatus(group.Create)}</td>
                <td>${this.renderPermissionStatus(group.Edit)}</td>
                <td>${this.renderPermissionStatus(group.Delete)}</td>
                <td>${this.renderPermissionStatus(group.ViewAllRecords)}</td>
                <td>${this.renderPermissionStatus(group.ModifyAllRecords)}</td>
            </tr>
        `).join('');

        const permissionSetRows = this.permissions.map(ps => `
            <tr>
                <td>${ps.permissionSetName || ps.name || ps.Parent?.Name || ps.Parent?.Label || 'Unknown'}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsRead)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsCreate)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsEdit)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsDelete)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsViewAllRecords)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsModifyAllRecords)}</td>
            </tr>
        `).join('');

        return `
            <div class="ui container">
                <h2 class="ui header">User Permissions Analysis</h2>
                <div class="ui segment">
                    <h3>User: ${this.userName}</h3>
                    <h4>Object: ${this.objectName}</h4>
                    ${this.effectiveObject !== this.objectName ? `<p><em>Inherited from: ${this.effectiveObject}</em></p>` : ''}
                </div>

                ${this.orgWideDefaults ? `
                <div class="ui segment">
                    <h3 class="ui header">Org-Wide Defaults</h3>
                    <div class="ui grid">
                        <div class="eight wide column">
                            <strong>Default Internal Access:</strong> ${this.orgWideDefaults.InternalSharingModel || 'N/A'}
                        </div>
                        <div class="eight wide column">
                            <strong>Default External Access:</strong> ${this.orgWideDefaults.ExternalSharingModel || 'N/A'}
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="ui four item menu">
                    <a class="item active" data-section="all" onclick="showSection('all')">All</a>
                    <a class="item" data-section="permission-sets" onclick="showSection('permission-sets')">Permission Sets</a>
                    <a class="item" data-section="psg" onclick="showSection('psg')">Permission Set Groups</a>
                    <a class="item" data-section="profiles" onclick="showSection('profiles')">Profiles</a>
                </div>

                <div id="all-section" class="permissions-section">
                    <div class="ui segment">
                        <h3 class="ui header">All Permissions</h3>
                        <table class="ui table">
                            <thead>
                                <tr>
                                    <th>Source</th>
                                    <th>Type</th>
                                    <th>Read</th>
                                    <th>Create</th>
                                    <th>Edit</th>
                                    <th>Delete</th>
                                    <th>View All</th>
                                    <th>Modify All</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.permissionSetGroups.map(group => `
                                    <tr>
                                        <td>${group.PermissionSetGroupLabel || group.permissionSetGroupName || group.name || group.Parent?.Name || group.Parent?.Label || 'Unknown'}</td>
                                        <td>Permission Set Group</td>
                                        <td>${this.renderPermissionStatus(group.Read)}</td>
                                        <td>${this.renderPermissionStatus(group.Create)}</td>
                                        <td>${this.renderPermissionStatus(group.Edit)}</td>
                                        <td>${this.renderPermissionStatus(group.Delete)}</td>
                                        <td>${this.renderPermissionStatus(group.ViewAllRecords)}</td>
                                        <td>${this.renderPermissionStatus(group.ModifyAllRecords)}</td>
                                    </tr>
                                `).join('')}
                                ${this.permissions.map(ps => `
                                    <tr>
                                        <td>${ps.permissionSetName || ps.name || ps.Parent?.Name || ps.Parent?.Label || 'Unknown'}</td>
                                        <td>Permission Set</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsCreate)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsEdit)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsDelete)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsViewAllRecords)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsModifyAllRecords)}</td>
                                    </tr>
                                `).join('')}
                                ${this.profilePermissions ? `
                                    <tr>
                                        <td>${this.userName} Profile</td>
                                        <td>Profile</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions.Read || this.profilePermissions.PermissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions.Create || this.profilePermissions.PermissionsCreate)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions.Edit || this.profilePermissions.PermissionsEdit)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions.Delete || this.profilePermissions.PermissionsDelete)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions.ViewAll || this.profilePermissions.PermissionsViewAllRecords)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions.ModifyAll || this.profilePermissions.PermissionsModifyAllRecords)}</td>
                                    </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="permission-sets-section" class="permissions-section" style="display: none;">
                    ${this.permissions.length > 0 ? `
                    <div class="ui segment">
                        <h3 class="ui header">Permission Sets</h3>
                        <table class="ui table">
                            <thead>
                                <tr>
                                    <th>Permission Set</th>
                                    <th>Read</th>
                                    <th>Create</th>
                                    <th>Edit</th>
                                    <th>Delete</th>
                                    <th>View All</th>
                                    <th>Modify All</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${permissionSetRows}
                            </tbody>
                        </table>
                    </div>
                    ` : `
                    <div class="ui info message">
                        <div class="header">No Permission Sets</div>
                        <p>This user has no permission sets assigned for this object.</p>
                    </div>
                    `}
                </div>

                <div id="psg-section" class="permissions-section" style="display: none;">
                    ${this.permissionSetGroups.length > 0 ? `
                    <div class="ui segment">
                        <h3 class="ui header">Permission Set Groups</h3>
                        <table class="ui table">
                            <thead>
                                <tr>
                                    <th>Permission Set Group</th>
                                    <th>Read</th>
                                    <th>Create</th>
                                    <th>Edit</th>
                                    <th>Delete</th>
                                    <th>View All</th>
                                    <th>Modify All</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${psgRows}
                            </tbody>
                        </table>
                    </div>
                    ` : `
                    <div class="ui info message">
                        <div class="header">No Permission Set Groups</div>
                        <p>This user has no permission set groups assigned for this object.</p>
                    </div>
                    `}
                </div>

                <div id="profiles-section" class="permissions-section" style="display: none;">
                    ${this.profilePermissions && this.profilePermissions.length > 0 ? `
                    <div class="ui segment">
                        <h3 class="ui header">Profile Permissions</h3>
                        <table class="ui table">
                            <thead>
                                <tr>
                                    <th>Permission</th>
                                    <th>Read</th>
                                    <th>Create</th>
                                    <th>Edit</th>
                                    <th>Delete</th>
                                    <th>View All</th>
                                    <th>Modify All</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${this.profilePermissions[0].Parent?.Profile?.Name || 'Unknown Profile'}</td>
                                    <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsRead)}</td>
                                    <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsCreate)}</td>
                                    <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsEdit)}</td>
                                    <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsDelete)}</td>
                                    <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsViewAllRecords)}</td>
                                    <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsModifyAllRecords)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    ` : `
                    <div class="ui info message">
                        <div class="header">No Profile Permissions</div>
                        <p>No profile permissions found for this user and object.</p>
                    </div>
                    `}
                </div>

                <script>
                    // Initialize immediately
                    (function() {
                        console.log('Initializing user permissions sections');
                        showSection('all');
                    })();

                    function showSection(sectionName) {
                        console.log('Showing user permissions section:', sectionName);

                        // Hide all sections
                        const sections = document.querySelectorAll('.permissions-section');
                        console.log('Found user permissions sections:', sections.length);
                        sections.forEach((section, index) => {
                            section.style.display = 'none';
                            console.log('Hidden user permissions section', index);
                        });

                        // Remove active class from all menu items
                        const menuItems = document.querySelectorAll('.menu .item');
                        console.log('Found user permissions menu items:', menuItems.length);
                        menuItems.forEach(item => {
                            item.classList.remove('active');
                        });

                        // Show selected section
                        const targetSection = document.getElementById(sectionName + '-section');
                        console.log('Target user permissions section element:', targetSection);
                        if (targetSection) {
                            targetSection.style.display = 'block';
                            console.log('User permissions section shown:', sectionName);
                        } else {
                            console.log('User permissions section not found:', sectionName);
                        }

                        // Add active class to clicked menu item
                        const clickedItem = document.querySelector('.menu .item[data-section="' + sectionName + '"]');
                        console.log('Clicked user permissions item:', clickedItem);
                        if (clickedItem) {
                            clickedItem.classList.add('active');
                        }
                    }
                </script>
            </div>
        `;
    }

    private renderPermissionStatus(hasPermission: boolean): string {
        return hasPermission ?
            '<span style="color: #28a745; font-weight: bold;">✓</span>' :
            '<span style="color: #dc3545; font-weight: bold;">✗</span>';
    }
}