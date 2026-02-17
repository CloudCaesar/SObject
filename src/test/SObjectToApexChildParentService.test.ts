import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { SObjectToApexChildParentService } from '../../src/services/SObjectToApexChildParentService';
import { ObjectPermissionsService } from '../../src/services/ObjectPermissionsService';
import * as SalesforceHandler from '../../src/handlers/salesforceHandler';

describe('SObjectToApexChildParentService', () => {
    let service: SObjectToApexChildParentService;
    let sandbox: sinon.SinonSandbox;
    let mockConnection: any;
    let mockWorkspace: any;
    let mockWindow: any;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        service = new SObjectToApexChildParentService();

        // Mock ObjectPermissionsService prototype methods
        sandbox.stub(ObjectPermissionsService.prototype, 'initialize').resolves();
        sandbox.stub(ObjectPermissionsService.prototype, 'getQueryableSObjects').resolves([]);

        // Mock Salesforce connection
        mockConnection = {
            describe: sandbox.stub(),
            query: sandbox.stub()
        };
        sandbox.stub(SalesforceHandler, 'getSalesforceConnection').resolves(mockConnection);

        // Mock VS Code APIs
        mockWorkspace = {
            openNotebookDocument: sandbox.stub()
        };
        mockWindow = {
            showQuickPick: sandbox.stub(),
            showInputBox: sandbox.stub(),
            showErrorMessage: sandbox.stub(),
            showNotebookDocument: sandbox.stub()
        };

        sandbox.stub(SalesforceHandler, 'getSalesforceConnection').resolves(mockConnection);
        sandbox.stub(vscode.workspace, 'openNotebookDocument').value(mockWorkspace.openNotebookDocument);
        sandbox.stub(vscode.window, 'showQuickPick').value(mockWindow.showQuickPick);
        sandbox.stub(vscode.window, 'showInputBox').value(mockWindow.showInputBox);
        sandbox.stub(vscode.window, 'showErrorMessage').value(mockWindow.showErrorMessage);
        sandbox.stub(vscode.window, 'showNotebookDocument').value(mockWindow.showNotebookDocument);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('execute', () => {
        it('should return early when no SObject is selected', async () => {
            // Arrange
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves([]);
            mockWindow.showQuickPick.resolves(undefined);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockWindow.showQuickPick);
            sinon.assert.notCalled(SalesforceHandler.getSalesforceConnection as any);
        });

        it('should return early when no field is selected', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves(undefined);

            const childDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.describe);
            sinon.assert.calledTwice(mockWindow.showQuickPick);
            sinon.assert.notCalled(mockWindow.showInputBox);
        });

        it('should return early when no operator is selected', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves(undefined);

            const childDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.describe);
            sinon.assert.calledThrice(mockWindow.showQuickPick);
            sinon.assert.notCalled(mockWindow.showInputBox);
        });

        it('should return early when input box is cancelled', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' });
            mockWindow.showInputBox.resolves(undefined);

            const childDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.describe);
            sinon.assert.calledThrice(mockWindow.showQuickPick);
            sinon.assert.calledOnce(mockWindow.showInputBox);
            sinon.assert.notCalled(mockConnection.query);
        });

        it('should show error message when no child records found', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' });
            mockWindow.showInputBox.resolves('Test Value');

            const childDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);
            mockConnection.query.resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.query);
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'No child records found matching the criteria.');
        });

        it('should return early when no child record is selected', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('Test Value');

            const childDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);
            mockConnection.query.resolves({ records: [{ Id: '001', Name: 'Test Record' }] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.query);
            sinon.assert.calledThrice(mockWindow.showQuickPick);
            sinon.assert.notCalled(mockWorkspace.openNotebookDocument);
        });

        it('should generate Apex code successfully with parent relationships', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Contact', QualifiedApiName: 'Contact' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Contact', apiName: 'Contact' })
                .onSecondCall().resolves({ label: 'Last Name', fieldName: 'LastName', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Contact', recordId: '0031234567890ABC123' });
            mockWindow.showInputBox.resolves('Smith');

            const childDescribe = {
                label: 'Contact',
                fields: [
                    {
                        name: 'Id',
                        type: 'id',
                        createable: false,
                        encrypted: false
                    },
                    {
                        name: 'LastName',
                        type: 'string',
                        createable: true,
                        encrypted: false
                    },
                    {
                        name: 'AccountId',
                        type: 'reference',
                        referenceTo: ['Account'],
                        createable: true,
                        encrypted: false
                    }
                ]
            };

            const accountDescribe = {
                label: 'Account',
                fields: [
                    {
                        name: 'Id',
                        type: 'id',
                        createable: false,
                        encrypted: false
                    },
                    {
                        name: 'Name',
                        type: 'string',
                        createable: true,
                        updateable: true,
                        encrypted: false
                    }
                ]
            };

            mockConnection.describe
                .onFirstCall().resolves(childDescribe)
                .onSecondCall().resolves(accountDescribe);

            mockConnection.query
                .onFirstCall().resolves({ records: [{ Id: '0031234567890ABC123', Name: 'John Smith', LastName: 'Smith' }] })
                .onSecondCall().resolves({ records: [{ Id: '0031234567890ABC123', LastName: 'Smith', AccountId: '0011234567890ABC123' }] })
                .onThirdCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] });

            const mockNotebook = { /* mock notebook */ };
            mockWorkspace.openNotebookDocument.resolves(mockNotebook);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockWorkspace.openNotebookDocument);
            sinon.assert.calledWith(mockWorkspace.openNotebookDocument, 'apex-notebook', sinon.match.instanceOf(vscode.NotebookData));
            sinon.assert.calledOnce(mockWindow.showNotebookDocument);
        });

        it('should handle LIKE operator with wildcards', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: 'LIKE', operator: 'LIKE' })
                .onFourthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('Test');

            const childDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);
            mockConnection.query.resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockConnection.query, "SELECT Id, Name FROM Account WHERE Name LIKE '%Test%' LIMIT 100");
        });

        it('should handle IN operator with comma-separated values', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Industry', fieldName: 'Industry', description: 'picklist' })
                .onThirdCall().resolves({ label: 'IN', operator: 'IN' })
                .onFourthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('Tech,Finance');

            const childDescribe = {
                fields: [{
                    name: 'Industry',
                    label: 'Industry',
                    type: 'picklist',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);
            mockConnection.query.resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockConnection.query, "SELECT Id, Industry FROM Account WHERE Industry IN ('Tech', 'Finance') LIMIT 100");
        });

        it('should handle multipicklist fields with INCLUDES/EXCLUDES operators', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Multi', fieldName: 'Multi__c', description: 'multipicklist' })
                .onThirdCall().resolves({ label: 'INCLUDES', operator: 'INCLUDES' })
                .onFourthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('Value1;Value2');

            const childDescribe = {
                fields: [{
                    name: 'Multi__c',
                    label: 'Multi',
                    type: 'multipicklist',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);
            mockConnection.query.resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockConnection.query, "SELECT Id, Multi__c FROM Account WHERE Multi__c INCLUDES ('Value1;Value2') LIMIT 100");
        });

        it('should handle numeric fields without quotes', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Number', fieldName: 'Number__c', description: 'double' })
                .onThirdCall().resolves({ label: '>', operator: '>' })
                .onFourthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('100');

            const childDescribe = {
                fields: [{
                    name: 'Number__c',
                    label: 'Number',
                    type: 'double',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(childDescribe);
            mockConnection.query.resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockConnection.query, "SELECT Id, Number__c FROM Account WHERE Number__c > 100 LIMIT 100");
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            (ObjectPermissionsService.prototype.initialize as any).rejects(new Error('Service initialization failed'));

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'Error generating Apex: Service initialization failed');
        });

        it('should skip system user lookup fields when generating parent records', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' });
            mockWindow.showInputBox.resolves('Test');

            const childDescribe = {
                label: 'Account',
                fields: [
                    {
                        name: 'Id',
                        type: 'id',
                        createable: false,
                        encrypted: false
                    },
                    {
                        name: 'Name',
                        type: 'string',
                        createable: true,
                        encrypted: false
                    },
                    {
                        name: 'CreatedById',
                        type: 'reference',
                        referenceTo: ['User'],
                        createable: false,
                        encrypted: false
                    },
                    {
                        name: 'OwnerId',
                        type: 'reference',
                        referenceTo: ['User'],
                        createable: true,
                        encrypted: false
                    }
                ]
            };

            mockConnection.describe.resolves(childDescribe);
            mockConnection.query
                .onFirstCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onSecondCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account', CreatedById: '0051234567890ABC123', OwnerId: '0051234567890ABC123' }] });

            const mockNotebook = {};
            mockWorkspace.openNotebookDocument.resolves(mockNotebook);

            // Act
            await service.execute();

            // Assert
            // Should not try to describe User object for CreatedById or OwnerId
            sinon.assert.calledOnce(mockConnection.describe);
            sinon.assert.calledTwice(mockConnection.query);
        });
    });
});