# Change Log

All notable changes to the "anonymous-apex-notebook" extension will be documented in this file.

## 0.6.0

- Added new config `anonymous-apex-notebook.promptForTargetOrgWhenExecutingCells` to give users the ability to switch orgs before executing cells
  - Two options - always use default, or prompt before executing
- Added the target org name when executing apex in the confirmation prompt
- Fixed issue where changing the default org wouldn't update the target org for the notebook  

## 0.5.1

- Fixed issue where SOQL results are not sorted by the order of the query
  - Resulting from https://github.com/jake-kirkman/vscode-ext-apex-notebook/issues/4

## 0.5.0

- Added Debug Only view courtesy of [Agisole](https://github.com/agilsole)
- Added new `anonymous-apex-notebook.showApexDebugOnlyCellOutput` config to optionally disable the debug only view

## 0.4.0

- Added text for when no records are returned
- Added primitive support for displaying lookup fields (e.g MyLookup__r.Name)
- Added primitive support for child relationships
- 'Id' column will now always show as the first column

## 0.3.0

- Added option to execute only Apex when running a mixture of Apex and SOQLs
- Extension's code cleanup
- Added "Total Records" above SOQL results
  - This means COUNT() queries should now work correctly

## 0.2.0

- Renamed configs to camelCase so VSCode will display the config names properly.
- Added in `enableSoqlJsonOutput` setting to optionally allow users to display the JSON response when running a SOQL 
- Made this changelog pretty
- Added option to execute only SOQLs when running a mixture of Apex and SOQLs

## 0.1.2

- More minor config updates

## 0.1.1

- Minor config updates

## 0.1.0

- Initial VSCode release. Contains a barebones experience for holding various apex scripts and SOQL queries