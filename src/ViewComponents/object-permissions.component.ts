export class ObjectPermissionsComponent {
    private objectName: string;
    private permissionSets: any[];
    private permissionSetGroups: any[];
    private profilePermissions: any[];
    private orgWideDefaults: any;

    constructor(props: {
        objectName: string;
        permissionSets: any[];
        permissionSetGroups: any[];
        profilePermissions: any[];
        orgWideDefaults?: any;
    }) {
        this.objectName = props.objectName;
        this.permissionSets = props.permissionSets || [];
        this.permissionSetGroups = props.permissionSetGroups || [];
        this.profilePermissions = props.profilePermissions || [];
        this.orgWideDefaults = props.orgWideDefaults;
    }

    render(): string {
        console.log('ObjectPermissionsComponent render called with:', {
            objectName: this.objectName,
            permissionSetsCount: this.permissionSets.length,
            permissionSetGroupsCount: this.permissionSetGroups.length,
            profilePermissionsCount: this.profilePermissions.length,
            orgWideDefaults: this.orgWideDefaults
        });
        // Separate permissions by type
        const permissionSetRows = this.permissionSets.map(ps => {
            console.log('Processing permission set:', ps);
            return `
            <tr>
                <td>${ps.Parent?.Name || ps.Parent?.Label || ps.name || ps.label || 'Unknown'}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsRead)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsCreate)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsEdit)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsDelete)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsViewAllRecords)}</td>
                <td>${this.renderPermissionStatus(ps.PermissionsModifyAllRecords)}</td>
            </tr>
        `}).join('');

        const permissionSetGroupRows = this.permissionSetGroups.map(psg => {
            console.log('Processing permission set group:', psg);
            return `
            <tr>
                <td>${psg.name || psg.label || psg.Parent?.Name || psg.Parent?.Label || 'Unknown'}</td>
                <td>${this.renderPermissionStatus(psg.permissions?.Read || psg.PermissionsRead)}</td>
                <td>${this.renderPermissionStatus(psg.permissions?.Create || psg.PermissionsCreate)}</td>
                <td>${this.renderPermissionStatus(psg.permissions?.Edit || psg.PermissionsEdit)}</td>
                <td>${this.renderPermissionStatus(psg.permissions?.Delete || psg.PermissionsDelete)}</td>
                <td>${this.renderPermissionStatus(psg.permissions?.ViewAll || psg.PermissionsViewAllRecords)}</td>
                <td>${this.renderPermissionStatus(psg.permissions?.ModifyAll || psg.PermissionsModifyAllRecords)}</td>
            </tr>
        `}).join('');

        const profileRows = this.profilePermissions.map(pp => {
            console.log('Processing profile permission:', pp);
            return `
            <tr>
                <td>${pp.Parent?.Name || pp.Parent?.Label || pp.name || pp.label || 'Unknown'}</td>
                <td>${this.renderPermissionStatus(pp.PermissionsRead)}</td>
                <td>${this.renderPermissionStatus(pp.PermissionsCreate)}</td>
                <td>${this.renderPermissionStatus(pp.PermissionsEdit)}</td>
                <td>${this.renderPermissionStatus(pp.PermissionsDelete)}</td>
                <td>${this.renderPermissionStatus(pp.PermissionsViewAllRecords)}</td>
                <td>${this.renderPermissionStatus(pp.PermissionsModifyAllRecords)}</td>
            </tr>
        `}).join('');

        return `
            <div class="ui container">
                <h2 class="ui header">Object Permissions: ${this.objectName}</h2>

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
                                ${this.permissionSets.map(ps => `
                                    <tr>
                                        <td>${ps.Parent?.Name || ps.Parent?.Label || ps.name || ps.label || 'Unknown'}</td>
                                        <td>Permission Set</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsCreate)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsEdit)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsDelete)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsViewAllRecords)}</td>
                                        <td>${this.renderPermissionStatus(ps.PermissionsModifyAllRecords)}</td>
                                    </tr>
                                `).join('')}
                                ${this.permissionSetGroups.map(psg => `
                                    <tr>
                                        <td>${psg.name || psg.label || psg.Parent?.Name || psg.Parent?.Label || 'Unknown'}</td>
                                        <td>Permission Set Group</td>
                                        <td>${this.renderPermissionStatus(psg.permissions?.Read || psg.PermissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(psg.permissions?.Create || psg.PermissionsCreate)}</td>
                                        <td>${this.renderPermissionStatus(psg.permissions?.Edit || psg.PermissionsEdit)}</td>
                                        <td>${this.renderPermissionStatus(psg.permissions?.Delete || psg.PermissionsDelete)}</td>
                                        <td>${this.renderPermissionStatus(psg.permissions?.ViewAll || psg.PermissionsViewAllRecords)}</td>
                                        <td>${this.renderPermissionStatus(psg.permissions?.ModifyAll || psg.PermissionsModifyAllRecords)}</td>
                                    </tr>
                                `).join('')}
                                ${this.profilePermissions.map(pp => `
                                    <tr>
                                        <td>${pp.Parent?.Name || pp.Parent?.Label || pp.name || pp.label || 'Unknown'}</td>
                                        <td>Profile</td>
                                        <td>${this.renderPermissionStatus(pp.PermissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(pp.PermissionsCreate)}</td>
                                        <td>${this.renderPermissionStatus(pp.PermissionsEdit)}</td>
                                        <td>${this.renderPermissionStatus(pp.PermissionsDelete)}</td>
                                        <td>${this.renderPermissionStatus(pp.PermissionsViewAllRecords)}</td>
                                        <td>${this.renderPermissionStatus(pp.PermissionsModifyAllRecords)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="permission-sets-section" class="permissions-section" style="display: none;">
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
                </div>

                <div id="psg-section" class="permissions-section" style="display: none;">
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
                                ${permissionSetGroupRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div id="profiles-section" class="permissions-section" style="display: none;">
                    <div class="ui segment">
                        <h3 class="ui header">Profiles</h3>
                        <table class="ui table">
                            <thead>
                                <tr>
                                    <th>Profile</th>
                                    <th>Read</th>
                                    <th>Create</th>
                                    <th>Edit</th>
                                    <th>Delete</th>
                                    <th>View All</th>
                                    <th>Modify All</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${profileRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <script>
                    // Initialize immediately
                    (function() {
                        console.log('Initializing permissions sections');
                        showSection('all');
                    })();

                    function showSection(sectionName) {
                        console.log('Showing section:', sectionName);

                        // Hide all sections
                        const sections = document.querySelectorAll('.permissions-section');
                        console.log('Found sections:', sections.length);
                        sections.forEach((section, index) => {
                            section.style.display = 'none';
                            console.log('Hidden section', index);
                        });

                        // Remove active class from all menu items
                        const menuItems = document.querySelectorAll('.menu .item');
                        console.log('Found menu items:', menuItems.length);
                        menuItems.forEach(item => {
                            item.classList.remove('active');
                        });

                        // Show selected section
                        const targetSection = document.getElementById(sectionName + '-section');
                        console.log('Target section element:', targetSection);
                        if (targetSection) {
                            targetSection.style.display = 'block';
                            console.log('Section shown:', sectionName);
                        } else {
                            console.log('Section not found:', sectionName);
                        }

                        // Add active class to clicked menu item
                        const clickedItem = document.querySelector('.menu .item[data-section="' + sectionName + '"]');
                        console.log('Clicked item:', clickedItem);
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