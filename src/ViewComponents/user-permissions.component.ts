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
                    <div class="ui grid">
                        <div class="eight wide column">
                            <h3>User: ${this.userName}</h3>
                            <h4>Object: ${this.objectName}</h4>
                            ${this.effectiveObject !== this.objectName ? `<p><em>Inherited from: ${this.effectiveObject}</em></p>` : ''}
                        </div>
                        ${this.orgWideDefaults ? `
                        <div class="eight wide column">
                            <h4 class="ui header">Org-Wide Defaults</h4>
                            <div><strong>Internal Access:</strong> ${this.orgWideDefaults.InternalSharingModel || 'N/A'}</div>
                            <div><strong>External Access:</strong> ${this.orgWideDefaults.ExternalSharingModel || 'N/A'}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

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
                                ${this.profilePermissions && this.profilePermissions.length > 0 ? `
                                    <tr>
                                        <td>${this.profilePermissions[0].Parent?.Profile?.Name || 'Unknown Profile'}</td>
                                        <td>Profile</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsCreate)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsEdit)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsDelete)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsViewAllRecords)}</td>
                                        <td>${this.renderPermissionStatus(this.profilePermissions[0].PermissionsModifyAllRecords)}</td>
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
                        <div class="ui styled accordion" id="psg-accordion" style="width: 100%;">
                            ${this.permissionSetGroups.map((group, index) => `
                                <div class="title" onclick="toggleAccordion(${index})" style="width: 100%; cursor: pointer;">
                                    <i class="dropdown icon"></i>
                                    <strong>${group.PermissionSetGroupLabel || group.permissionSetGroupName || group.name || group.Parent?.Name || group.Parent?.Label || 'Unknown'}</strong>
                                    <span class="ui small label" style="margin-left: 10px;">
                                        ${group.memberPermissionSets ? group.memberPermissionSets.length : 0} permission sets
                                    </span>
                                </div>
                                <div class="content" id="psg-content-${index}" style="padding: 1em 0; border-top: 1px solid rgba(34, 36, 38, 0.15); width: 100%;">
                                    <div class="ui grid">
                                        <div class="sixteen wide column">
                                            <h4>Group Permissions</h4>
                                            <table class="ui table">
                                                <thead>
                                                    <tr>
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
                                                        <td>${this.renderPermissionStatus(group.Read)}</td>
                                                        <td>${this.renderPermissionStatus(group.Create)}</td>
                                                        <td>${this.renderPermissionStatus(group.Edit)}</td>
                                                        <td>${this.renderPermissionStatus(group.Delete)}</td>
                                                        <td>${this.renderPermissionStatus(group.ViewAllRecords)}</td>
                                                        <td>${this.renderPermissionStatus(group.ModifyAllRecords)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    ${group.memberPermissionSets && group.memberPermissionSets.length > 0 ? `
                                    <div class="ui grid">
                                        <div class="sixteen wide column">
                                            <h4>Member Permission Sets</h4>
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
                                                    ${group.memberPermissionSets.map((memberPs: any) => {
                                                        // Find the corresponding permission set data from this.permissions
                                                        const psData = this.permissions.find(ps => ps.ParentId === memberPs.PermissionSetId);
                                                        return `
                                                            <tr>
                                                                <td>${memberPs.PermissionSetLabel || memberPs.PermissionSetName || 'Unknown'}</td>
                                                                <td>${this.renderPermissionStatus(psData ? psData.PermissionsRead : false)}</td>
                                                                <td>${this.renderPermissionStatus(psData ? psData.PermissionsCreate : false)}</td>
                                                                <td>${this.renderPermissionStatus(psData ? psData.PermissionsEdit : false)}</td>
                                                                <td>${this.renderPermissionStatus(psData ? psData.PermissionsDelete : false)}</td>
                                                                <td>${this.renderPermissionStatus(psData ? psData.PermissionsViewAllRecords : false)}</td>
                                                                <td>${this.renderPermissionStatus(psData ? psData.PermissionsModifyAllRecords : false)}</td>
                                                            </tr>
                                                        `;
                                                    }).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
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

                    function toggleAccordion(index) {
                        const content = document.getElementById('psg-content-' + index);
                        const title = content.previousElementSibling;
                        const icon = title.querySelector('.dropdown.icon');

                        if (content.classList.contains('active')) {
                            content.classList.remove('active');
                            icon.classList.remove('up');
                            icon.classList.add('down');
                        } else {
                            content.classList.add('active');
                            icon.classList.remove('down');
                            icon.classList.add('up');
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