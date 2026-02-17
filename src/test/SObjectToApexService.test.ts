import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { SObjectToApexService } from '../../src/services/SObjectToApexService';
import { ObjectPermissionsService } from '../../src/services/ObjectPermissionsService';
import * as SalesforceHandler from '../../src/handlers/salesforceHandler';

describe('SObjectToApexService', () => {
    let service: SObjectToApexService;
    let sandbox: sinon.SinonSandbox;
    let mockConnection: any;
    let mockWorkspace: any;
    let mockWindow: any;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        service = new SObjectToApexService();

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

            const describe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);

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

            const describe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);

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

            const describe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.describe);
            sinon.assert.calledThrice(mockWindow.showQuickPick);
            sinon.assert.calledOnce(mockWindow.showInputBox);
            sinon.assert.notCalled(mockConnection.query);
        });

        it('should show error message when no records found', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' });
            mockWindow.showInputBox.resolves('Test Value');

            const describe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);
            mockConnection.query.resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.query);
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'No records found matching the criteria.');
        });

        it('should return early when no record is selected', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('Test Value');

            const describe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);
            mockConnection.query.resolves({ records: [{ Id: '001', Name: 'Test Account' }] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.query);
            sinon.assert.calledThrice(mockWindow.showQuickPick);
            sinon.assert.notCalled(mockWorkspace.openNotebookDocument);
        });

        it('should generate Apex code successfully', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' });
            mockWindow.showInputBox.resolves('Test');

            const describe = {
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

            mockConnection.describe.resolves(describe);
            mockConnection.query
                .onFirstCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onSecondCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] });

            const mockNotebook = {};
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

            const describe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);
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

            const describe = {
                fields: [{
                    name: 'Industry',
                    label: 'Industry',
                    type: 'picklist',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);
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

            const describe = {
                fields: [{
                    name: 'Multi__c',
                    label: 'Multi',
                    type: 'multipicklist',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);
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

            const describe = {
                fields: [{
                    name: 'Number__c',
                    label: 'Number',
                    type: 'double',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(describe);
            mockConnection.query.resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockConnection.query, "SELECT Id, Number__c FROM Account WHERE Number__c > 100 LIMIT 100");
        });

        it('should show error message when selected record not found', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' });
            mockWindow.showInputBox.resolves('Test');

            const describe = {
                label: 'Account',
                fields: [
                    {
                        name: 'Name',
                        type: 'string',
                        createable: true,
                        updateable: true,
                        encrypted: false
                    }
                ]
            };

            mockConnection.describe.resolves(describe);
            mockConnection.query
                .onFirstCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onSecondCall().resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'Selected record not found.');
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            (ObjectPermissionsService.prototype.initialize as any).rejects(new Error('Service initialization failed'));

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'Error in SObject to Apex command: Service initialization failed');
        });
    });
});