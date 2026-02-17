# SObject - Salesforce Development Toolkit

A comprehensive VS Code extension for Salesforce development featuring Apex notebooks, SObject code generation, schema analysis, and permission auditing tools.

![Demo](media/demo.gif)

## Features

### 🏃‍♂️ Apex Notebooks
Execute Anonymous Apex scripts and SOQL queries directly within VS Code's native notebook interface. Supports:
- **Anonymous Apex execution** with syntax highlighting and error reporting
- **SOQL query execution** with formatted table results
- **Interactive debugging** with debug-only output
- **Multi-cell execution** with confirmation dialogs
- **JSON output** for raw query results

### 🔧 SObject Code Generation
Generate Apex code from Salesforce objects with three specialized generators:

- **SObject to Apex**: Generate basic Apex classes from SObject metadata
- **SObject to Apex Parent-Child**: Generate Apex code with parent-child relationship handling
- **SObject to Apex Child-Parent**: Generate Apex code with child-parent relationship handling

### 📊 Schema Analysis
Explore Salesforce object schemas with detailed field and relationship information:
- **Field definitions** with types, labels, and properties
- **Relationship mappings** and dependencies
- **Org-wide defaults** and sharing model information
- **Interactive webview** with searchable field lists

### 🔐 Permission Auditing
Comprehensive permission analysis tools for security auditing:

#### Object Permissions
- **Permission Set analysis** - View CRUD permissions across all permission sets
- **Permission Set Group analysis** - Aggregated permissions from permission set groups
- **Profile permissions** - User profile-based object access
- **Org-wide defaults** - Sharing model configuration

#### User Permissions
- **Individual user analysis** - Permission analysis for specific users
- **Effective permissions** - Combined permissions from profiles, permission sets, and groups
- **Master-detail inheritance** - Automatic detection of inherited permissions
- **Real-time permission evaluation**

#### Field Level Security (FLS)
- **Field-by-field analysis** - Read/Edit permissions for individual fields
- **Permission set visibility** - FLS settings across all permission sets
- **Profile-based FLS** - User profile field access controls
- **Security gap identification** - Highlight fields with insufficient access

## Commands

### Notebook Commands
- **"Create: New Apex Notebook"** - Creates a new interactive Apex notebook with sample cells

### Code Generation Commands
- **"Create: SObject to Apex"** - Generate basic Apex classes from Salesforce objects
- **"Create: SObject to Apex ParentChild"** - Generate Apex code with parent-child relationships
- **"Create: SObject to Apex Child Parent"** - Generate Apex code with child-parent relationships

### Analysis Commands
- **"Create: SObject Schema"** - View detailed field definitions and relationships
- **"Create: SObject Permissions"** - Analyze object-level permissions across all profiles and permission sets
- **"Create: SObject User Permissions"** - Analyze permissions for individual users
- **"Create: SObject Field Level Security"** - Analyze field-level security for specific fields

## Requirements

The following extensions are required due to the language support:
- [Apex (Salesforce)](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode-apex)
- [SOQL (Salesforce)](https://marketplace.visualstudio.com/items?itemName=salesforce.salesforcedx-vscode-soql)

## Extension Settings

This extension contributes the following settings:

### Apex Notebook Settings
* `anonymous-apex-notebook.apexConfirmDialogPreference`: Controls when to show confirmation dialogs for Apex execution
  - `Always` - Always prompt before executing Apex
  - `Only when running multiple` - Only prompt when executing multiple cells
  - `Never` - Never prompt, execute immediately

* `anonymous-apex-notebook.enableSoqlJsonOutput`: Display raw JSON output alongside formatted table results for SOQL queries

* `anonymous-apex-notebook.showApexDebugOnlyCellOutput`: Show additional debug output for anonymous Apex cells

* `anonymous-apex-notebook.promptForTargetOrgWhenExecutingCells`: Control whether to prompt for target org selection
  - `Always prompt` - Always ask which org to use
  - `Never prompt, always use default org` - Always use the default org

* `anonymous-apex-notebook.enableGpt52CodexForAllClients`: Enable GPT-5.2-Codex integration for enhanced code suggestions

## Architecture

The extension is built with a clean domain-driven architecture:

- **Domain Layer**: Business logic classes for permissions, schemas, and user management
- **Service Layer**: Business services for data processing and analysis
- **Selector Layer**: Data access objects for Salesforce API interactions
- **UI Layer**: Angular-based webview components for rich data visualization
- **Notebook Integration**: Native VS Code notebook controller and serializer

## Security Features

- **Input validation** for all Salesforce identifiers and object names
- **Safe Apex code generation** with proper escaping and formatting
- **Permission-aware analysis** respecting user's current org access
- **Error handling** with detailed logging and user-friendly messages

## Development

This extension uses:
- **TypeScript** for type-safe development
- **Mocha + Sinon** for comprehensive unit testing
- **ESLint** for code quality
- **Salesforce APIs** (@salesforce/core, @salesforce/apex-node)
- **Semantic UI** for webview styling

## Contributing

Contributions are welcome! The codebase includes comprehensive unit tests covering all business logic components. Please ensure new features include appropriate test coverage.

## License

See LICENSE file for details.