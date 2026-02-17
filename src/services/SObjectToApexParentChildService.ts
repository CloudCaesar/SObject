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

import * as vscode from 'vscode';
import { ObjectPermissionsService } from './ObjectPermissionsService';
import * as SalesforceHandler from '../handlers/salesforceHandler';
import * as CONSTANTS from '../constants';
import { formatField } from '../extension';

/**
 * Service for generating Apex code from parent records and their child relationships
 */
export class SObjectToApexParentChildService {
    /**
     * Execute the SObject to Apex Parent Child command
     */
    async execute(): Promise<void> {
        try {
            // Initialize services
            const permissionsService = new ObjectPermissionsService();
            await permissionsService.initialize();

            // Step 1: Get queryable SObjects and let user select parent object
            const sobjectRecords = await permissionsService.getQueryableSObjects();
            const sobjectOptions: vscode.QuickPickItem[] = sobjectRecords.map((obj: any) => ({
                label: obj.Label,
                detail: obj.QualifiedApiName,
                apiName: obj.QualifiedApiName
            }));

            const selectedSObject = await vscode.window.showQuickPick(sobjectOptions, {
                title: 'Select Parent SObject Type'
            });

            if (!selectedSObject) {
                return;
            }

            const parentObject = (selectedSObject as any).apiName;

            // Step 2: Describe the parent object and let user select a field to search
            const connection = await SalesforceHandler.getSalesforceConnection();
            const parentDescribe = await connection.describe(parentObject);

            // Filter fields similar to other commands (exclude system fields, etc.)
            const fields = parentDescribe.fields.filter((f: any) =>
                f.type !== 'id' &&
                !f.autoNumber &&
                !f.calculated &&
                !(f.type === 'reference' && typeof f.relationshipOrder === 'number') &&
                !['CreatedById', 'CreatedDate', 'LastModifiedById', 'LastModifiedDate',
                  'SystemModstamp', 'IsDeleted', 'LastViewedDate', 'LastReferencedDate'].includes(f.name)
            );

            const fieldOptions: vscode.QuickPickItem[] = fields
                .sort((a: any, b: any) => a.label.localeCompare(b.label))
                .map((field: any) => ({
                    label: field.label,
                    detail: field.name,
                    description: field.type,
                    fieldName: field.name
                }));

            const selectedField = await vscode.window.showQuickPick(fieldOptions, {
                title: 'Select a Field to Query Parent Records By',
                matchOnDetail: true,
                matchOnDescription: true
            });

            if (!selectedField) {
                return;
            }

            const fieldName = (selectedField as any).fieldName;
            const fieldType = selectedField.description;

            // Step 3: Let user select comparison operator
            const comparisonOperators = [
                { label: '=', detail: 'Equals (exact match)', operator: '=' },
                { label: '!=', detail: 'Not equals', operator: '!=' },
                { label: '<', detail: 'Less than', operator: '<' },
                { label: '<=', detail: 'Less than or equal to', operator: '<=' },
                { label: '>', detail: 'Greater than', operator: '>' },
                { label: '>=', detail: 'Greater than or equal to', operator: '>=' },
                { label: 'LIKE', detail: 'Pattern matching (use % for wildcards)', operator: 'LIKE' },
                { label: 'IN', detail: 'Equals any value in a list (comma-separated)', operator: 'IN' },
                { label: 'NOT IN', detail: 'Not equal to any value in a list', operator: 'NOT IN' }
            ];

            // Add multi-select picklist operators if the field is a multi-select picklist
            const selectedFieldMeta = fields.find((f: any) => f.name === fieldName);
            if (selectedFieldMeta && selectedFieldMeta.type === 'multipicklist') {
                comparisonOperators.push(
                    { label: 'INCLUDES', detail: 'Multi-select picklist contains value(s)', operator: 'INCLUDES' },
                    { label: 'EXCLUDES', detail: 'Multi-select picklist does not contain value(s)', operator: 'EXCLUDES' }
                );
            }

            const selectedOperator = await vscode.window.showQuickPick(comparisonOperators, {
                title: 'Select Comparison Operator'
            });

            if (!selectedOperator) {
                return;
            }

            const operator = (selectedOperator as any).operator;

            // Step 4: Ask for value to compare against
            let valuePrompt = 'Enter value to compare against';
            if (operator === 'LIKE') {
                valuePrompt += ' (wildcards % added automatically for partial matching)';
            } else if (operator === 'IN' || operator === 'NOT IN') {
                valuePrompt += ' (comma-separated list)';
            } else if (operator === 'INCLUDES' || operator === 'EXCLUDES') {
                valuePrompt += ' (semicolon-separated for multiple values)';
            }

            const compareValue = await vscode.window.showInputBox({
                prompt: valuePrompt,
                placeHolder: operator === 'LIKE' ? 'Test' : operator === 'IN' ? 'Value1,Value2' : 'Value'
            });

            if (compareValue === undefined) { // Allow empty string but not cancelled
                return;
            }

            // Step 5: Build and execute SOQL query for parent records
            let whereClause: string;
            if (operator === 'IN' || operator === 'NOT IN') {
                // Handle comma-separated list
                const values = compareValue.split(',').map(v => `'${v.trim()}'`).join(', ');
                whereClause = `${fieldName} ${operator} (${values})`;
            } else if (operator === 'LIKE') {
                // Automatically add wildcards if not provided
                let likeValue = compareValue;
                if (!likeValue.includes('%')) {
                    likeValue = `%${likeValue}%`;
                }
                whereClause = `${fieldName} ${operator} '${likeValue}'`;
            } else if (fieldType === 'string' || fieldType === 'textarea' || fieldType === 'phone' || fieldType === 'email' || fieldType === 'url') {
                // String fields need quotes
                whereClause = `${fieldName} ${operator} '${compareValue}'`;
            } else {
                // Numeric, date, boolean fields don't need quotes
                whereClause = `${fieldName} ${operator} ${compareValue}`;
            }

            // Query parent records (limit to 100 for performance)
            const queryFields = ['Id', 'Name', fieldName].filter((f, index, arr) => arr.indexOf(f) === index); // Remove duplicates
            const parentQuery = `SELECT ${queryFields.join(', ')} FROM ${parentObject} WHERE ${whereClause} LIMIT 100`;

            console.log(`[SObject to Apex ParentChild] Executing parent query: ${parentQuery}`);
            const parentResult = await connection.query(parentQuery);

            if (parentResult.records.length === 0) {
                vscode.window.showErrorMessage('No parent records found matching the criteria.');
                return;
            }

            // Step 6: Let user select one parent record
            const parentRecordOptions: vscode.QuickPickItem[] = parentResult.records.map((record: any) => ({
                label: record.Name || record.Id,
                detail: `${fieldName}: ${record[fieldName]} | ID: ${record.Id}`,
                recordId: record.Id
            }));

            const selectedParentRecord = await vscode.window.showQuickPick(parentRecordOptions, {
                title: `Select a Parent Record (${parentResult.records.length} found)`
            });

            if (!selectedParentRecord) {
                return;
            }

            const parentId = (selectedParentRecord as any).recordId;

            // Get child relationships
            let childRelationships = parentDescribe.childRelationships.filter((rel: any) => rel.relationshipName);

            if (childRelationships.length === 0) {
                vscode.window.showErrorMessage('No child relationships found for this object.');
                return;
            }

            // Let user select child relationship
            const relationshipOptions: vscode.QuickPickItem[] = childRelationships.map((rel: any) => ({
                label: rel.relationshipName,
                detail: `${rel.childSObject} (${rel.field})`
            }));

            const selectedRelationship = await vscode.window.showQuickPick(relationshipOptions, {
                title: 'Select Child Relationship'
            });

            if (!selectedRelationship) {
                return;
            }

            const relationship = childRelationships.find((rel: any) => rel.relationshipName === selectedRelationship.label);

            if (!relationship) {
                vscode.window.showErrorMessage('Selected relationship not found.');
                return;
            }

            // Query child records
            const childQuery = `SELECT Id, Name FROM ${relationship.childSObject} WHERE ${relationship.field} = '${parentId}' LIMIT 10`;
            const childResult = await connection.query(childQuery);

            if (childResult.records.length === 0) {
                vscode.window.showErrorMessage('No child records found.');
                return;
            }

            // Let user select child records (multi-select with "Select All" option)
            const childOptions: vscode.QuickPickItem[] = [
                { label: 'Select All', detail: 'Select all child records' },
                ...childResult.records.map((record: any) => ({
                    label: record.Name || record.Id,
                    detail: `ID: ${record.Id}`,
                    recordId: record.Id
                }))
            ];

            const selectedChildren = await vscode.window.showQuickPick(childOptions, {
                title: `Select Child Records (${childResult.records.length} found)`,
                canPickMany: true,
                placeHolder: 'Select one or more child records (or "Select All")'
            });

            if (!selectedChildren || selectedChildren.length === 0) {
                return;
            }

            // Handle "Select All" option
            let childRecordsToProcess = [];
            if (selectedChildren.some(item => item.label === 'Select All')) {
                childRecordsToProcess = childResult.records;
            } else {
                childRecordsToProcess = selectedChildren
                    .filter(item => item.label !== 'Select All')
                    .map(selected =>
                        childResult.records.find((record: any) => record.Id === (selected as any).recordId)
                    ).filter(record => record !== undefined);
            }

            if (childRecordsToProcess.length === 0) {
                vscode.window.showErrorMessage('No valid child records selected.');
                return;
            }

            // Generate Apex for parent
            let parentCopiable = [];
            for (let pfield of parentDescribe.fields) {
                if (pfield.createable && pfield.updateable && pfield.name !== 'OwnerId' && !pfield.encrypted && pfield.type !== 'encryptedstring') {
                    parentCopiable.push(pfield.name);
                }
            }

            const fullParentQuery = `SELECT ${parentCopiable.join(', ')} FROM ${parentObject} WHERE Id = '${parentId}'`;
            const fullParentResult = await connection.query(fullParentQuery);

            if (fullParentResult.records.length === 0) {
                vscode.window.showErrorMessage('Parent record not found.');
                return;
            }

            let parentRecord = fullParentResult.records[0];
            let parentVariableName = 'this' + parentDescribe.label.replace(/\s+/g, ''); // Remove spaces for variable name
            let parentTemplate = parentObject + ' ' + parentVariableName + ' = new ' + parentObject + '(\n';
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
            parentTemplate += 'insert ' + parentVariableName + ';\n\n';

            // Generate Apex for child records
            const childDescribe = await connection.describe(relationship.childSObject);
            const childCopiable = [];
            for (let cfield of childDescribe.fields) {
                if (cfield.createable && cfield.updateable && cfield.name !== 'OwnerId' && !cfield.encrypted && cfield.type !== 'encryptedstring') {
                    childCopiable.push(cfield.name);
                }
            }

            let childTemplates = '';
            if (childRecordsToProcess.length > 0) {
                // Create a clean object name for the list (remove underscores and make it PascalCase)
                let cleanObjectName = relationship.childSObject.replace(/__c$/, '').replace(/_/g, '');
                let listVariableName = cleanObjectName + 'List';
                childTemplates = 'List<' + relationship.childSObject + '> ' + listVariableName + ' = new List<' + relationship.childSObject + '>();\n\n';

                for (let i = 0; i < childRecordsToProcess.length; i++) {
                    const childRecord = childRecordsToProcess[i];
                    if (!childRecord || !childRecord.Id) {
                        continue; // Skip invalid records
                    }
                    const fullChildQuery = `SELECT ${childCopiable.join(', ')} FROM ${relationship.childSObject} WHERE Id = '${childRecord.Id}'`;
                    const fullChildResult = await connection.query(fullChildQuery);

                    if (fullChildResult.records.length === 0) {
                        continue; // Skip if child record not found
                    }

                    let childRecordFull = fullChildResult.records[0];
                    let recordVariableName = cleanObjectName.toLowerCase() + (i + 1);
                    childTemplates += relationship.childSObject + ' ' + recordVariableName + ' = new ' + relationship.childSObject + '(\n';
                    childTemplates += '    ' + relationship.field + ' = ' + parentVariableName + '.Id,\n';
                    for (let fieldName of childCopiable) {
                        if (fieldName !== relationship.field) {
                            let cfield = childDescribe.fields.find((f: any) => f.name === fieldName);
                            let f = formatField(childRecordFull[fieldName], cfield?.type);
                            if (f !== null) {
                                childTemplates += '    // ' + fieldName + ' (' + cfield?.type + ')\n';
                                childTemplates += '    ' + fieldName + ' = ' + f + ',\n';
                            }
                        }
                    }
                    childTemplates = childTemplates.replace(/,\n$/, '\n');
                    childTemplates += ');\n';
                    childTemplates += listVariableName + '.add(' + recordVariableName + ');\n\n';
                }

                childTemplates += 'insert ' + listVariableName + ';\n\n';
            }

            let fullTemplate = parentTemplate + childTemplates;

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
}