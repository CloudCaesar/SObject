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

export class PermissionsComponent {
    private objectName: string;
    private permissions: any;
    private orgWideDefaults: any;

    constructor(props: { objectName: string; permissions: any; orgWideDefaults?: any }) {
        this.objectName = props.objectName;
        this.permissions = props.permissions || {};
        this.orgWideDefaults = props.orgWideDefaults;
    }

    render(): string {
        const permissionKeys = Object.keys(this.permissions);

        // For this generic component, we'll show all permissions in a single table
        // since we don't have the detailed breakdown by type
        const permissionRows = permissionKeys.map(key => `
            <tr>
                <td>${key}</td>
                <td>${this.renderPermissionStatus(this.permissions[key])}</td>
            </tr>
        `).join('');

        return `
            <div class="ui container">
                <h2 class="ui header">Permissions: ${this.objectName}</h2>

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

                <div class="ui segment" ${permissionKeys.length === 0 ? 'style="display: none;"' : ''}>
                    <table class="ui table">
                        <thead>
                            <tr>
                                <th>Permission Type</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${permissionRows}
                        </tbody>
                    </table>
                </div>

                ${permissionKeys.length === 0 ? `
                <div class="ui info message">
                    <div class="header">No Permissions Found</div>
                    <p>No permissions data is available for this object.</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    private renderPermissionStatus(hasPermission: boolean): string {
        return hasPermission ?
            '<span style="color: #28a745; font-weight: bold;">✓</span>' :
            '<span style="color: #dc3545; font-weight: bold;">✗</span>';
    }
}