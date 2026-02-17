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

export const NOTEBOOK_TYPE = 'anon-apex-notebook';
export const COMMAND_NAME_NEW_NOTEBOOK = 'anonymous-apex-notebook.create-apex-notebook';
export const COMMAND_NAME_SOBJECT_TO_APEX = 'anonymous-apex-notebook.sobject2apex';
export const COMMAND_NAME_SOBJECT_TO_APEX_PARENT_CHILD = 'anonymous-apex-notebook.sobject2apex-parentchild';
export const COMMAND_NAME_SOBJECT_TO_APEX_CHILD_PARENT = 'anonymous-apex-notebook.sobject2apex-childparent';
export const COMMAND_NAME_SOBJECT_SCHEMA = 'anonymous-apex-notebook.sobject-schema';
export const COMMAND_NAME_SOBJECT_PERMISSIONS = 'anonymous-apex-notebook.sobject-permissions';
export const COMMAND_NAME_SOBJECT_USER_PERMISSIONS = 'anonymous-apex-notebook.sobject-user-permissions';
export const COMMAND_NAME_SOBJECT_FIELD_SECURITY = 'anonymous-apex-notebook.sobject-field-security';

export const STORAGE_KEY_APEX_EXECUTE_SERVICE = 'execute-service';

export const SETTING_KEY_PROMPT_FOR_TARGET_ORG = 'anonymous-apex-notebook.promptForTargetOrgWhenExecutingCells';
export const SETTING_KEY_CONFIRM_DIALOG_PREFERENCE = 'anonymous-apex-notebook.apexConfirmDialogPreference';
export const SETTING_KEY_DISPLAY_JSON_OUTPUT = 'anonymous-apex-notebook.enableSoqlJsonOutput';
export const SETTING_KEY_DISPLAY_DEBUG_ONLY = 'anonymous-apex-notebook.showApexDebugOnlyCellOutput';

export const CONFIRM_DIALOG_OPTION_ALWAYS = 'Always';
export const CONFIRM_DIALOG_OPTION_ONLY_MULTIPLE = 'Only when running multiple';
export const CONFIRM_DIALOG_OPTION_NEVER = 'Never';

export const TARGET_ORG_DIALOG_OPTION_ALWAYS_PROMPT = 'Always prompt';
export const TARGET_ORG_DIALOG_OPTION_NEVER_PROMPT = 'Never prompt, always use default org';