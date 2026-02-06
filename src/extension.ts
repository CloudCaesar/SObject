// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ApexNotebookController from './notebook/apexNotebookController';
import ApexNotebookSerializer from './notebook/apexNotebookSerializer';
import * as CONSTANTS from './constants';
import * as DataHandler from './handlers/dataHandler';
import * as LogHandler from './handlers/logHandler';
import * as SalesforceHandler from './handlers/salesforceHandler';

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
                let recordId = await vscode.window.showInputBox({ prompt: 'Enter Record ID' });
                if (!recordId) {
                    return;
                }
                if (!isValidSalesforceId(recordId)) {
                    vscode.window.showErrorMessage('Invalid Record ID format. Must be 15 or 18 alphanumeric characters.');
                    return;
                }
                let objectName = await vscode.window.showInputBox({ prompt: 'Enter Object Name' });
                if (!objectName) {
                    return;
                }
                if (!isValidSalesforceObjectName(objectName)) {
                    vscode.window.showErrorMessage('Invalid Object Name format. Must start with a letter and contain only letters, numbers, and underscores.');
                    return;
                }

                try {
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    let describe = await connection.describe(objectName);
                    let fields = describe.fields.filter((f: any) => !f.encrypted && f.type !== 'encryptedstring').map((f: any) => f.name);
                    let query = 'SELECT ' + fields.join(', ') + ' FROM ' + objectName + ' WHERE Id = \'' + recordId + '\'';
                    let result = await connection.query(query);
                    if (result.records.length === 0) {
                        vscode.window.showErrorMessage('No record found with the given ID.');
                        return;
                    }
                    let record = result.records[0];
                    let copiable = [];
                    for (let field of describe.fields) {
                        if (field.createable && field.updateable && field.name !== 'OwnerId' && !field.encrypted && field.type !== 'encryptedstring') {
                            copiable.push(field.name);
                        }
                    }
                    let template = objectName + ' this' + describe.label + ' = new ' + objectName + '(\n';
                    for (let fieldName of copiable) {
                        let field = describe.fields.find((f: any) => f.name === fieldName);
                        let f = formatField(record[fieldName], field?.type);
                        if (f !== null) {
                            template += '    // ' + fieldName + ' (' + field?.type + ')\n';
                            template += '    ' + fieldName + ' = ' + f + ',\n';
                        }
                    }
                    template = template.replace(/,\n$/, '\n');
                    template += ');';

                    let notebook = await vscode.workspace.openNotebookDocument(
                        CONSTANTS.NOTEBOOK_TYPE,
                        new vscode.NotebookData([
                            new vscode.NotebookCellData(vscode.NotebookCellKind.Code, template, 'apex-anon'),
                        ])
                    );
                    vscode.window.showNotebookDocument(notebook);
                } catch (error) {
                    vscode.window.showErrorMessage('Error generating Apex: ' + (error as Error).message);
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_TO_APEX_CHILD_PARENT,
            async () => {
                let childId = await vscode.window.showInputBox({ prompt: 'Enter Child Record ID' });
                if (!childId) {
                    return;
                }
                if (!isValidSalesforceId(childId)) {
                    vscode.window.showErrorMessage('Invalid Child Record ID format. Must be 15 or 18 alphanumeric characters.');
                    return;
                }
                let childObject = await vscode.window.showInputBox({ prompt: 'Enter Child Object Name' });
                if (!childObject) {
                    return;
                }
                if (!isValidSalesforceObjectName(childObject)) {
                    vscode.window.showErrorMessage('Invalid Child Object Name format. Must start with a letter and contain only letters, numbers, and underscores.');
                    return;
                }

                try {
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    let childDescribe = await connection.describe(childObject);
                    let childFields = childDescribe.fields.filter((f: any) => !f.encrypted && f.type !== 'encryptedstring').map((f: any) => f.name);
                    let childQuery = 'SELECT ' + childFields.join(', ') + ' FROM ' + childObject + ' WHERE Id = \'' + childId + '\'';
                    let childResult = await connection.query(childQuery);
                    if (childResult.records.length === 0) {
                        vscode.window.showErrorMessage('No child record found with the given ID.');
                        return;
                    }
                    let childRecord = childResult.records[0];
                    let childCopiable = [];
                    for (let field of childDescribe.fields) {
                        if (field.createable && field.name !== 'OwnerId' && !field.encrypted && field.type !== 'encryptedstring') {
                            childCopiable.push(field.name);
                        }
                    }
                    let childTemplate = childObject + ' this' + childDescribe.label + ' = new ' + childObject + '(\n';
                    for (let fieldName of childCopiable) {
                        let field = childDescribe.fields.find((f: any) => f.name === fieldName);
                        let f = formatField(childRecord[fieldName], field?.type);
                        if (f !== null) {
                            childTemplate += '    // ' + fieldName + ' (' + field?.type + ')\n';
                            childTemplate += '    ' + fieldName + ' = ' + f + ',\n';
                        }
                    }
                    childTemplate = childTemplate.replace(/,\n$/, '\n');
                    childTemplate += ');\n';
                    childTemplate += 'insert this' + childDescribe.label + ';\n\n';

                    // Now find parents via lookups
                    let parentTemplates = '';
                    for (let field of childDescribe.fields) {
                        if (field.type === 'reference' && field.referenceTo && field.referenceTo.length > 0 && childRecord[field.name]) {
                            let parentObject = field.referenceTo[0]; // Assume single reference
                            let parentId = childRecord[field.name];
                            let parentDescribe = await connection.describe(parentObject);
                            let parentFields = parentDescribe.fields.filter((f: any) => !f.encrypted && f.type !== 'encryptedstring').map((f: any) => f.name);
                            let parentQuery = 'SELECT ' + parentFields.join(', ') + ' FROM ' + parentObject + ' WHERE Id = \'' + parentId + '\'';
                            let parentResult = await connection.query(parentQuery);
                            if (parentResult.records.length > 0) {
                                let parentRecord = parentResult.records[0];
                                let parentCopiable = [];
                                for (let pfield of parentDescribe.fields) {
                                    if (pfield.createable && pfield.updateable && pfield.name !== 'OwnerId' && !pfield.encrypted && pfield.type !== 'encryptedstring') {
                                        parentCopiable.push(pfield.name);
                                    }
                                }
                                let parentTemplate = parentObject + ' this' + parentDescribe.label + ' = new ' + parentObject + '(\n';
                                for (let fieldName of parentCopiable) {
                                    let pfield = parentDescribe.fields.find((f: any) => f.name === fieldName);
                                    let f = formatField(parentRecord[fieldName], pfield?.type);
                                    if (f !== null) {
                                        parentTemplate += '    // ' + fieldName + ' (' + pfield?.type + ')\n';
                                        parentTemplate += '    ' + fieldName + ' = ' + f + ',\n';
                                    }
                                }
                                parentTemplate = parentTemplate.replace(/,\n$/, '\n');
                                parentTemplate += ');\n';
                                parentTemplate += 'insert this' + parentDescribe.label + ';\n\n';
                                parentTemplates += parentTemplate;
                            }
                        }
                    }

                    let fullTemplate = parentTemplates + '\n\n' + childTemplate;

                    let notebook = await vscode.workspace.openNotebookDocument(
                        CONSTANTS.NOTEBOOK_TYPE,
                        new vscode.NotebookData([
                            new vscode.NotebookCellData(vscode.NotebookCellKind.Code, fullTemplate, 'apex-anon'),
                        ])
                    );
                    vscode.window.showNotebookDocument(notebook);
                } catch (error) {
                    vscode.window.showErrorMessage('Error generating Apex: ' + (error as Error).message);
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_SCHEMA,
            async () => {
                let objectName = await vscode.window.showInputBox({ prompt: 'Enter SObject API Name' });
                if (!objectName) {
                    return;
                }
                if (!isValidSalesforceObjectName(objectName)) {
                    vscode.window.showErrorMessage('Invalid Object Name format. Must start with a letter and contain only letters, numbers, and underscores.');
                    return;
                }

                try {
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    let describe = await connection.describe(objectName);
                    
                    // Create webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'sobjectSchema',
                        `${objectName} Fields & Relationships`,
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );

                    // Generate HTML content
                    let htmlContent = generateSchemaHtml(objectName, describe.fields);
                    panel.webview.html = htmlContent;

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
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    
                    // Get all SObjects
                    const describeGlobal = await connection.describeGlobal();
                    const sobjects = describeGlobal.sobjects.map((obj: any) => ({
                        label: obj.label,
                        detail: obj.name,
                        name: obj.name
                    }));
                    
                    // Show quick pick for SObject selection
                    const selectedObject = await vscode.window.showQuickPick(sobjects, {
                        placeHolder: 'Select an SObject to view permissions',
                        matchOnDetail: true
                    });
                    
                    if (!selectedObject) {
                        return;
                    }
                    
                    const objectName = selectedObject.name;
                    
                    // Describe the object to get sharing model
                    let describe = await connection.describe(objectName);
                    
                    // Query EntityDefinition for org-wide defaults
                    let orgWideDefaultsQuery = `SELECT QualifiedApiName, Label, InternalSharingModel, ExternalSharingModel FROM EntityDefinition WHERE QualifiedApiName = '${objectName}'`;
                    let orgWideDefaultsResult = await connection.query(orgWideDefaultsQuery);
                    let orgWideDefaults = orgWideDefaultsResult.records[0];
                    
                    // Query ObjectPermissions for the SObject
                    let query = `SELECT Parent.Name, Parent.Label, Parent.IsCustom, Parent.Description, Parent.IsOwnedByProfile, Parent.Profile.Name, PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords, PermissionsViewAllFields FROM ObjectPermissions WHERE SobjectType = '${objectName}'`;
                    let result = await connection.query(query);
                    
                    // Query for permission set groups that have permissions on this object
                    // First get all permission sets that have permissions on this object
                    let psIdsQuery = `SELECT ParentId FROM ObjectPermissions WHERE SobjectType = '${objectName}' AND Parent.IsOwnedByProfile = false`;
                    let psIdsResult = await connection.query(psIdsQuery);
                    let psIds = psIdsResult.records.map((rec: any) => `'${rec.ParentId}'`).join(',');
                    
                    if (psIds) {
                        try {
                            // Find permission set groups that contain these permission sets
                            let psgQuery = `SELECT PermissionSetGroup.Id, PermissionSetGroup.DeveloperName, PermissionSetGroup.MasterLabel FROM PermissionSetGroupComponent WHERE PermissionSet.Id IN (${psIds})`;
                            let psgResult = await connection.query(psgQuery);
                            
                            // Remove duplicates
                            let uniquePsgs = psgResult.records.filter((psg: any, index: number, self: any[]) => 
                                index === self.findIndex((p: any) => p.PermissionSetGroup.Id === psg.PermissionSetGroup.Id)
                            );
                            
                            // For each permission set group, aggregate permissions from its member permission sets
                            for (let psg of uniquePsgs) {
                                let groupPsQuery = `SELECT PermissionSet.Id FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = '${psg.PermissionSetGroup.Id}'`;
                                let groupPsResult = await connection.query(groupPsQuery);
                                
                                // Aggregate permissions from all permission sets in the group
                                let aggregatedPerms = {
                                    PermissionsRead: false,
                                    PermissionsCreate: false,
                                    PermissionsEdit: false,
                                    PermissionsDelete: false,
                                    PermissionsViewAllRecords: false,
                                    PermissionsModifyAllRecords: false,
                                    PermissionsViewAllFields: false
                                };
                                
                                for (let gps of groupPsResult.records) {
                                    let gpsPermQuery = `SELECT PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords, PermissionsViewAllFields FROM ObjectPermissions WHERE ParentId = '${gps.PermissionSet.Id}' AND SobjectType = '${objectName}'`;
                                    let gpsPermResult = await connection.query(gpsPermQuery);
                                    
                                    if (gpsPermResult.records.length > 0) {
                                        let perms = gpsPermResult.records[0];
                                        aggregatedPerms.PermissionsRead = aggregatedPerms.PermissionsRead || perms.PermissionsRead;
                                        aggregatedPerms.PermissionsCreate = aggregatedPerms.PermissionsCreate || perms.PermissionsCreate;
                                        aggregatedPerms.PermissionsEdit = aggregatedPerms.PermissionsEdit || perms.PermissionsEdit;
                                        aggregatedPerms.PermissionsDelete = aggregatedPerms.PermissionsDelete || perms.PermissionsDelete;
                                        aggregatedPerms.PermissionsViewAllRecords = aggregatedPerms.PermissionsViewAllRecords || perms.PermissionsViewAllRecords;
                                        aggregatedPerms.PermissionsModifyAllRecords = aggregatedPerms.PermissionsModifyAllRecords || perms.PermissionsModifyAllRecords;
                                        aggregatedPerms.PermissionsViewAllFields = aggregatedPerms.PermissionsViewAllFields || perms.PermissionsViewAllFields;
                                    }
                                }
                                
                                // Create a permission record for the group
                                let groupPerm = {
                                    Parent: {
                                        Name: psg.PermissionSetGroup.DeveloperName,
                                        Label: psg.PermissionSetGroup.MasterLabel,
                                        IsCustom: true,
                                        Description: `Permission Set Group`,
                                        IsOwnedByProfile: false
                                    },
                                    PermissionsRead: aggregatedPerms.PermissionsRead,
                                    PermissionsCreate: aggregatedPerms.PermissionsCreate,
                                    PermissionsEdit: aggregatedPerms.PermissionsEdit,
                                    PermissionsDelete: aggregatedPerms.PermissionsDelete,
                                    PermissionsViewAllRecords: aggregatedPerms.PermissionsViewAllRecords,
                                    PermissionsModifyAllRecords: aggregatedPerms.PermissionsModifyAllRecords,
                                    PermissionsViewAllFields: aggregatedPerms.PermissionsViewAllFields,
                                    fromGroup: true
                                };
                                
                                result.records.push(groupPerm);
                            }
                        } catch (error) {
                            console.log('Permission set groups not available:', (error as Error).message);
                        }
                    }
                    
                    // Filter out records with null Parent (shouldn't happen, but safety check)
                    result.records = result.records.filter((perm: any) => perm.Parent);
                    
                    // Create webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'sobjectPermissions',
                        `${objectName} Object Access`,
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );

                    // Generate HTML content
                    let htmlContent = generatePermissionsHtml(objectName, result.records, (describe as any).sharingModel, orgWideDefaults);
                    panel.webview.html = htmlContent;

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
                    let connection = await SalesforceHandler.getSalesforceConnection();

                    // Query all SObjects
                    let globalDescribe = await connection.describeGlobal();
                    const sobjectOptions: vscode.QuickPickItem[] = globalDescribe.sobjects
                        .filter((sobject: any) => sobject.queryable && !sobject.name.endsWith('__History') && !sobject.name.endsWith('__Share') && !sobject.name.endsWith('__Feed'))
                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                        .map((sobject: any) => ({
                            label: sobject.name,
                            detail: sobject.label + (sobject.custom ? ' (Custom)' : ' (Standard)'),
                            description: sobject.name
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
                    
                    // Query all users
                    let userQuery = `SELECT Id, Name, Username FROM User WHERE IsActive = true ORDER BY Name`;
                    let userResult = await connection.query(userQuery);
                    
                    // Show quick pick for user selection
                    const userOptions: vscode.QuickPickItem[] = userResult.records.map((user: any) => ({
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
                    
                    // Describe the object to check if it's a child in Master-Detail
                    let describe = await connection.describe(objectName);
                    let masterObject = null;
                    for (let field of describe.fields) {
                        if (field.type === 'reference' && !field.nillable && field.referenceTo && field.referenceTo.length > 0 && !['OwnerId', 'CreatedById', 'LastModifiedById'].includes(field.name)) {
                            masterObject = field.referenceTo[0];
                            break;
                        }
                    }
                    let effectiveObject = masterObject || objectName;
                    
                    // Describe the effective object to determine if it's custom
                    let effectiveDescribe = await connection.describe(effectiveObject);
                    
                    // Get user's profile
                    let profileQuery = `SELECT Profile.Name, Profile.Id FROM User WHERE Id = '${userId}'`;
                    let profileResult = await connection.query(profileQuery);
                    let profileId = profileResult.records[0].Profile.Id;
                    
                    // Get permission sets assigned to user
                    let psQuery = `SELECT PermissionSet.Id, PermissionSet.Name, PermissionSet.Label, PermissionSet.IsCustom, PermissionSet.Description FROM PermissionSetAssignment WHERE AssigneeId = '${userId}' AND PermissionSet.IsOwnedByProfile = false`;
                    let psResult = await connection.query(psQuery);
                    
                    // Get permission set groups that contain the user's permission sets
                    let psgResult: any = { records: [] };
                    if (psResult.records.length > 0) {
                        try {
                            let psIds = psResult.records.map((ps: any) => `'${ps.PermissionSet.Id}'`).join(',');
                            let psgQuery = `SELECT PermissionSetGroup.Id, PermissionSetGroup.DeveloperName, PermissionSetGroup.MasterLabel FROM PermissionSetGroupComponent WHERE PermissionSet.Id IN (${psIds})`;
                            psgResult = await connection.query(psgQuery);
                            // Remove duplicates
                            psgResult.records = psgResult.records.filter((psg: any, index: number, self: any[]) => 
                                index === self.findIndex((p: any) => p.PermissionSetGroup.Id === psg.PermissionSetGroup.Id)
                            );
                        } catch (error) {
                            console.log('Permission set groups not available:', (error as Error).message);
                        }
                    }
                    
                    // Now collect all permissions
                    let permissions: any[] = [];
                    
                    // Add profile permissions
                    let profilePermRecords: any[] = [];
                    if (effectiveDescribe.custom) {
                        // For custom objects, use ObjectPermissions
                        let profilePermQuery = `SELECT Parent.Name, Parent.Label, Parent.IsCustom, Parent.Description, Parent.IsOwnedByProfile, PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords, PermissionsViewAllFields FROM ObjectPermissions WHERE ParentId = '${profileId}' AND SobjectType = '${effectiveObject}'`;
                        let profilePermResult = await connection.query(profilePermQuery);
                        profilePermRecords = profilePermResult.records;
                    } else {
                        // For standard objects, try Profile fields first, fallback to ObjectPermissions
                        try {
                            let profileFieldsQuery = `SELECT Id, Name, ${effectiveObject}PermissionsRead, ${effectiveObject}PermissionsCreate, ${effectiveObject}PermissionsEdit, ${effectiveObject}PermissionsDelete, ${effectiveObject}PermissionsViewAll, ${effectiveObject}PermissionsModifyAll, ${effectiveObject}PermissionsViewAllFields FROM Profile WHERE Id = '${profileId}'`;
                            let profileFieldsResult = await connection.query(profileFieldsQuery);
                            if (profileFieldsResult.records.length > 0) {
                                let profileRecord = profileFieldsResult.records[0];
                                profilePermRecords = [{
                                    Parent: {
                                        Name: profileRecord.Name,
                                        Label: profileRecord.Name,
                                        IsCustom: false,
                                        Description: '',
                                        IsOwnedByProfile: true
                                    },
                                    PermissionsRead: profileRecord[`${effectiveObject}PermissionsRead`],
                                    PermissionsCreate: profileRecord[`${effectiveObject}PermissionsCreate`],
                                    PermissionsEdit: profileRecord[`${effectiveObject}PermissionsEdit`],
                                    PermissionsDelete: profileRecord[`${effectiveObject}PermissionsDelete`],
                                    PermissionsViewAllRecords: profileRecord[`${effectiveObject}PermissionsViewAll`],
                                    PermissionsModifyAllRecords: profileRecord[`${effectiveObject}PermissionsModifyAll`],
                                    PermissionsViewAllFields: profileRecord[`${effectiveObject}PermissionsViewAllFields`]
                                }];
                            }
                        } catch (error) {
                            // Fallback to ObjectPermissions
                            let profilePermQuery = `SELECT Parent.Name, Parent.Label, Parent.IsCustom, Parent.Description, Parent.IsOwnedByProfile, PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords, PermissionsViewAllFields FROM ObjectPermissions WHERE ParentId = '${profileId}' AND SobjectType = '${effectiveObject}'`;
                            let profilePermResult = await connection.query(profilePermQuery);
                            profilePermRecords = profilePermResult.records;
                        }
                    }
                    permissions.push(...profilePermRecords);
                    
                    // If no profile permissions found, add a placeholder record
                    if (profilePermRecords.length === 0) {
                        let profileName = profileResult.records[0].Profile.Name;
                        profilePermRecords = [{
                            Parent: {
                                Name: profileName,
                                Label: profileName,
                                IsCustom: false,
                                Description: '',
                                IsOwnedByProfile: true
                            },
                            PermissionsRead: false,
                            PermissionsCreate: false,
                            PermissionsEdit: false,
                            PermissionsDelete: false,
                            PermissionsViewAllRecords: false,
                            PermissionsModifyAllRecords: false,
                            PermissionsViewAllFields: false
                        }];
                        permissions.push(...profilePermRecords);
                    }
                    
                    // Add permission set permissions
                    for (let ps of psResult.records) {
                        let psPermQuery = `SELECT Parent.Name, Parent.Label, Parent.IsCustom, Parent.Description, Parent.IsOwnedByProfile, PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords, PermissionsViewAllFields FROM ObjectPermissions WHERE ParentId = '${(ps as any).PermissionSet.Id}' AND SobjectType = '${effectiveObject}'`;
                        let psPermResult = await connection.query(psPermQuery);
                        permissions.push(...psPermResult.records);
                    }
                    
                    // For permission set groups, aggregate permissions from all permission sets in the group
                    for (let psg of psgResult.records) {
                        try {
                            let groupPsQuery = `SELECT PermissionSet.Id FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = '${psg.PermissionSetGroup.Id}'`;
                            let groupPsResult = await connection.query(groupPsQuery);
                            
                            // Aggregate permissions from all permission sets in the group
                            let aggregatedPerms = {
                                PermissionsRead: false,
                                PermissionsCreate: false,
                                PermissionsEdit: false,
                                PermissionsDelete: false,
                                PermissionsViewAllRecords: false,
                                PermissionsModifyAllRecords: false,
                                PermissionsViewAllFields: false
                            };
                            
                            for (let gps of groupPsResult.records) {
                                let gpsPermQuery = `SELECT PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords, PermissionsViewAllFields FROM ObjectPermissions WHERE ParentId = '${(gps as any).PermissionSet.Id}' AND SobjectType = '${effectiveObject}'`;
                                let gpsPermResult = await connection.query(gpsPermQuery);
                                
                                if (gpsPermResult.records.length > 0) {
                                    let perms = gpsPermResult.records[0];
                                    aggregatedPerms.PermissionsRead = aggregatedPerms.PermissionsRead || perms.PermissionsRead;
                                    aggregatedPerms.PermissionsCreate = aggregatedPerms.PermissionsCreate || perms.PermissionsCreate;
                                    aggregatedPerms.PermissionsEdit = aggregatedPerms.PermissionsEdit || perms.PermissionsEdit;
                                    aggregatedPerms.PermissionsDelete = aggregatedPerms.PermissionsDelete || perms.PermissionsDelete;
                                    aggregatedPerms.PermissionsViewAllRecords = aggregatedPerms.PermissionsViewAllRecords || perms.PermissionsViewAllRecords;
                                    aggregatedPerms.PermissionsModifyAllRecords = aggregatedPerms.PermissionsModifyAllRecords || perms.PermissionsModifyAllRecords;
                                    aggregatedPerms.PermissionsViewAllFields = aggregatedPerms.PermissionsViewAllFields || perms.PermissionsViewAllFields;
                                }
                            }
                            
                            // Create a permission record for the group
                            let groupPerm = {
                                Parent: {
                                    Name: psg.PermissionSetGroup.DeveloperName,
                                    Label: psg.PermissionSetGroup.MasterLabel,
                                    IsCustom: true,
                                    Description: `Permission Set Group`,
                                    IsOwnedByProfile: false
                                },
                                PermissionsRead: aggregatedPerms.PermissionsRead,
                                PermissionsCreate: aggregatedPerms.PermissionsCreate,
                                PermissionsEdit: aggregatedPerms.PermissionsEdit,
                                PermissionsDelete: aggregatedPerms.PermissionsDelete,
                                PermissionsViewAllRecords: aggregatedPerms.PermissionsViewAllRecords,
                                PermissionsModifyAllRecords: aggregatedPerms.PermissionsModifyAllRecords,
                                PermissionsViewAllFields: aggregatedPerms.PermissionsViewAllFields,
                                fromGroup: true
                            };
                            
                            permissions.push(groupPerm);
                        } catch (error) {
                            console.log('PermissionSetGroupComponent not available:', (error as Error).message);
                        }
                    }
                    
                    // Create webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'sobjectUserPermissions',
                        `${selectedUser.label} Permissions on ${objectName}${masterObject ? ` (inherited from ${masterObject})` : ''}`,
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );

                    // Generate HTML content
                    let htmlContent = generateUserPermissionsHtml(objectName, selectedUser.label, permissions);
                    panel.webview.html = htmlContent;

                    // Handle messages from webview
                    panel.webview.onDidReceiveMessage(async message => {
                        // Handle other messages if needed
                    });
                } catch (error) {
                    vscode.window.showErrorMessage('Error retrieving user permissions: ' + (error as Error).message);
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CONSTANTS.COMMAND_NAME_SOBJECT_FIELD_SECURITY,
            async () => {
                try {
                    let connection = await SalesforceHandler.getSalesforceConnection();
                    
                    // Query all SObjects
                    let sobjectQuery = `SELECT QualifiedApiName, Label FROM EntityDefinition WHERE IsQueryable = true ORDER BY Label`;
                    let sobjectResult = await connection.query(sobjectQuery);
                    
                    // Show quick pick for SObject selection
                    const sobjectOptions: vscode.QuickPickItem[] = sobjectResult.records.map((obj: any) => ({
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
                    
                    // Describe the object to get fields
                    let describe = await connection.describe(objectName);
                    let fields = describe.fields.filter((f: any) => f.type !== 'id' && !f.autoNumber && !f.calculated); // Filter out system fields
                    
                    // Get user's profile, permission sets, groups (similar to user permissions)
                    let userQuery = `SELECT Id, Name, Username FROM User WHERE IsActive = true ORDER BY Name`;
                    let userResult = await connection.query(userQuery);
                    
                    const userOptions: vscode.QuickPickItem[] = userResult.records.map((user: any) => ({
                        label: user.Name,
                        detail: user.Username,
                        id: user.Id
                    }));
                    
                    let selectedUser = await vscode.window.showQuickPick(userOptions, {
                        title: 'Select a User to Analyze Field Level Security'
                    });
                    
                    if (!selectedUser) {
                        return;
                    }
                    
                    let userId = (selectedUser as any).id;
                    
                    // Get user's profile
                    let profileQuery = `SELECT Profile.Name, Profile.Id FROM User WHERE Id = '${userId}'`;
                    let profileResult = await connection.query(profileQuery);
                    let profileId = profileResult.records[0].Profile.Id;
                    
                    // Get permission sets assigned to user
                    let psQuery = `SELECT PermissionSet.Id, PermissionSet.Name, PermissionSet.Label, PermissionSet.IsCustom, PermissionSet.Description FROM PermissionSetAssignment WHERE AssigneeId = '${userId}' AND PermissionSet.IsOwnedByProfile = false`;
                    let psResult = await connection.query(psQuery);
                    
                    // Get permission set groups assigned to user
                    let psgResult: any = { records: [] };
                    try {
                        let psgQuery = `SELECT PermissionSetGroup.Id, PermissionSetGroup.DeveloperName, PermissionSetGroup.MasterLabel FROM PermissionSetGroupMember WHERE UserOrGroupId = '${userId}'`;
                        psgResult = await connection.query(psgQuery);
                    } catch (error) {
                        console.log('PermissionSetGroupMember not available:', (error as Error).message);
                    }
                    
                    // Collect all field permissions
                    let fieldPermissions: any[] = [];
                    
                    // Profile field permissions
                    let profileFieldQuery = `SELECT Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE ParentId = '${profileId}' AND SobjectType = '${objectName}'`;
                    let profileFieldResult = await connection.query(profileFieldQuery);
                    fieldPermissions.push(...profileFieldResult.records.map((fp: any) => ({ ...fp, source: profileResult.records[0].Profile.Name, sourceType: 'profile' })));
                    
                    // Permission set field permissions
                    for (let ps of psResult.records) {
                        let psFieldQuery = `SELECT Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE ParentId = '${(ps as any).PermissionSet.Id}' AND SobjectType = '${objectName}'`;
                        let psFieldResult = await connection.query(psFieldQuery);
                        fieldPermissions.push(...psFieldResult.records.map((fp: any) => ({ ...fp, source: (ps as any).PermissionSet.Label, sourceType: 'permission-set' })));
                    }
                    
                    // Permission set group field permissions
                    for (let psg of psgResult.records) {
                        try {
                            let groupPsQuery = `SELECT PermissionSet.Id FROM PermissionSetGroupComponent WHERE PermissionSetGroupId = '${(psg as any).PermissionSetGroup.Id}'`;
                            let groupPsResult = await connection.query(groupPsQuery);
                            for (let gps of groupPsResult.records) {
                                let gpsFieldQuery = `SELECT Field, PermissionsRead, PermissionsEdit FROM FieldPermissions WHERE ParentId = '${(gps as any).PermissionSet.Id}' AND SobjectType = '${objectName}'`;
                                let gpsFieldResult = await connection.query(gpsFieldQuery);
                                fieldPermissions.push(...gpsFieldResult.records.map((fp: any) => ({ ...fp, source: (psg as any).PermissionSetGroup.MasterLabel, sourceType: 'group' })));
                            }
                        } catch (error) {
                            console.log('PermissionSetGroupComponent not available:', (error as Error).message);
                        }
                    }
                    
                    // Create webview panel
                    const panel = vscode.window.createWebviewPanel(
                        'sobjectFieldSecurity',
                        `${selectedUser.label} Field Security on ${objectName}`,
                        vscode.ViewColumn.One,
                        { enableScripts: true }
                    );

                    // Handle messages from webview
                    panel.webview.onDidReceiveMessage(async message => {
                        // Handle other messages if needed
                    });

                    // Generate HTML content
                    let htmlContent = generateFieldSecurityHtml(objectName, selectedUser.label, fields, fieldPermissions);
                    panel.webview.html = htmlContent;
                } catch (error) {
                    vscode.window.showErrorMessage('Error retrieving field security: ' + (error as Error).message);
                }
            }
        )
    );
}

// Function to generate HTML for the schema display
function generateSchemaHtml(objectName: string, fields: any[]): string {
    // Sort fields by label ascending
    fields.sort((a, b) => a.label.localeCompare(b.label));

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${objectName} Fields & Relationships</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #0070d2;
            color: white;
            padding: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .summary {
            background-color: white;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f8f8;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #e6f3ff;
        }
        .quick-find {
            margin-bottom: 10px;
        }
        .quick-find input {
            padding: 5px;
            width: 200px;
        }
        .data-type {
            font-family: monospace;
        }
        .indexed {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${objectName} Fields & Relationships</h1>
    </div>
    <div class="summary">
        ${fields.length} Items, Sorted by Field Label
    </div>
    <div class="quick-find">
        <label>Quick Find</label>
        <input type="text" id="quickFind" placeholder="Quick Find">
    </div>
    <table id="fieldsTable">
        <thead>
            <tr>
                <th>Field Label <span id="sortLabel" style="cursor:pointer;">&#9650;</span></th>
                <th>Field Name <span id="sortName" style="cursor:pointer;">&#9651;</span></th>
                <th>Data Type</th>
                <th>Controlling Field</th>
                <th class="indexed">Indexed</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>`;

    fields.forEach(field => {
        let dataType = formatDataType(field);
        let controllingField = field.controllerName || '';
        let indexed = field.indexed ? 'True' : 'False';
        let actions = ''; // Empty for now

        html += `
            <tr>
                <td>${field.label}</td>
                <td>${field.name}</td>
                <td class="data-type">${dataType}</td>
                <td>${controllingField}</td>
                <td class="indexed">${indexed}</td>
                <td>${actions}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>
    <script>
        const quickFind = document.getElementById('quickFind');
        const table = document.getElementById('fieldsTable');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        let sortDirection = { label: 1, name: 1 };

        quickFind.addEventListener('input', function() {
            const filter = this.value.toLowerCase();
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });

        document.getElementById('sortLabel').addEventListener('click', () => sortTable(0, 'label'));
        document.getElementById('sortName').addEventListener('click', () => sortTable(1, 'name'));

        function sortTable(columnIndex, key) {
            sortDirection[key] *= -1;
            rows.sort((a, b) => {
                const aText = a.cells[columnIndex].textContent;
                const bText = b.cells[columnIndex].textContent;
                return aText.localeCompare(bText) * sortDirection[key];
            });
            rows.forEach(row => tbody.appendChild(row));
            updateSortIndicators();
        }

        function updateSortIndicators() {
            document.getElementById('sortLabel').textContent = sortDirection.label === 1 ? '▲' : '▼';
            document.getElementById('sortName').textContent = sortDirection.name === 1 ? '▲' : '▼';
        }
    </script>
</body>
</html>`;

    return html;
}

// Function to format the data type nicely
function formatDataType(field: any): string {
    let type = field.type;
    switch (type) {
        case 'string':
            return `Text(${field.length})`;
        case 'textarea':
            return `Long Text Area(${field.length})`;
        case 'richtextarea':
            return `Rich Text Area(${field.length})`;
        case 'encryptedstring':
            return `Text (Encrypted)(${field.length})`;
        case 'int':
            return `Number(${field.digits || field.length})`;
        case 'double':
            if (field.precision && field.scale) {
                return `Number(${field.precision}, ${field.scale})`;
            }
            return 'Number';
        case 'currency':
            if (field.precision && field.scale) {
                return `Currency(${field.precision}, ${field.scale})`;
            }
            return 'Currency';
        case 'percent':
            if (field.precision && field.scale) {
                return `Percent(${field.precision}, ${field.scale})`;
            }
            return 'Percent';
        case 'boolean':
            return 'Checkbox';
        case 'date':
            return 'Date';
        case 'datetime':
            return 'Date/Time';
        case 'time':
            return 'Time';
        case 'picklist':
            return 'Picklist';
        case 'multipicklist':
            return 'Picklist (Multi-Select)';
        case 'reference':
            return `Lookup(${field.referenceTo ? field.referenceTo.join(', ') : 'Unknown'})`;
        case 'masterdetail':
            return `Master-Detail(${field.referenceTo ? field.referenceTo.join(', ') : 'Unknown'})`;
        case 'formula':
            let formulaType = field.calculatedFormulaType || 'text';
            return `Formula (${capitalize(formulaType)})`;
        case 'location':
            return 'Geolocation';
        case 'address':
            return 'Address';
        case 'phone':
            return 'Phone';
        case 'email':
            return 'Email';
        case 'url':
            return 'URL';
        case 'id':
            return 'ID';
        case 'base64':
            return 'Base64';
        case 'combobox':
            return 'Picklist';
        case 'anytype':
            return 'Any Type';
        default:
            return capitalize(type);
    }
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Function to generate HTML for the permissions display
function generatePermissionsHtml(objectName: string, permissions: any[], sharingModel?: string, orgWideDefaults?: any): string {
    // Count permission sets, profiles, and groups
    let permissionSets = permissions.filter(p => !p.Parent.IsOwnedByProfile && !p.fromGroup);
    let profiles = permissions.filter(p => p.Parent.IsOwnedByProfile);
    let groups = permissions.filter(p => p.fromGroup);

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${objectName} Object Access</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #0070d2;
            color: white;
            padding: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .org-wide-defaults {
            background-color: white;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .org-wide-defaults h2 {
            margin: 0 0 10px 0;
            color: #0070d2;
            font-size: 18px;
        }
        .defaults-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
        }
        .defaults-grid div {
            padding: 5px 0;
        }
        .summary {
            background-color: white;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        .counts {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
        }
        .tabs {
            display: flex;
            margin-bottom: 10px;
        }
        .tab-button {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            padding: 8px 16px;
            cursor: pointer;
            margin-right: 5px;
        }
        .tab-button.active {
            background-color: #0070d2;
            color: white;
        }
        .tab-button:hover {
            background-color: #e6f3ff;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f8f8;
            font-weight: bold;
            cursor: pointer;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #e6f3ff;
        }
        .quick-find {
            margin-bottom: 10px;
        }
        .quick-find input {
            padding: 5px;
            width: 200px;
        }
        .permission {
            text-align: center;
        }
        .enabled {
            color: green;
            font-weight: bold;
        }
        .disabled {
            color: red;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${objectName} Object Access</h1>
    </div>
    ${orgWideDefaults ? `
    <div class="org-wide-defaults">
        <h2>Org-Wide Defaults</h2>
        <div class="defaults-grid">
            <div><strong>Object:</strong> ${orgWideDefaults.Label || orgWideDefaults.QualifiedApiName}</div>
            <div><strong>Internal Sharing Model:</strong> ${orgWideDefaults.InternalSharingModel || 'Not Available'}</div>
            <div><strong>External Sharing Model:</strong> ${orgWideDefaults.ExternalSharingModel || 'Not Available'}</div>
        </div>
    </div>
    ` : ''}
    <div class="tabs">
        <button class="tab-button active" data-type="all">All (${permissions.length})</button>
        <button class="tab-button" data-type="permission-set">Permission Sets (${permissionSets.length})</button>
        <button class="tab-button" data-type="group">Permission Set Groups (${groups.length})</button>
        <button class="tab-button" data-type="profile">Profiles (${profiles.length})</button>
    </div>
    <div class="quick-find">
        <label>Search this list...</label>
        <input type="text" id="quickFind" placeholder="Search this list...">
    </div>
    
    <!-- Permissions Table -->
    <table id="permissionsTable">
        <thead>
            <tr>
                <th data-sort="label">Label</th>
                <th data-sort="apiName">API Name</th>
                <th data-sort="custom">Custom</th>
                <th data-sort="description">Description</th>
                <th data-sort="read" class="permission">Read</th>
                <th data-sort="create" class="permission">Create</th>
                <th data-sort="edit" class="permission">Edit</th>
                <th data-sort="delete" class="permission">Delete</th>
                <th data-sort="viewAll" class="permission">View All Records</th>
                <th data-sort="modifyAll" class="permission">Modify All Records</th>
                <th data-sort="viewAllFields" class="permission">View All Fields</th>
            </tr>
        </thead>
        <tbody>`;

    permissions.forEach(perm => {
        let ps = perm.Parent;
        let type = perm.fromGroup ? 'group' : (ps.IsOwnedByProfile ? 'profile' : 'permission-set');
        let custom = ps.IsCustom ? 'Custom' : '';
        let label = ps.IsOwnedByProfile ? (ps.Profile?.Name || ps.Label) : ps.Label;
        let apiName = ps.IsOwnedByProfile ? (ps.Profile?.Name || ps.Name) : ps.Name;
        let read = perm.PermissionsRead ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let create = perm.PermissionsCreate ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let edit = perm.PermissionsEdit ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let del = perm.PermissionsDelete ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let viewAll = perm.PermissionsViewAllRecords ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let modifyAll = perm.PermissionsModifyAllRecords ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let viewAllFields = perm.PermissionsViewAllFields ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';

        html += `
            <tr data-type="${type}">
                <td>${label}</td>
                <td>${apiName}</td>
                <td>${custom}</td>
                <td>${ps.Description || ''}</td>
                <td class="permission">${read}</td>
                <td class="permission">${create}</td>
                <td class="permission">${edit}</td>
                <td class="permission">${del}</td>
                <td class="permission">${viewAll}</td>
                <td class="permission">${modifyAll}</td>
                <td class="permission">${viewAllFields}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>
    <script>
        const quickFind = document.getElementById('quickFind');
        const table = document.getElementById('permissionsTable');
        const tbody = table.querySelector('tbody');
        const headers = table.querySelectorAll('th[data-sort]');
        const tabButtons = document.querySelectorAll('.tab-button');
        let sortDirections = {};
        let currentTab = 'all';

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTab = button.dataset.type;
                filterRows();
            });
        });

        headers.forEach(header => {
            header.addEventListener('click', () => sortTable(header.dataset.sort));
        });

        quickFind.addEventListener('input', filterRows);

        function filterRows() {
            const filter = quickFind.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const type = row.dataset.type;
                let show = true;
                if (currentTab !== 'all') {
                    if (currentTab === 'permission-set' && type !== 'permission-set') show = false;
                    if (currentTab === 'profile' && type !== 'profile') show = false;
                    if (currentTab === 'group' && type !== 'group') show = false;
                }
                if (show && filter && !text.includes(filter)) show = false;
                row.style.display = show ? '' : 'none';
            });
        }

        function sortTable(sortKey) {
            const rows = Array.from(tbody.querySelectorAll('tr'));
            sortDirections[sortKey] = (sortDirections[sortKey] || 1) * -1;
            rows.sort((a, b) => {
                let aVal, bVal;
                switch(sortKey) {
                    case 'label':
                        aVal = a.cells[0].textContent;
                        bVal = b.cells[0].textContent;
                        break;
                    case 'apiName':
                        aVal = a.cells[1].textContent;
                        bVal = b.cells[1].textContent;
                        break;
                    case 'custom':
                        aVal = a.cells[2].textContent;
                        bVal = b.cells[2].textContent;
                        break;
                    case 'description':
                        aVal = a.cells[3].textContent;
                        bVal = b.cells[3].textContent;
                        break;
                    case 'read':
                        aVal = a.cells[4].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[4].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'create':
                        aVal = a.cells[5].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[5].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'edit':
                        aVal = a.cells[6].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[6].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'delete':
                        aVal = a.cells[7].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[7].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'viewAll':
                        aVal = a.cells[8].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[8].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'modifyAll':
                        aVal = a.cells[9].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[9].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'viewAllFields':
                        aVal = a.cells[10].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[10].textContent.includes('Enabled') ? 1 : 0;
                        break;
                }
                if (typeof aVal === 'string') {
                    return aVal.localeCompare(bVal) * sortDirections[sortKey];
                } else {
                    return (aVal - bVal) * sortDirections[sortKey];
                }
            });
            rows.forEach(row => tbody.appendChild(row));
            filterRows(); // Re-apply filter after sorting
        }
    </script>
    </script>
</body>
</html>`;

    return html;
}

// Function to generate HTML for the user permissions display
function generateUserPermissionsHtml(objectName: string, userName: string, permissions: any[]): string {
    // Count permission sets, profiles, and groups
    let permissionSets = permissions.filter(p => !p.Parent.IsOwnedByProfile && !p.fromGroup);
    let profiles = permissions.filter(p => p.Parent.IsOwnedByProfile);
    let groups = permissions.filter(p => p.fromGroup);

    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${userName} Permissions on ${objectName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #0070d2;
            color: white;
            padding: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .summary {
            background-color: white;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        .counts {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
        }
        .tabs {
            display: flex;
            margin-bottom: 10px;
        }
        .tab-button {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            padding: 8px 16px;
            cursor: pointer;
            margin-right: 5px;
        }
        .tab-button.active {
            background-color: #0070d2;
            color: white;
        }
        .tab-button:hover {
            background-color: #e6f3ff;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f8f8;
            font-weight: bold;
            cursor: pointer;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #e6f3ff;
        }
        .quick-find {
            margin-bottom: 10px;
        }
        .quick-find input {
            padding: 5px;
            width: 200px;
        }
        .permission {
            text-align: center;
        }
        .enabled {
            color: green;
            font-weight: bold;
        }
        .disabled {
            color: red;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${userName} Permissions on ${objectName}</h1>
    </div>
    <div class="tabs">
        <button class="tab-button active" data-type="all">All (${permissions.length})</button>
        <button class="tab-button" data-type="permission-set">Permission Sets (${permissionSets.length})</button>
        <button class="tab-button" data-type="group">Permission Set Groups (${groups.length})</button>
        <button class="tab-button" data-type="profile">Profiles (${profiles.length})</button>
    </div>
    <div class="quick-find">
        <label>Search this list...</label>
        <input type="text" id="quickFind" placeholder="Search this list...">
    </div>
    <table id="permissionsTable">
        <thead>
            <tr>
                <th data-sort="label">Label</th>
                <th data-sort="apiName">API Name</th>
                <th data-sort="custom">Custom</th>
                <th data-sort="description">Description</th>
                <th data-sort="read" class="permission">Read</th>
                <th data-sort="create" class="permission">Create</th>
                <th data-sort="edit" class="permission">Edit</th>
                <th data-sort="delete" class="permission">Delete</th>
                <th data-sort="viewAll" class="permission">View All Records</th>
                <th data-sort="modifyAll" class="permission">Modify All Records</th>
                <th data-sort="viewAllFields" class="permission">View All Fields</th>
            </tr>
        </thead>
        <tbody>`;

    permissions.forEach(perm => {
        let ps = perm.Parent;
        let type = ps.IsOwnedByProfile ? 'profile' : (perm.fromGroup ? 'group' : 'permission-set');
        let custom = ps.IsCustom ? 'Custom' : '';
        let description = ps.Description || '';
        if (perm.fromGroup && type !== 'group') {
            description += ` (from Group: ${perm.fromGroup})`;
        }
        let read = perm.PermissionsRead ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let create = perm.PermissionsCreate ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let edit = perm.PermissionsEdit ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let del = perm.PermissionsDelete ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let viewAll = perm.PermissionsViewAllRecords ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let modifyAll = perm.PermissionsModifyAllRecords ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
        let viewAllFields = perm.PermissionsViewAllFields ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';

        html += `
            <tr data-type="${type}">
                <td>${ps.Label}</td>
                <td>${ps.Name}</td>
                <td>${custom}</td>
                <td>${description}</td>
                <td class="permission">${read}</td>
                <td class="permission">${create}</td>
                <td class="permission">${edit}</td>
                <td class="permission">${del}</td>
                <td class="permission">${viewAll}</td>
                <td class="permission">${modifyAll}</td>
                <td class="permission">${viewAllFields}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>
    <script>
        const quickFind = document.getElementById('quickFind');
        const table = document.getElementById('permissionsTable');
        const tbody = table.querySelector('tbody');
        const headers = table.querySelectorAll('th[data-sort]');
        const tabButtons = document.querySelectorAll('.tab-button');
        let sortDirections = {};
        let currentTab = 'all';

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTab = button.dataset.type;
                filterRows();
            });
        });

        headers.forEach(header => {
            header.addEventListener('click', () => sortTable(header.dataset.sort));
        });

        quickFind.addEventListener('input', filterRows);

        function filterRows() {
            const filter = quickFind.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const type = row.dataset.type;
                let show = true;
                if (currentTab !== 'all') {
                    if (currentTab === 'permission-set' && type !== 'permission-set') show = false;
                    if (currentTab === 'profile' && type !== 'profile') show = false;
                    if (currentTab === 'group' && type !== 'group') show = false;
                }
                if (show && filter && !text.includes(filter)) show = false;
                row.style.display = show ? '' : 'none';
            });
        }

        function sortTable(sortKey) {
            const rows = Array.from(tbody.querySelectorAll('tr'));
            sortDirections[sortKey] = (sortDirections[sortKey] || 1) * -1;
            rows.sort((a, b) => {
                let aVal, bVal;
                switch(sortKey) {
                    case 'label':
                        aVal = a.cells[0].textContent;
                        bVal = b.cells[0].textContent;
                        break;
                    case 'apiName':
                        aVal = a.cells[1].textContent;
                        bVal = b.cells[1].textContent;
                        break;
                    case 'custom':
                        aVal = a.cells[2].textContent;
                        bVal = b.cells[2].textContent;
                        break;
                    case 'description':
                        aVal = a.cells[3].textContent;
                        bVal = b.cells[3].textContent;
                        break;
                    case 'read':
                        aVal = a.cells[4].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[4].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'create':
                        aVal = a.cells[5].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[5].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'edit':
                        aVal = a.cells[6].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[6].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'delete':
                        aVal = a.cells[7].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[7].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'viewAll':
                        aVal = a.cells[8].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[8].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'modifyAll':
                        aVal = a.cells[9].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[9].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'viewAllFields':
                        aVal = a.cells[10].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[10].textContent.includes('Enabled') ? 1 : 0;
                        break;
                }
                if (typeof aVal === 'string') {
                    return aVal.localeCompare(bVal) * sortDirections[sortKey];
                } else {
                    return (aVal - bVal) * sortDirections[sortKey];
                }
            });
            rows.forEach(row => tbody.appendChild(row));
            filterRows(); // Re-apply filter after sorting
        }
    </script>
</body>
</html>`;

    return html;
}

// Function to generate HTML for the field security display
function generateFieldSecurityHtml(objectName: string, userName: string, fields: any[], fieldPermissions: any[]): string {
    // Group permissions by field
    let fieldMap: { [key: string]: any } = {};
    fields.forEach(field => {
        fieldMap[field.name] = {
            label: field.label,
            name: field.name,
            permissions: []
        };
    });
    
    fieldPermissions.forEach(fp => {
        if (fieldMap[fp.Field]) {
            fieldMap[fp.Field].permissions.push({
                source: fp.source,
                sourceType: fp.sourceType,
                read: fp.PermissionsRead,
                edit: fp.PermissionsEdit
            });
        }
    });
    
    // Count sources
    let profiles = fieldPermissions.filter(fp => fp.sourceType === 'profile').map(fp => fp.source).filter((v, i, a) => a.indexOf(v) === i);
    let permissionSets = fieldPermissions.filter(fp => fp.sourceType === 'permission-set').map(fp => fp.source).filter((v, i, a) => a.indexOf(v) === i);
    let groups = fieldPermissions.filter(fp => fp.sourceType === 'group').map(fp => fp.source).filter((v, i, a) => a.indexOf(v) === i);
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${userName} Field Security on ${objectName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #0070d2;
            color: white;
            padding: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .summary {
            background-color: white;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        .counts {
            display: flex;
            gap: 20px;
            margin-bottom: 10px;
        }
        .tabs {
            display: flex;
            margin-bottom: 10px;
        }
        .tab-button {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            padding: 8px 16px;
            cursor: pointer;
            margin-right: 5px;
        }
        .tab-button.active {
            background-color: #0070d2;
            color: white;
        }
        .tab-button:hover {
            background-color: #e6f3ff;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f8f8;
            font-weight: bold;
            cursor: pointer;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #e6f3ff;
        }
        .quick-find {
            margin-bottom: 10px;
        }
        .quick-find input {
            padding: 5px;
            width: 200px;
        }
        .permission {
            text-align: center;
        }
        .enabled {
            color: green;
            font-weight: bold;
        }
        .disabled {
            color: red;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${userName} Field Security on ${objectName}</h1>
    </div>
    <div class="tabs">
        <button class="tab-button active" data-type="all">All</button>
        <button class="tab-button" data-type="profile">Profiles</button>
        <button class="tab-button" data-type="permission-set">Permission Sets</button>
        <button class="tab-button" data-type="group">Permission Set Groups</button>
    </div>
    <div class="quick-find">
        <label>Search fields...</label>
        <input type="text" id="quickFind" placeholder="Search fields...">
    </div>
    <table id="fieldSecurityTable">
        <thead>
            <tr>
                <th data-sort="label">Field Label</th>
                <th data-sort="name">Field Name</th>
                <th data-sort="source">Source</th>
                <th data-sort="read" class="permission">Read</th>
                <th data-sort="edit" class="permission">Edit</th>
            </tr>
        </thead>
        <tbody>`;

    Object.values(fieldMap).forEach((fieldInfo: any) => {
        fieldInfo.permissions.forEach((perm: any) => {
            let read = perm.read ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
            let edit = perm.edit ? '<span class="enabled">Enabled</span>' : '<span class="disabled">Disabled</span>';
            
            html += `
                <tr data-type="${perm.sourceType}">
                    <td>${fieldInfo.label}</td>
                    <td>${fieldInfo.name}</td>
                    <td>${perm.source}</td>
                    <td class="permission">${read}</td>
                    <td class="permission">${edit}</td>
                </tr>`;
        });
        
        // If no permissions for this field, show with no access
        if (fieldInfo.permissions.length === 0) {
            html += `
                <tr data-type="none">
                    <td>${fieldInfo.label}</td>
                    <td>${fieldInfo.name}</td>
                    <td>No permissions set</td>
                    <td class="permission"><span class="disabled">Disabled</span></td>
                    <td class="permission"><span class="disabled">Disabled</span></td>
                </tr>`;
        }
    });

    html += `
        </tbody>
    </table>
    <script>
        const vscode = acquireVsCodeApi();
        const quickFind = document.getElementById('quickFind');
        const table = document.getElementById('fieldSecurityTable');
        const tbody = table.querySelector('tbody');
        const headers = table.querySelectorAll('th[data-sort]');
        const tabButtons = document.querySelectorAll('.tab-button');
        let sortDirections = {};
        let currentTab = 'all';

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentTab = button.dataset.type;
                filterRows();
            });
        });

        headers.forEach(header => {
            header.addEventListener('click', () => sortTable(header.dataset.sort));
        });

        quickFind.addEventListener('input', filterRows);

        function filterRows() {
            const filter = quickFind.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const type = row.dataset.type;
                let show = true;
                if (currentTab !== 'all') {
                    if (currentTab === 'profile' && type !== 'profile') show = false;
                    if (currentTab === 'permission-set' && type !== 'permission-set') show = false;
                    if (currentTab === 'group' && type !== 'group') show = false;
                }
                if (show && filter && !text.includes(filter)) show = false;
                row.style.display = show ? '' : 'none';
            });
        }

        function sortTable(sortKey) {
            const rows = Array.from(tbody.querySelectorAll('tr'));
            sortDirections[sortKey] = (sortDirections[sortKey] || 1) * -1;
            rows.sort((a, b) => {
                let aVal, bVal;
                switch(sortKey) {
                    case 'label':
                        aVal = a.cells[0].textContent;
                        bVal = b.cells[0].textContent;
                        break;
                    case 'name':
                        aVal = a.cells[1].textContent;
                        bVal = b.cells[1].textContent;
                        break;
                    case 'source':
                        aVal = a.cells[2].textContent;
                        bVal = b.cells[2].textContent;
                        break;
                    case 'read':
                        aVal = a.cells[3].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[3].textContent.includes('Enabled') ? 1 : 0;
                        break;
                    case 'edit':
                        aVal = a.cells[4].textContent.includes('Enabled') ? 1 : 0;
                        bVal = b.cells[4].textContent.includes('Enabled') ? 1 : 0;
                        break;
                }
                if (typeof aVal === 'string') {
                    return aVal.localeCompare(bVal) * sortDirections[sortKey];
                } else {
                    return (aVal - bVal) * sortDirections[sortKey];
                }
            });
            rows.forEach(row => tbody.appendChild(row));
            filterRows(); // Re-apply filter after sorting
        }
    </script>
</body>
</html>`;

    return html;
}

// this method is called when your extension is deactivated
export function deactivate() {}
