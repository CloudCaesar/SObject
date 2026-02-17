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
 * Service for generating Apex code from child records and their parent relationships
 */
export class SObjectToApexChildParentService {
    /**
     * Execute the SObject to Apex Child Parent command
     */
    async execute(): Promise<void> {
        try {
            // Initialize services
            const permissionsService = new ObjectPermissionsService();
            await permissionsService.initialize();

            // Step 1: Get queryable SObjects and let user select child object
            const sobjectRecords = await permissionsService.getQueryableSObjects();
            const sobjectOptions: vscode.QuickPickItem[] = sobjectRecords.map((obj: any) => ({
                label: obj.Label,
                detail: obj.QualifiedApiName,
                apiName: obj.QualifiedApiName
            }));

            const selectedSObject = await vscode.window.showQuickPick(sobjectOptions, {
                title: 'Select Child SObject Type'
            });

            if (!selectedSObject) {
                return;
            }

            const childObject = (selectedSObject as any).apiName;

            // Step 2: Describe the child object and let user select a field to search
            const connection = await SalesforceHandler.getSalesforceConnection();
            const childDescribe = await connection.describe(childObject);

            // Filter fields similar to other commands (exclude system fields, etc.)
            const fields = childDescribe.fields.filter((f: any) =>
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
                title: 'Select a Field to Query Child Records By',
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

            // Step 5: Build and execute SOQL query for child records
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

            // Query child records (limit to 100 for performance)
            const queryFields = ['Id', 'Name', fieldName].filter((f, index, arr) => arr.indexOf(f) === index); // Remove duplicates
            const childQuery = `SELECT ${queryFields.join(', ')} FROM ${childObject} WHERE ${whereClause} LIMIT 100`;

            console.log(`[SObject to Apex ChildParent] Executing child query: ${childQuery}`);
            const childResult = await connection.query(childQuery);

            if (childResult.records.length === 0) {
                vscode.window.showErrorMessage('No child records found matching the criteria.');
                return;
            }

            // Step 6: Let user select one child record
            const childRecordOptions: vscode.QuickPickItem[] = childResult.records.map((record: any) => ({
                label: record.Name || record.Id,
                detail: `${fieldName}: ${record[fieldName]} | ID: ${record.Id}`,
                recordId: record.Id
            }));

            const selectedChildRecord = await vscode.window.showQuickPick(childRecordOptions, {
                title: `Select a Child Record (${childResult.records.length} found)`
            });

            if (!selectedChildRecord) {
                return;
            }

            const childId = (selectedChildRecord as any).recordId;

            // Get full child record data
            let childFields = childDescribe.fields.filter((f: any) => !f.encrypted && f.type !== 'encryptedstring').map((f: any) => f.name);
            let fullChildQuery = 'SELECT ' + childFields.join(', ') + ' FROM ' + childObject + ' WHERE Id = \'' + childId + '\'';
            let fullChildResult = await connection.query(fullChildQuery);
            if (fullChildResult.records.length === 0) {
                vscode.window.showErrorMessage('Child record not found.');
                return;
            }
            let childRecord = fullChildResult.records[0];
            let childCopiable = [];
            for (let field of childDescribe.fields) {
                if (field.createable && field.name !== 'OwnerId' && !field.encrypted && field.type !== 'encryptedstring') {
                    childCopiable.push(field.name);
                }
            }

            // Now find parents via lookups
            let parentTemplates = '';
            let parentVariables: { [key: string]: string } = {}; // Track field name -> variable name mapping
            let objectCounters: { [key: string]: number } = {}; // Track counters for unique naming

            for (let field of childDescribe.fields) {
                if (field.type === 'reference' && field.referenceTo && field.referenceTo.length > 0 && childRecord[field.name]) {
                    // Skip standard system User lookup fields that shouldn't be generated as parent records
                    const systemUserFields = ['CreatedById', 'LastModifiedById', 'OwnerId'];
                    if (systemUserFields.includes(field.name)) {
                        continue;
                    }

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

                        // Create unique variable name for this parent instance
                        let counter = objectCounters[parentObject] || 0;
                        objectCounters[parentObject] = counter + 1;

                        let baseName = 'this' + parentDescribe.label.replace(/\s+/g, ''); // Remove spaces for variable name
                        let parentVariableName = counter === 0 ? baseName : baseName + counter;

                        parentVariables[field.name] = parentVariableName; // Track the variable name for this specific field

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
                        parentTemplates += parentTemplate;
                    }
                }
            }

            // Generate child template with dynamic lookup references
            let childVariableName = 'this' + childDescribe.label.replace(/\s+/g, '');
            let childTemplate = childObject + ' ' + childVariableName + ' = new ' + childObject + '(\n';
            for (let fieldName of childCopiable) {
                let field = childDescribe.fields.find((f: any) => f.name === fieldName);
                let fieldValue = childRecord[fieldName];

                // Check if this is a lookup field that references a parent we generated
                let fieldAssignment: string | null = null;
                if (field?.type === 'reference' && field.referenceTo && field.referenceTo.length > 0) {
                    if (parentVariables[fieldName] && fieldValue) {
                        // Use the parent variable's Id instead of hard-coded value
                        fieldAssignment = parentVariables[fieldName] + '.Id';
                    }
                }

                // If not a dynamic lookup, use the normal formatField
                if (fieldAssignment === null) {
                    fieldAssignment = formatField(fieldValue, field?.type);
                }

                if (fieldAssignment !== null) {
                    childTemplate += '    // ' + fieldName + ' (' + field?.type + ')\n';
                    childTemplate += '    ' + fieldName + ' = ' + fieldAssignment + ',\n';
                }
            }
            childTemplate = childTemplate.replace(/,\n$/, '\n');
            childTemplate += ');\n';
            childTemplate += 'insert ' + childVariableName + ';\n\n';

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
}