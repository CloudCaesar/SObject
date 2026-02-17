// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ApexNotebookController from './notebook/apexNotebookController';
import ApexNotebookSerializer from './notebook/apexNotebookSerializer';
import * as CONSTANTS from './constants';
import * as DataHandler from './handlers/dataHandler';
import * as LogHandler from './handlers/logHandler';
import * as SalesforceHandler from './handlers/salesforceHandler';
import { HtmlPageBuilder } from './utils/HtmlPageBuilder';
import { LoadingComponent } from './ViewComponents/loading.component';
import { UserPermissionsComponent } from './ViewComponents/user-permissions.component';
import { SchemaComponent } from './ViewComponents/schema.component';
import { ObjectPermissionsComponent } from './ViewComponents/object-permissions.component';
import { FieldSecurityComponent } from './ViewComponents/field-security.component';
import { SObjectToApexService } from './services/SObjectToApexService';
import { SObjectToApexChildParentService } from './services/SObjectToApexChildParentService';
import { SObjectToApexParentChildService } from './services/SObjectToApexParentChildService';
import { FieldSecurityService } from './services/FieldSecurityService';
import { SchemaService } from './services/SchemaService';
import { ObjectPermissionsService } from './services/ObjectPermissionsService';
import { UserPermissionsService } from './services/UserPermissionsService';

// Input validation functions for security
export function isValidSalesforceId(id: string): boolean {
    // Salesforce IDs are 15 or 18 characters, alphanumeric
    return /^[a-zA-Z0-9]{15,18}$/.test(id);
}

export function isValidSalesforceObjectName(name: string): boolean {
    // Object names start with letter, contain letters, numbers, underscores
    return /^[A-Za-z][A-Za-z0-9_]*$/.test(name) && name.length <= 40;
}

export function isValidSalesforceFieldName(name: string): boolean {
    // Field names similar, can have __c for custom
    return /^[A-Za-z][A-Za-z0-9_]*(__c)?$/.test(name) && name.length <= 40;
}

function formatField(fieldValue: any, fieldType?: string): string | null {
    if (fieldValue === null || fieldValue === undefined) {
        return null;
    }
    if (fieldType === 'date') {
        const d = new Date(fieldValue);
        if (!isNaN(d.getTime())) {
            return `Date.newInstance(${d.getFullYear()}, ${d.getMonth() + 1}, ${d.getDate()})`;
        }
        return null;
    }
    if (fieldType === 'datetime') {
        const d = new Date(fieldValue);
        if (!isNaN(d.getTime())) {
            return `DateTime.newInstance(${d.getFullYear()}, ${d.getMonth() + 1}, ${d.getDate()}, ${d.getHours()}, ${d.getMinutes()}, ${d.getSeconds()})`;
        }
        return null;
    }
    if (fieldType === 'boolean') {
        return fieldValue ? 'true' : 'false';
    }
    if (fieldType === 'int') {
        if (typeof fieldValue === 'string') {
            let num = parseInt(fieldValue, 10);
            return isNaN(num) ? null : num.toString();
        }
        return typeof fieldValue === 'number' ? Math.floor(fieldValue).toString() : null;
    }
    if (fieldType === 'time') {
        if (typeof fieldValue === 'string') {
            // Parse time string like '00:30:00.000Z' or 'HH:MM:SS.sss'
            const match = fieldValue.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?/);
            if (match) {
                const hour = parseInt(match[1], 10);
                const minute = parseInt(match[2], 10);
                const second = parseInt(match[3], 10);
                const millisecond = match[4] ? parseInt(match[4], 10) : 0;
                return `Time.newInstance(${hour}, ${minute}, ${second}, ${millisecond})`;
            }
        }
        return null;
    }
    if (fieldType === 'double' || fieldType === 'decimal' || fieldType === 'currency' || fieldType === 'percent') {
        if (typeof fieldValue === 'string') {
            let num = parseFloat(fieldValue);
            return isNaN(num) ? null : num.toString();
        }
        return typeof fieldValue === 'number' ? fieldValue.toString() : null;
    }
    // For strings and other types, escape single quotes
    return '\'' + fieldValue.toString().replace(/'/g, '\\\'') + '\'';
}

