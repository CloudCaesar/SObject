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
 * Service for generating Apex code from SObject records
 */
export class SObjectToApexService {
    /**
     * Execute the SObject to Apex command
     */
    async execute(): Promise<void> {
        try {
            // Initialize services
            const permissionsService = new ObjectPermissionsService();
            await permissionsService.initialize();

            // Step 1: Get queryable SObjects and let user select one
            const sobjectRecords = await permissionsService.getQueryableSObjects();
            const sobjectOptions: vscode.QuickPickItem[] = sobjectRecords.map((obj: any) => ({
                label: obj.Label,
                detail: obj.QualifiedApiName,
                apiName: obj.QualifiedApiName
            }));

            const selectedSObject = await vscode.window.showQuickPick(sobjectOptions, {
                title: 'Select an SObject Type'
            });

            if (!selectedSObject) {
                return;
            }

            const objectName = (selectedSObject as any).apiName;

            // Step 2: Describe the object and let user select a field
            const connection = await SalesforceHandler.getSalesforceConnection();
            const describe = await connection.describe(objectName);

            // Filter fields similar to other commands (exclude system fields, etc.)
            const fields = describe.fields.filter((f: any) =>
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
                title: 'Select a Field to Query By',
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

            // Step 5: Build and execute SOQL query
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

            // Query records (limit to 100 for performance)
            const queryFields = ['Id', 'Name', fieldName].filter((f, index, arr) => arr.indexOf(f) === index); // Remove duplicates
            const query = `SELECT ${queryFields.join(', ')} FROM ${objectName} WHERE ${whereClause} LIMIT 100`;

            console.log(`[SObject to Apex] Executing query: ${query}`);
            const result = await connection.query(query);

            if (result.records.length === 0) {
                vscode.window.showErrorMessage('No records found matching the criteria.');
                return;
            }

            // Step 6: Let user select one of the returned records
            const recordOptions: vscode.QuickPickItem[] = result.records.map((record: any) => ({
                label: record.Name || record.Id,
                detail: `${fieldName}: ${record[fieldName]} | ID: ${record.Id}`,
                recordId: record.Id
            }));

            const selectedRecord = await vscode.window.showQuickPick(recordOptions, {
                title: `Select a Record (${result.records.length} found)`
            });

            if (!selectedRecord) {
                return;
            }

            const recordId = (selectedRecord as any).recordId;

            // Step 7: Generate Apex code for the selected record (reuse existing logic)
            const fullRecordQuery = 'SELECT ' + describe.fields.filter((f: any) => !f.encrypted && f.type !== 'encryptedstring').map((f: any) => f.name).join(', ') + ' FROM ' + objectName + ' WHERE Id = \'' + recordId + '\'';
            const fullResult = await connection.query(fullRecordQuery);

            if (fullResult.records.length === 0) {
                vscode.window.showErrorMessage('Selected record not found.');
                return;
            }

            const record = fullResult.records[0];
            const copiable = [];
            for (const field of describe.fields) {
                if (field.createable && field.updateable && field.name !== 'OwnerId' && !field.encrypted && field.type !== 'encryptedstring') {
                    copiable.push(field.name);
                }
            }

            let variableName = 'this' + describe.label.replace(/\s+/g, ''); // Remove spaces for variable name
            let template = objectName + ' ' + variableName + ' = new ' + objectName + '(\n';
            for (const fieldName of copiable) {
                const field = describe.fields.find((f: any) => f.name === fieldName);
                const f = formatField(record[fieldName], field?.type);
                if (f !== null) {
                    template += '    // ' + fieldName + ' (' + field?.type + ')\n';
                    template += '    ' + fieldName + ' = ' + f + ',\n';
                }
            }
            template = template.replace(/,\n$/, '\n');
            template += ');\n\n';
            template += 'insert ' + variableName + ';\n\n';

            const notebook = await vscode.workspace.openNotebookDocument(
                CONSTANTS.NOTEBOOK_TYPE,
                new vscode.NotebookData([
                    new vscode.NotebookCellData(vscode.NotebookCellKind.Code, template, 'apex-anon'),
                ])
            );
            vscode.window.showNotebookDocument(notebook);

        } catch (error) {
            vscode.window.showErrorMessage('Error in SObject to Apex command: ' + (error as Error).message);
        }
    }
}