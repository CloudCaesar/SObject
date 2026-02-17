import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { SObjectToApexParentChildService } from '../../src/services/SObjectToApexParentChildService';
import { ObjectPermissionsService } from '../../src/services/ObjectPermissionsService';
import * as SalesforceHandler from '../../src/handlers/salesforceHandler';

describe('SObjectToApexParentChildService', () => {
    let service: SObjectToApexParentChildService;
    let sandbox: sinon.SinonSandbox;
    let mockConnection: any;
    let mockWorkspace: any;
    let mockWindow: any;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        service = new SObjectToApexParentChildService();

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

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(parentDescribe);

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

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(parentDescribe);

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

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(parentDescribe);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.describe);
            sinon.assert.calledThrice(mockWindow.showQuickPick);
            sinon.assert.calledOnce(mockWindow.showInputBox);
            sinon.assert.notCalled(mockConnection.query);
        });

        it('should show error message when no parent records found', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' });
            mockWindow.showInputBox.resolves('Test Value');

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(parentDescribe);
            mockConnection.query.resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.query);
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'No parent records found matching the criteria.');
        });

        it('should return early when no parent record is selected', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('Test Value');

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }]
            };
            mockConnection.describe.resolves(parentDescribe);
            mockConnection.query.resolves({ records: [{ Id: '001', Name: 'Test Account' }] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockConnection.query);
            sinon.assert.calledThrice(mockWindow.showQuickPick);
            sinon.assert.notCalled(mockWorkspace.openNotebookDocument);
        });

        it('should show error message when no child relationships found', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' });
            mockWindow.showInputBox.resolves('Test');

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }],
                childRelationships: []
            };
            mockConnection.describe.resolves(parentDescribe);
            mockConnection.query.resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'No child relationships found for this object.');
        });

        it('should return early when no relationship is selected', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' })
                .onFifthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('Test');

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }],
                childRelationships: [{ relationshipName: 'Contacts', childSObject: 'Contact', field: 'AccountId' }]
            };
            mockConnection.describe.resolves(parentDescribe);
            mockConnection.query.resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.callCount(mockWindow.showQuickPick, 4);
            sinon.assert.notCalled(mockWorkspace.openNotebookDocument);
        });

        it('should show error message when no child records found', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' })
                .onFifthCall().resolves({ label: 'Contacts', detail: 'Contact (AccountId)' })
                .onSixthCall().resolves([]);
            mockWindow.showInputBox.resolves('Test');

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }],
                childRelationships: [{ relationshipName: 'Contacts', childSObject: 'Contact', field: 'AccountId' }]
            };
            mockConnection.describe.resolves(parentDescribe);
            mockConnection.query
                .onFirstCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onSecondCall().resolves({ records: [] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'No child records found.');
        });

        it('should return early when no child records are selected', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' })
                .onFifthCall().resolves({ label: 'Contacts', detail: 'Contact (AccountId)' })
                .onSixthCall().resolves(undefined);
            mockWindow.showInputBox.resolves('Test');

            const parentDescribe = {
                fields: [{
                    name: 'Name',
                    label: 'Name',
                    type: 'string',
                    autoNumber: false,
                    calculated: false,
                    relationshipOrder: null
                }],
                childRelationships: [{ relationshipName: 'Contacts', childSObject: 'Contact', field: 'AccountId' }]
            };
            mockConnection.describe.resolves(parentDescribe);
            mockConnection.query
                .onFirstCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onSecondCall().resolves({ records: [{ Id: '0031234567890ABC123', Name: 'Test Contact' }] });

            // Act
            await service.execute();

            // Assert
            sinon.assert.callCount(mockWindow.showQuickPick, 5);
            sinon.assert.notCalled(mockWorkspace.openNotebookDocument);
        });

        it('should generate Apex code successfully with parent and child records', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' })
                .onFifthCall().resolves({ label: 'Contacts', detail: 'Contact (AccountId)' })
                .onSixthCall().resolves([{ label: 'Test Contact', detail: 'ID: 0031234567890ABC123', recordId: '0031234567890ABC123' }]);
            mockWindow.showInputBox.resolves('Test');

            const parentDescribe = {
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
                ],
                childRelationships: [{ relationshipName: 'Contacts', childSObject: 'Contact', field: 'AccountId' }]
            };

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
                        updateable: true,
                        encrypted: false
                    },
                    {
                        name: 'AccountId',
                        type: 'reference',
                        createable: true,
                        updateable: true,
                        encrypted: false
                    }
                ]
            };

            mockConnection.describe
                .onFirstCall().resolves(parentDescribe)
                .onSecondCall().resolves(childDescribe);

            mockConnection.query
                .onFirstCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onSecondCall().resolves({ records: [{ Id: '0031234567890ABC123', Name: 'Test Contact' }] })
                .onThirdCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onFourthCall().resolves({ records: [{ Id: '0031234567890ABC123', LastName: 'Test Contact', AccountId: '0011234567890ABC123' }] });

            const mockNotebook = {};
            mockWorkspace.openNotebookDocument.resolves(mockNotebook);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockWorkspace.openNotebookDocument);
            sinon.assert.calledWith(mockWorkspace.openNotebookDocument, 'apex-notebook', sinon.match.instanceOf(vscode.NotebookData));
            sinon.assert.calledOnce(mockWindow.showNotebookDocument);
        });

        it('should handle "Select All" option for child records', async () => {
            // Arrange
            const sobjectRecords = [{ Label: 'Account', QualifiedApiName: 'Account' }];
            (ObjectPermissionsService.prototype.getQueryableSObjects as any).resolves(sobjectRecords);
            mockWindow.showQuickPick
                .onFirstCall().resolves({ label: 'Account', apiName: 'Account' })
                .onSecondCall().resolves({ label: 'Name', fieldName: 'Name', description: 'string' })
                .onThirdCall().resolves({ label: '=', operator: '=' })
                .onFourthCall().resolves({ label: 'Test Account', recordId: '0011234567890ABC123' })
                .onFifthCall().resolves({ label: 'Contacts', detail: 'Contact (AccountId)' })
                .onSixthCall().resolves([{ label: 'Select All', detail: 'Select all child records' }]);
            mockWindow.showInputBox.resolves('Test');

            const parentDescribe = {
                label: 'Account',
                fields: [
                    {
                        name: 'Name',
                        type: 'string',
                        createable: true,
                        updateable: true,
                        encrypted: false
                    }
                ],
                childRelationships: [{ relationshipName: 'Contacts', childSObject: 'Contact', field: 'AccountId' }]
            };

            const childDescribe = {
                label: 'Contact',
                fields: [
                    {
                        name: 'LastName',
                        type: 'string',
                        createable: true,
                        updateable: true,
                        encrypted: false
                    },
                    {
                        name: 'AccountId',
                        type: 'reference',
                        createable: true,
                        updateable: true,
                        encrypted: false
                    }
                ]
            };

            mockConnection.describe
                .onFirstCall().resolves(parentDescribe)
                .onSecondCall().resolves(childDescribe);

            mockConnection.query
                .onFirstCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onSecondCall().resolves({ records: [
                    { Id: '0031', Name: 'Contact 1' },
                    { Id: '0032', Name: 'Contact 2' }
                ] })
                .onThirdCall().resolves({ records: [{ Id: '0011234567890ABC123', Name: 'Test Account' }] })
                .onFourthCall().resolves({ records: [{ Id: '0031', LastName: 'Contact 1', AccountId: '0011234567890ABC123' }] })
                .onFifthCall().resolves({ records: [{ Id: '0032', LastName: 'Contact 2', AccountId: '0011234567890ABC123' }] });

            const mockNotebook = {};
            mockWorkspace.openNotebookDocument.resolves(mockNotebook);

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledOnce(mockWorkspace.openNotebookDocument);
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            (ObjectPermissionsService.prototype.initialize as any).rejects(new Error('Service initialization failed'));

            // Act
            await service.execute();

            // Assert
            sinon.assert.calledWith(mockWindow.showErrorMessage, 'Error generating Apex: Service initialization failed');
        });
    });
});