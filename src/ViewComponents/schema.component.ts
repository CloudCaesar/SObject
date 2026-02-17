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

export class SchemaComponent {
    private objectName: string;
    private fields: any[];
    private orgWideDefaults: any;

    constructor(props: { objectName: string; fields: any[]; orgWideDefaults?: any }) {
        this.objectName = props.objectName;
        this.fields = props.fields || [];
        this.orgWideDefaults = props.orgWideDefaults;
    }

    render(): string {
        const fieldRows = this.fields.map(field => `
            <tr>
                <td>${field.name || ''}</td>
                <td>${field.type || ''}</td>
                <td>${field.length || '-'}</td>
                <td>${this.renderPermissionStatus(field.createable)}</td>
                <td>${this.renderPermissionStatus(field.updateable)}</td>
                <td>${this.renderPermissionStatus(field.required)}</td>
            </tr>
        `).join('');

        return `
            <div class="ui container">
                <h2 class="ui header">Object Schema: ${this.objectName}</h2>

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

                <div class="ui segment">
                    <table class="ui table">
                        <thead>
                            <tr>
                                <th>Field Name</th>
                                <th>Type</th>
                                <th>Length</th>
                                <th>Createable</th>
                                <th>Updateable</th>
                                <th>Required</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fieldRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    private renderPermissionStatus(hasPermission: boolean): string {
        return hasPermission ?
            '<span style="color: #28a745; font-weight: bold;">✓</span>' :
            '<span style="color: #dc3545; font-weight: bold;">✗</span>';
    }
}
