export class SchemaComponent {
    private objectName: string;
    private fields: any[];

    constructor(props: { objectName: string; fields: any[] }) {
        this.objectName = props.objectName;
        this.fields = props.fields || [];
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
