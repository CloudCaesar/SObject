import * as assert from 'assert';
import { formatField, isValidSalesforceId, isValidSalesforceObjectName, isValidSalesforceFieldName } from '../extension';

suite('Extension Security Tests', () => {
    suite('isValidSalesforceId', () => {
        test('should validate 15-character Salesforce IDs', () => {
            assert(isValidSalesforceId('001000000000000'));
            assert(isValidSalesforceId('003000000000000'));
        });

        test('should validate 18-character Salesforce IDs', () => {
            assert(isValidSalesforceId('001000000000000AAA'));
            assert(isValidSalesforceId('003000000000000BBB'));
        });

        test('should reject invalid IDs', () => {
            assert(!isValidSalesforceId('invalid'));
            assert(!isValidSalesforceId('001000000000000AAAextra'));
            assert(!isValidSalesforceId(''));
            assert(!isValidSalesforceId('123'));
        });
    });

    suite('isValidSalesforceObjectName', () => {
        test('should validate standard object names', () => {
            assert(isValidSalesforceObjectName('Account'));
            assert(isValidSalesforceObjectName('Contact'));
            assert(isValidSalesforceObjectName('Opportunity'));
        });

        test('should validate custom object names', () => {
            assert(isValidSalesforceObjectName('Custom_Object__c'));
            assert(isValidSalesforceObjectName('My_Custom_Object__c'));
        });

        test('should reject invalid object names', () => {
            assert(!isValidSalesforceObjectName('123Invalid'));
            assert(!isValidSalesforceObjectName('_Invalid'));
            assert(!isValidSalesforceObjectName(''));
            assert(!isValidSalesforceObjectName('Object Name With Spaces'));
        });
    });

    suite('isValidSalesforceFieldName', () => {
        test('should validate standard field names', () => {
            assert(isValidSalesforceFieldName('Name'));
            assert(isValidSalesforceFieldName('Id'));
            assert(isValidSalesforceFieldName('CreatedDate'));
        });

        test('should validate custom field names', () => {
            assert(isValidSalesforceFieldName('Custom_Field__c'));
            assert(isValidSalesforceFieldName('My_Custom_Field__c'));
        });

        test('should reject invalid field names', () => {
            assert(!isValidSalesforceFieldName('123Invalid'));
            assert(!isValidSalesforceFieldName('_Invalid'));
            assert(!isValidSalesforceFieldName(''));
        });
    });

    suite('formatField', () => {
        test('should handle string values with single quotes', () => {
            const result = formatField("O'Reilly");
            assert.strictEqual(result, "'O\\'Reilly'");
        });

        test('should handle regular strings', () => {
            const result = formatField("Test String");
            assert.strictEqual(result, "'Test String'");
        });

        test('should handle null and undefined safely', () => {
            assert.strictEqual(formatField(null), null);
            assert.strictEqual(formatField(undefined), null);
        });

        test('should format date fields correctly', () => {
            const validDate = formatField('2023-01-01', 'date');
            assert.strictEqual(validDate, 'Date.newInstance(2023, 1, 1)');

            const invalidDate = formatField('invalid-date', 'date');
            assert.strictEqual(invalidDate, null);
        });

        test('should handle numeric values', () => {
            const result = formatField(123);
            assert.strictEqual(result, '123');

            const result2 = formatField('456');
            assert.strictEqual(result2, "'456'");
        });

        test('should handle boolean values', () => {
            const result = formatField(true);
            assert.strictEqual(result, 'true');

            const result2 = formatField(false);
            assert.strictEqual(result2, 'false');
        });
    });
});