# SObject - Salesforce Development Toolkit

## What's in the folder

* This folder contains the complete SObject extension - a comprehensive Salesforce development toolkit.
* `package.json` - Extension manifest with all commands, settings, and dependencies
  * Defines 8 commands for notebooks, code generation, and analysis tools
  * Configures notebook type support for `.apexnotebook` files
  * Includes settings for Apex execution, SOQL output, and org targeting
* `src/extension.ts` - Main extension entry point with command registrations
  * Registers notebook controller and serializer for Apex notebooks
  * Implements 8 command handlers for various Salesforce operations
  * Manages webview panels for rich data visualization
* `src/notebook/` - Native VS Code notebook integration
  * `apexNotebookController.ts` - Handles cell execution and kernel operations
  * `apexNotebookSerializer.ts` - Manages notebook file persistence
* `src/services/` - Business logic services (8 services)
  * `SObjectToApexService.ts` - Basic Apex code generation
  * `SObjectToApexParentChildService.ts` - Parent-child relationship code generation
  * `SObjectToApexChildParentService.ts` - Child-parent relationship code generation
  * `SchemaService.ts` - Object schema analysis
  * `ObjectPermissionsService.ts` - Object-level permission analysis
  * `UserPermissionsService.ts` - User-specific permission analysis
  * `FieldSecurityService.ts` - Field-level security analysis
  * `PermissionQueryService.ts` - Shared permission data access
* `src/domain/` - Domain models (7 classes)
  * Business entities for permissions, schemas, and user management
* `src/selectors/` - Data access layer (8 selectors)
  * Salesforce API query builders and data retrieval
* `src/handlers/` - Infrastructure handlers
  * `salesforceHandler.ts` - Salesforce connection management
  * `dataHandler.ts` - Extension data persistence
  * `logHandler.ts` - Logging infrastructure
* `src/ViewComponents/` - Angular-based webview components
  * Rich UI components for displaying analysis results
* `src/test/` - Comprehensive unit test suite
  * Tests for all services, domain classes, and selectors
  * Mocha + Sinon testing framework with full coverage

## Get up and running straight away

* Press `F5` to open a new window with the SObject extension loaded.
* Run commands from the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac):
  * `Create: New Apex Notebook` - Start with interactive Apex/SOQL execution
  * `Create: SObject Schema` - Explore object schemas
  * `Create: SObject Permissions` - Analyze object permissions
  * `Create: SObject User Permissions` - Check user access rights
  * `Create: SObject Field Level Security` - Review field security
* Set breakpoints in any source file to debug the extension.
* Find output from the extension in the debug console and VS Code's output panel.

## Make changes

* You can relaunch the extension from the debug toolbar after changing code.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load changes.
* The extension uses TypeScript with strict compilation - run `npm run compile` to check for errors.
* All business logic includes comprehensive unit tests - run `npm test` to validate changes.

## Explore the API

* The extension uses the full VS Code API surface:
  * Notebook API for interactive Apex/SOQL execution
  * Webview API for rich data visualization
  * Commands API for tool integration
  * Workspace API for file management
* Salesforce APIs via `@salesforce/core` and `@salesforce/apex-node`
* You can open the full VS Code API at `node_modules/@types/vscode/index.d.ts`.

## Run tests

* Open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac).
* From the launch configuration dropdown, pick `Extension Tests`.
* Press `F5` to run the comprehensive test suite in a new window.
* See test results in the debug console - all business logic is fully tested.
* Test files are in `src/test/` with the pattern `**.test.ts`.
* The test suite covers all 23 business logic components (8 services, 7 domain classes, 8 selectors).

## Architecture Overview

The extension follows domain-driven design principles:

### Domain Layer (`src/domain/`)
- Pure business logic classes
- No external dependencies
- Testable in isolation

### Service Layer (`src/services/`)
- Business operations and workflows
- Coordinate between domain and infrastructure
- Handle complex business rules

### Selector Layer (`src/selectors/`)
- Data access and query building
- Salesforce API interactions
- Query optimization and caching

### Infrastructure Layer (`src/handlers/`, `src/notebook/`)
- External system integrations
- VS Code API interactions
- File I/O and persistence

### Presentation Layer (`src/ViewComponents/`)
- Webview components
- Rich data visualization
- Interactive user interfaces

## Development Workflow

1. **Feature Development**: Add new commands in `extension.ts`, implement services in `src/services/`
2. **Testing**: Write comprehensive unit tests for all new business logic
3. **UI Development**: Create Angular components in `src/ViewComponents/` for data visualization
4. **Integration**: Register new commands and settings in `package.json`
5. **Validation**: Run `npm test` and `npm run compile` before committing

## Go further

* **Reduce bundle size**: [Bundle your extension](https://code.visualstudio.com/api/working-with-extensions/bundling-extension) to improve startup time
* **Publish to marketplace**: [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) to share with the Salesforce community
* **CI/CD**: Set up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration) for automated testing and releases
* **Contribute**: This extension welcomes contributions! See the main README for contribution guidelines
