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

export class FieldSecurityComponent {
    private objectName: string;
    private fieldName: string;
    private fieldLabel: string;
    private fieldPermissions: any[];
    private permissionSetGroups: any[];
    private orgWideDefaults: any;

    constructor(props: {
        objectName: string;
        fieldName: string;
        fieldLabel?: string;
        fieldPermissions: any[];
        permissionSetGroups?: any[];
        orgWideDefaults?: any;
    }) {
        this.objectName = props.objectName;
        this.fieldName = props.fieldName;
        this.fieldLabel = props.fieldLabel || props.fieldName;
        this.fieldPermissions = props.fieldPermissions || [];
        this.permissionSetGroups = props.permissionSetGroups || [];
        this.orgWideDefaults = props.orgWideDefaults;
    }

    render(): string {
        // Separate permissions by type - fix the filtering logic
        const permissionSetPermissions = this.fieldPermissions.filter(perm => perm.sourceType === 'permission-set');
        const permissionSetGroupPermissions = this.fieldPermissions.filter(perm => perm.sourceType === 'psg');
        const profilePermissions = this.fieldPermissions.filter(perm => perm.sourceType === 'profile');

        console.log('Field permissions breakdown:', {
            total: this.fieldPermissions.length,
            permissionSets: permissionSetPermissions.length,
            psgs: permissionSetGroupPermissions.length,
            profiles: profilePermissions.length
        });

        const permissionSetRows = permissionSetPermissions.map(perm => `
            <tr>
                <td>${perm.source || 'Unknown Permission Set'}</td>
                <td>${this.renderPermissionStatus(perm.permissionsRead)}</td>
                <td>${this.renderPermissionStatus(perm.permissionsEdit)}</td>
            </tr>
        `).join('');

        const permissionSetGroupRows = permissionSetGroupPermissions.map(perm => `
            <tr>
                <td>${this.getPermissionSetGroupName(perm.parentId) || 'Unknown Permission Set Group'}</td>
                <td>${this.renderPermissionStatus(perm.permissionsRead)}</td>
                <td>${this.renderPermissionStatus(perm.permissionsEdit)}</td>
            </tr>
        `).join('');

        const profileRows = profilePermissions.map(perm => `
            <tr>
                <td>${perm.source || 'Unknown Profile'}</td>
                <td>${this.renderPermissionStatus(perm.permissionsRead)}</td>
                <td>${this.renderPermissionStatus(perm.permissionsEdit)}</td>
            </tr>
        `).join('');

        return `
            <div class="ui container">
                <h2 class="ui header">Field Level Security</h2>
                <div class="ui segment">
                    <div class="ui grid">
                        <div class="eight wide column">
                            <h3>Object: ${this.objectName}</h3>
                            <h4>Field: ${this.fieldLabel} (${this.fieldName})</h4>
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
                        <h3 class="ui header">All Field Permissions</h3>
                        ${this.fieldPermissions.length > 0 ?
                        `<table class="ui table">
                            <thead>
                                <tr>
                                    <th>Source</th>
                                    <th>Type</th>
                                    <th>Read</th>
                                    <th>Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${permissionSetPermissions.map(perm => `
                                    <tr>
                                        <td>${perm.source || 'Unknown Permission Set'}</td>
                                        <td>Permission Set</td>
                                        <td>${this.renderPermissionStatus(perm.permissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(perm.permissionsEdit)}</td>
                                    </tr>
                                `).join('')}
                                ${permissionSetGroupPermissions.map(perm => `
                                    <tr>
                                        <td>${this.getPSGNameForPermission(perm) || 'Unknown Permission Set Group'}</td>
                                        <td>Permission Set Group</td>
                                        <td>${this.renderPermissionStatus(perm.permissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(perm.permissionsEdit)}</td>
                                    </tr>
                                `).join('')}
                                ${profilePermissions.map(perm => `
                                    <tr>
                                        <td>${perm.source || 'Unknown Profile'}</td>
                                        <td>Profile</td>
                                        <td>${this.renderPermissionStatus(perm.permissionsRead)}</td>
                                        <td>${this.renderPermissionStatus(perm.permissionsEdit)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>` :
                        `<div class="ui info message">
                            <div class="header">No Field Permissions Found</div>
                            <p>No field-level permissions were found for this field.</p>
                        </div>`}
                    </div>
                </div>

                <div id="permission-sets-section" class="permissions-section" style="display: none;">
                    <div class="ui segment">
                        <h3 class="ui header">Permission Sets</h3>
                        ${permissionSetPermissions.length > 0 ?
                        `<table class="ui table">
                            <thead>
                                <tr>
                                    <th>Permission Set</th>
                                    <th>Read</th>
                                    <th>Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${permissionSetRows}
                            </tbody>
                        </table>` :
                        `<div class="ui info message">
                            <div class="header">No Permission Set Field Permissions</div>
                            <p>No field-level permissions found for permission sets.</p>
                        </div>`}
                    </div>
                </div>

                <div id="psg-section" class="permissions-section" style="display: none;">
                    <div class="ui segment">
                        <h3 class="ui header">Permission Set Groups</h3>
                        ${this.permissionSetGroups.length > 0 ? `
                        <div class="ui styled accordion" id="psg-accordion" style="width: 100%;">
                            ${this.permissionSetGroups.map((group, index) => `
                                <div class="title" onclick="toggleAccordion(${index})" style="width: 100%; cursor: pointer;">
                                    <i class="dropdown icon"></i>
                                    <strong>${group.name || 'Unknown Permission Set Group'}</strong>
                                    <span class="ui small label" style="margin-left: 10px;">
                                        ${group.members ? group.members.length : 0} permission sets
                                    </span>
                                </div>
                                <div class="content" id="psg-content-${index}" style="padding: 1em 0; border-top: 1px solid rgba(34, 36, 38, 0.15); width: 100%;">
                                    <div style="padding: 0 1em;">
                                        ${group.members && group.members.length > 0 ? `
                                        <div class="ui grid">
                                            <div class="sixteen wide column">
                                                <h4>Member Permission Sets</h4>
                                                <table class="ui table">
                                                    <thead>
                                                        <tr>
                                                            <th>Permission Set</th>
                                                            <th>Read</th>
                                                            <th>Edit</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${group.members.map((member: any) => `
                                                            <tr>
                                                                <td>${member.name || 'Unknown Permission Set'}</td>
                                                                <td>${this.renderPermissionStatus(member.read)}</td>
                                                                <td>${this.renderPermissionStatus(member.edit)}</td>
                                                            </tr>
                                                        `).join('')}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        ` : `
                                        <div class="ui info message">
                                            <div class="header">No Member Permission Sets</div>
                                            <p>This permission set group has no member permission sets with field permissions.</p>
                                        </div>
                                        `}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        ` : `
                        <div class="ui info message">
                            <div class="header">No Permission Set Groups</div>
                            <p>No permission set groups found with field permissions for this field.</p>
                        </div>
                        `}
                    </div>
                </div>

                <div id="profiles-section" class="permissions-section" style="display: none;">
                    <div class="ui segment">
                        <h3 class="ui header">Profiles</h3>
                        ${profilePermissions.length > 0 ?
                        `<table class="ui table">
                            <thead>
                                <tr>
                                    <th>Profile</th>
                                    <th>Read</th>
                                    <th>Edit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${profileRows}
                            </tbody>
                        </table>` :
                        `<div class="ui info message">
                            <div class="header">No Profile Field Permissions</div>
                            <p>No field-level permissions found for profiles.</p>
                        </div>`}
                    </div>
                </div>

                <script>
                    // Initialize immediately
                    (function() {
                        console.log('Initializing field security sections');
                        showSection('all');
                    })();

                    function toggleAccordion(index) {
                        const content = document.getElementById('psg-content-' + index);
                        const title = content.previousElementSibling;
                        const icon = title.querySelector('.dropdown.icon');

                        if (content.style.display === 'block') {
                            content.style.display = 'none';
                            title.classList.remove('active');
                            icon.classList.remove('up');
                            icon.classList.add('down');
                        } else {
                            content.style.display = 'block';
                            title.classList.add('active');
                            icon.classList.remove('down');
                            icon.classList.add('up');
                        }
                    }

                    function showSection(sectionName) {
                        console.log('Showing field security section:', sectionName);

                        // Hide all sections
                        const sections = document.querySelectorAll('.permissions-section');
                        console.log('Found field security sections:', sections.length);
                        sections.forEach((section, index) => {
                            section.style.display = 'none';
                            console.log('Hidden field security section', index);
                        });

                        // Remove active class from all menu items
                        const menuItems = document.querySelectorAll('.menu .item');
                        console.log('Found field security menu items:', menuItems.length);
                        menuItems.forEach(item => {
                            item.classList.remove('active');
                        });

                        // Show selected section
                        const targetSection = document.getElementById(sectionName + '-section');
                        console.log('Target field security section element:', targetSection);
                        if (targetSection) {
                            targetSection.style.display = 'block';
                            console.log('Field security section shown:', sectionName);
                        } else {
                            console.log('Field security section not found:', sectionName);
                        }

                        // Add active class to clicked menu item
                        const clickedItem = document.querySelector('.menu .item[data-section="' + sectionName + '"]');
                        console.log('Clicked field security item:', clickedItem);
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

    private getPermissionSetGroupName(psgId: string): string | undefined {
        const psg = this.permissionSetGroups.find((group: any) => group.id === psgId);
        return psg ? psg.name : undefined;
    }

    private getPSGNameForPermission(perm: any): string | undefined {
        // For PSG permissions, try viaPSG first (for profile-based PSG permissions)
        if (perm.viaPSG) {
            return perm.viaPSG;
        }
        
        // For direct PSG permissions, the source field contains the PSG name
        if (perm.source && perm.source !== 'Unknown Permission Set Group') {
            return perm.source;
        }
        
        // Fallback: try to find PSG by ID (though this is unlikely to work for profile-based permissions)
        return this.getPermissionSetGroupName(perm.parentId);
    }
}