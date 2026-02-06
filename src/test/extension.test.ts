import * as assert from 'assert';
import { formatField, isValidSalesforceId, isValidSalesforceObjectName, isValidSalesforceFieldName } from '../extension';

suite('Extension Security Tests', () => {
    test('isValidSalesforceId should validate Salesforce IDs', () => {
        assert(isValidSalesforceId('001000000000000AAA')); // 18 char
        assert(isValidSalesforceId('001000000000000')); // 15 char
        assert(!isValidSalesforceId('invalid'));
        assert(!isValidSalesforceId('001000000000000AAAextra'));
    });

    test('isValidSalesforceObjectName should validate object names', () => {
        assert(isValidSalesforceObjectName('Account'));
        assert(isValidSalesforceObjectName('Custom_Object__c'));
        assert(!isValidSalesforceObjectName('123Invalid'));
        assert(!isValidSalesforceObjectName(''));
    });

    test('isValidSalesforceFieldName should validate field names', () => {
        assert(isValidSalesforceFieldName('Name'));
        assert(isValidSalesforceFieldName('Custom_Field__c'));
        assert(!isValidSalesforceFieldName('123Invalid'));
    });

    test('formatField should escape single quotes to prevent SQL injection', () => {
        const result = formatField("O'Reilly");
        assert.strictEqual(result, "'O\\'Reilly'");
    });

    test('formatField should handle null and undefined safely', () => {
        assert.strictEqual(formatField(null), null);
        assert.strictEqual(formatField(undefined), null);
    });

    test('formatField should validate date inputs', () => {
        const validDate = formatField('2023-01-01', 'date');
        assert.strictEqual(validDate, 'Date.newInstance(2023, 1, 1)');

        const invalidDate = formatField('invalid-date', 'date');
        assert.strictEqual(invalidDate, null);
    });

    test('formatField should validate numeric inputs', () => {
        const validInt = formatField('123', 'int');
        assert.strictEqual(validInt, '123');

        const invalidInt = formatField('not-a-number', 'int');
        assert.strictEqual(invalidInt, null);
    });
});