export { formatField };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "anonymous-apex-notebook" is now active!');

    DataHandler.initiate(context);
    LogHandler.initiate();

    context.subscriptions.push(
        vscode.workspace.registerNotebookSerializer(CONSTANTS.NOTEBOOK_TYPE, new ApexNotebookSerializer())
    );
    context.subscriptions.push(
        new ApexNotebookController()
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_NEW_NOTEBOOK,
            async () => {
                let notebook = await vscode.workspace.openNotebookDocument(
                    CONSTANTS.NOTEBOOK_TYPE,
                    new vscode.NotebookData([
                        new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '// Your anonymous apex script goes here!', 'apex-anon'),
                        new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'SELECT Id, Name FROM Account', 'soql'),
                    ])
                );
                vscode.window.showNotebookDocument(notebook);
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_TO_APEX,
            async () => {
                const service = new SObjectToApexService();
                await service.execute();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_TO_APEX_CHILD_PARENT,
            async () => {
                const service = new SObjectToApexChildParentService();
                await service.execute();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_TO_APEX_PARENT_CHILD,
            async () => {
                const service = new SObjectToApexParentChildService();
                await service.execute();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_SCHEMA,
            async () => {
                try {
                    const schemaService = new SchemaService();
                    await schemaService.initialize();

                    // Get queryable SObjects using service
                    const sobjects = await schemaService.getQueryableSObjects();

                    // Show quick pick for SObject selection
                    const sobjectOptions: vscode.QuickPickItem[] = sobjects
                        .sort((a: any, b: any) => a.Label.localeCompare(b.Label))
                        .map((sobject: any) => ({
                            label: sobject.Label,
                            detail: sobject.QualifiedApiName,
                            description: sobject.IsCustom ? '(Custom)' : '(Standard)',
                            apiName: sobject.QualifiedApiName
                        }));

                    let selectedSObject = await vscode.window.showQuickPick(sobjectOptions, {
                        title: 'Select an SObject to View Schema',
                        matchOnDetail: true,
                        matchOnDescription: true
                    });

                    if (!selectedSObject) {
                        return;
                    }

                    let objectName = (selectedSObject as any).apiName;
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    let describe = await connection.describe(objectName);

                    // Get org-wide defaults
                    const orgWideDefaults = await schemaService.getOrgWideDefaults(objectName);

                    // Create webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'sobjectSchema',
                        `${objectName} Fields & Relationships`,
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );

                    // Render schema component and display HTML
                    const schemaComponent = new SchemaComponent({
                        objectName: objectName,
                        fields: describe.fields,
                        orgWideDefaults: orgWideDefaults
                    });
                    const contentHtml = schemaComponent.render();
                    const html = HtmlPageBuilder.build(contentHtml, `${objectName} Schema`);
                    panel.webview.html = html;

                    // Handle messages from webview
                    panel.webview.onDidReceiveMessage(async message => {
                        // Handle other messages if needed
                    });
                } catch (error) {
                    vscode.window.showErrorMessage('Error retrieving schema: ' + (error as Error).message);
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_PERMISSIONS,
            async () => {
                try {
                    const permissionsService = new ObjectPermissionsService();
                    await permissionsService.initialize();

                    // Get all SObjects for selection
                    const sobjects = await permissionsService.getQueryableSObjects();
                    const sobjectOptions: vscode.QuickPickItem[] = sobjects.map((obj: any) => ({
                        label: obj.Label,
                        detail: obj.QualifiedApiName,
                        name: obj.QualifiedApiName
                    }));

                    // Show quick pick for SObject selection
                    const selectedObject = await vscode.window.showQuickPick(sobjectOptions, {
                        placeHolder: 'Select an SObject to view permissions',
                        matchOnDetail: true
                    });

                    if (!selectedObject) {
                        return;
                    }

                    const objectName = (selectedObject as any).name;

                    // Create webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'sobjectPermissions',
                        `${objectName} Object Access`,
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );

                    // Helper to update webview with progress
                    const updateProgress = (message: string) => {
                        // Show loading message in webview
                        const loadingComponent = new LoadingComponent(message);
                        const loadingHtml = loadingComponent.render();
                        panel.webview.html = HtmlPageBuilder.build(loadingHtml, 'Loading...');
                    };

                    // Show initial loading indicator
                    updateProgress('Loading object permissions data...');

                    // Describe the object to get sharing model
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    let describe = await connection.describe(objectName);

                    // Get permissions with groups using service
                    const permissionSets = await permissionsService.getAllPermissionSetsForObject(objectName);
                    const permissionSetGroups = await permissionsService.getAllPermissionSetGroupsForObject(objectName);
                    const profilePermissions = await permissionsService.getAllProfilePermissionsForObject(objectName);

                    // Get org-wide defaults
                    const orgWideDefaults = await permissionsService.getOrgWideDefaults(objectName);

                    // Render component and display HTML
                    const component = new ObjectPermissionsComponent({
                        objectName: objectName,
                        permissionSets: permissionSets,
                        permissionSetGroups: permissionSetGroups,
                        profilePermissions: profilePermissions,
                        orgWideDefaults: orgWideDefaults
                    });
                    const contentHtml = component.render();
                    const html = HtmlPageBuilder.build(contentHtml, `${objectName} Object Access`);
                    panel.webview.html = html;

                    // Handle messages from webview
                    panel.webview.onDidReceiveMessage(async message => {
                        // Handle other messages if needed
                    });
                } catch (error) {
                    vscode.window.showErrorMessage('Error retrieving permissions: ' + (error as Error).message);
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_USER_PERMISSIONS,
            async () => {
                try {
                    console.log('[UserPermissions] Command started');
                    
                    const userPermissionsService = new UserPermissionsService();
                    console.log('[UserPermissions] Service created');
                    
                    await userPermissionsService.initialize();
                    console.log('[UserPermissions] Service initialized');

                    // Get queryable SObjects
                    console.log('[UserPermissions] Fetching queryable SObjects...');
                    const sobjects = await userPermissionsService.getQueryableSObjects();
                    console.log(`[UserPermissions] Retrieved ${sobjects.length} SObjects`);
                    
                    const sobjectOptions: vscode.QuickPickItem[] = sobjects
                        .sort((a: any, b: any) => a.QualifiedApiName.localeCompare(b.QualifiedApiName))
                        .map((sobject: any) => ({
                            label: sobject.QualifiedApiName,
                            detail: sobject.Label + (sobject.IsCustom ? ' (Custom)' : ' (Standard)'),
                            description: sobject.QualifiedApiName
                        }));

                    let selectedSObject = await vscode.window.showQuickPick(sobjectOptions, {
                        title: 'Select an SObject to Analyze User Permissions',
                        matchOnDetail: true,
                        matchOnDescription: true
                    });

                    if (!selectedSObject) {
                        return;
                    }

                    let objectName = selectedSObject.label;

                    // Get active users
                    const users = await userPermissionsService.getActiveUsers();
                    const userOptions: vscode.QuickPickItem[] = users.getRecords().map((user: any) => ({
                        label: user.Name,
                        detail: user.Username,
                        id: user.Id
                    }));

                    let selectedUser = await vscode.window.showQuickPick(userOptions, {
                        title: 'Select a User to Analyze Permissions'
                    });

                    if (!selectedUser) {
                        return;
                    }

                    let userId = (selectedUser as any).id;

                    // Create webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'sobjectUserPermissions',
                        `User Permissions Analysis`,
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );

                    // Helper to update webview with progress
                    const updateProgress = (message: string) => {
                        // Show loading message in webview
                        const loadingComponent = new LoadingComponent(message);
                        const loadingHtml = loadingComponent.render();
                        panel.webview.html = HtmlPageBuilder.build(loadingHtml, 'Loading...');
                    };

                    // Show initial loading indicator
                    updateProgress('Loading user permissions data...');

                    console.log(`[UserPermissions] Starting permission analysis for user ${userId} on object ${objectName}`);

                    // Get user permissions for the object
                    console.log(`[UserPermissions] Fetching user permissions...`);
                    const permissions = await userPermissionsService.getUserPermissionsForObject(userId, objectName);
                    console.log(`[UserPermissions] Retrieved ${permissions.length} permission records`);

                    // Get permission set groups for the object
                    console.log(`[UserPermissions] Fetching permission set groups...`);
                    const permissionSetGroups = await userPermissionsService.getUserPermissionSetGroupsForObject(userId, objectName);
                    console.log(`[UserPermissions] Retrieved ${permissionSetGroups.length} permission set groups`);

                    // Get profile permissions for the object
                    console.log(`[UserPermissions] Fetching profile permissions...`);
                    const profilePermissions = await userPermissionsService.getUserProfilePermissionsForObject(userId, objectName);
                    console.log(`[UserPermissions] Retrieved ${profilePermissions.length} profile permissions`);

                    // Determine effective object (for master-detail relationships)
                    console.log(`[UserPermissions] Describing object ${objectName}...`);
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    let describe = await connection.describe(objectName);
                    console.log(`[UserPermissions] Object described successfully`);
                    
                    let masterObject = null;
                    for (let field of describe.fields) {
                        if (field.type === 'reference' && !field.nillable && field.referenceTo && field.referenceTo.length > 0 && !['OwnerId', 'CreatedById', 'LastModifiedById'].includes(field.name)) {
                            masterObject = field.referenceTo[0];
                            break;
                        }
                    }
                    let effectiveObject = masterObject || objectName;

                    // Update panel title
                    panel.title = `${selectedUser.label} Permissions on ${objectName}${masterObject ? ` (inherited from ${masterObject})` : ''}`;

                    // Get org-wide defaults
                    console.log(`[UserPermissions] Fetching org-wide defaults for ${objectName}...`);
                    const orgWideDefaults = await userPermissionsService.getOrgWideDefaults(objectName);
                    console.log(`[UserPermissions] Org-wide defaults retrieved: ${JSON.stringify(orgWideDefaults)}`);

                    // Pass data to component for rendering
                    console.log(`[UserPermissions] Rendering component...`);
                    
                    const userPermissionsData = {
                        objectName: objectName,
                        userName: selectedUser.label,
                        permissions: permissions,
                        permissionSetGroups: permissionSetGroups,
                        profilePermissions: profilePermissions,
                        effectiveObject: effectiveObject,
                        orgWideDefaults: orgWideDefaults
                    };
                    
                    console.log(`[UserPermissions] User Permissions Data:`, JSON.stringify(userPermissionsData, null, 2));
                    
                    // Invoke user-permissions component directly to render HTML
                    const component = new UserPermissionsComponent(userPermissionsData);
                    const contentHtml = component.render();
                    const html = HtmlPageBuilder.build(contentHtml, `${selectedUser.label} Permissions on ${objectName}`);
                    panel.webview.html = html;
                    console.log(`[UserPermissions] Component rendered successfully`);

                    // Handle messages from webview
                    panel.webview.onDidReceiveMessage(async message => {
                        // Handle other messages if needed
                    });
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    const errorStack = error instanceof Error ? error.stack : '';
                    console.error('[UserPermissions] Command failed:', errorMsg);
                    console.error('[UserPermissions] Stack:', errorStack);
                    vscode.window.showErrorMessage('Error retrieving user permissions: ' + errorMsg);
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_FIELD_SECURITY,
            async () => {
                try {
                    const fieldSecurityService = new FieldSecurityService();
                    await fieldSecurityService.initialize();
                    
                    // Step 1: Get queryable SObjects
                    const sobjectRecords = await fieldSecurityService.getQueryableSObjects();
                    
                    // Show quick pick for SObject selection
                    const sobjectOptions: vscode.QuickPickItem[] = sobjectRecords.map((obj: any) => ({
                        label: obj.Label,
                        detail: obj.QualifiedApiName,
                        apiName: obj.QualifiedApiName
                    }));
                    
                    let selectedSObject = await vscode.window.showQuickPick(sobjectOptions, {
                        title: 'Select an SObject to Analyze Field Level Security'
                    });
                    
                    if (!selectedSObject) {
                        return;
                    }
                    
                    let objectName = (selectedSObject as any).apiName;
                    
                    // Step 2: Describe the object to get fields
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    let describe = await connection.describe(objectName);
let fields = describe.fields.filter((f: any) =>
                        f.type !== 'id' &&
                        !f.autoNumber &&
                        !f.calculated &&
                        !f.compoundFieldName && // Exclude compound field components
                        !(f.type === 'reference' && typeof f.relationshipOrder === 'number') // Exclude Master-Detail relationships
                    );

                    // Additional filter to exclude common system fields that don't have FLS
                    const systemFieldsToExclude = [
                        'CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate',
                        'SystemModstamp', 'IsDeleted', 'LastViewedDate', 'LastReferencedDate'
                    ];

                    fields = fields.filter((f: any) => !systemFieldsToExclude.includes(f.name));

                    // Step 3: Show quick pick for field selection
                    const fieldOptions: vscode.QuickPickItem[] = fields
                        .sort((a: any, b: any) => a.label.localeCompare(b.label))
                        .map((field: any) => ({
                            label: field.label,
                            detail: field.name,
                            description: field.type,
                            fieldName: field.name
                        }));
                    
                    let selectedField = await vscode.window.showQuickPick(fieldOptions, {
                        title: 'Select a Field to View FLS',
                        matchOnDetail: true,
                        matchOnDescription: true
                    });
                    
                    if (!selectedField) {
                        return;
                    }
                    
                    let fieldName = (selectedField as any).fieldName;
                    let fieldLabel = selectedField.label;
                    
                    // Create webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'sobjectFieldSecurity',
                        `${fieldLabel} (${fieldName}) FLS on ${objectName}`,
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );

                    // Helper to update webview with progress
                    const updateProgress = (message: string) => {
                        // Show loading message in webview
                        const loadingComponent = new LoadingComponent(message);
                        const loadingHtml = loadingComponent.render();
                        panel.webview.html = HtmlPageBuilder.build(loadingHtml, 'Loading...');
                    };

                    // Show initial loading indicator
                    updateProgress('Loading field security data...');

                    console.log(`[FLS] Starting security analysis for field: ${fieldName} on object: ${objectName}`);
                    
                    try {
                        // Get field security data from service
                        console.log(`[FLS] Calling fieldSecurityService.getFieldSecurityForObject()`);
                        const securityData = await fieldSecurityService.getFieldSecurityForObject(objectName, fieldName);
                        console.log(`[FLS] Service call complete. Retrieved ${securityData.fieldPermissions.length} field permissions and ${securityData.psgs.length} PSGs`);
                        console.log(`[FLS] Security data:`, JSON.stringify(securityData, null, 2));
                        
                        // Get org-wide defaults
                        const orgWideDefaults = await fieldSecurityService.getOrgWideDefaults(objectName);
                        
                        // Render component with data from service
                        console.log(`[FLS] Creating field security component`);
                        const fieldSecurityComponent = new FieldSecurityComponent({
                            objectName: objectName,
                            fieldName: fieldName,
                            fieldLabel: fieldLabel,
                            fieldPermissions: securityData.fieldPermissions,
                            permissionSetGroups: securityData.psgs,
                            orgWideDefaults: orgWideDefaults
                        });
                        const contentHtml = fieldSecurityComponent.render();
                        const html = HtmlPageBuilder.build(contentHtml, `${fieldLabel} (${fieldName}) FLS on ${objectName}`);
                        panel.webview.html = html;
                        console.log(`[FLS] Rendered successfully`);
                    } catch (serviceError) {
                        console.error('[FLS] Service call failed:', serviceError);
                        const errorMsg = serviceError instanceof Error ? serviceError.message : String(serviceError);
                        const errorStack = serviceError instanceof Error ? serviceError.stack : '';
                        console.error('[FLS] Error message:', errorMsg);
                        console.error('[FLS] Error stack:', errorStack);
                        // Show error in webview using plain HTML
                        const errorHtml = `<div class="ui negative message">
                            <div class="header">Error retrieving field security</div>
                            <p>${errorMsg}</p>
                            ${errorStack ? `<details><summary>Stack Trace</summary><pre>${errorStack}</pre></details>` : ''}
                        </div>`;
                        panel.webview.html = HtmlPageBuilder.build(errorHtml, 'Error');
                    }
                    
                } catch (error) {
                    console.error('[FLS] Error in command:', error);
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    const errorStack = error instanceof Error ? error.stack : '';
                    console.error('[FLS] Command error stack:', errorStack);
                    vscode.window.showErrorMessage('Error in Field Level Security command: ' + errorMsg);
                }
            }
        )
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}
