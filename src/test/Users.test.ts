import * as assert from 'assert';
import { Users } from '../../src/domain/Users';

describe('Users', () => {
    let users: Users;
    let mockRecords: any[];

    beforeEach(() => {
        mockRecords = [
            {
                Id: 'user1',
                Name: 'John Doe',
                Username: 'john.doe@example.com',
                IsActive: true,
                Email: 'john.doe@example.com'
            },
            {
                Id: 'user2',
                Name: 'Jane Smith',
                Username: 'jane.smith@example.com',
                IsActive: false,
                Email: 'jane.smith@example.com'
            },
            {
                Id: 'user3',
                Name: 'Bob Johnson',
                Username: 'bob.johnson@example.com',
                IsActive: true,
                Email: 'bob.johnson@example.com'
            }
        ];
        users = new Users(mockRecords);
    });

    describe('constructor', () => {
        it('should create instance with provided records', () => {
            // Assert
            assert.strictEqual(users.getRecords().length, 3);
            assert.deepStrictEqual(users.getRecords(), mockRecords);
        });

        it('should handle empty record list', () => {
            // Act
            const emptyUsers = new Users([]);

            // Assert
            assert.strictEqual(emptyUsers.getRecords().length, 0);
        });

        it('should handle null record list', () => {
            // Act
            const nullUsers = new Users(null as any);

            // Assert
            assert.strictEqual(nullUsers.getRecords().length, 0);
        });
    });

    describe('newInstance', () => {
        it('should create new instance using factory method', () => {
            // Act
            const instance = Users.newInstance(mockRecords);

            // Assert
            assert.ok(instance instanceof Users);
            assert.strictEqual(instance.getRecords().length, 3);
        });
    });

    describe('getRecords', () => {
        it('should return all user records', () => {
            // Act
            const records = users.getRecords();

            // Assert
            assert.strictEqual(records.length, 3);
            assert.deepStrictEqual(records, mockRecords);
        });
    });

    describe('getUsersMap', () => {
        it('should return users mapped by ID', () => {
            // Act
            const map = users.getUsersMap();

            // Assert
            assert.ok(map instanceof Map);
            assert.strictEqual(map.size, 3);
            assert.ok(map.has('user1'));
            assert.ok(map.has('user2'));
            assert.ok(map.has('user3'));
            assert.strictEqual(map.get('user1').Name, 'John Doe');
        });
    });

    describe('getUserIds', () => {
        it('should return all user IDs', () => {
            // Act
            const ids = users.getUserIds();

            // Assert
            assert.strictEqual(ids.length, 3);
            assert.ok(ids.includes('user1'));
            assert.ok(ids.includes('user2'));
            assert.ok(ids.includes('user3'));
        });
    });

    describe('getActiveUsers', () => {
        it('should return only active users', () => {
            // Act
            const activeUsers = users.getActiveUsers();

            // Assert
            assert.strictEqual(activeUsers.length, 2);
            assert.ok(activeUsers.every(u => u.IsActive === true));
            assert.ok(activeUsers.some(u => u.Id === 'user1'));
            assert.ok(activeUsers.some(u => u.Id === 'user3'));
            assert.ok(!activeUsers.some(u => u.Id === 'user2'));
        });

        it('should return empty array when no active users', () => {
            // Arrange
            const inactiveRecords = mockRecords.map(r => ({ ...r, IsActive: false }));
            const inactiveUsers = new Users(inactiveRecords);

            // Act
            const activeUsers = inactiveUsers.getActiveUsers();

            // Assert
            assert.strictEqual(activeUsers.length, 0);
        });
    });

    describe('getUserById', () => {
        it('should return user for existing ID', () => {
            // Act
            const user = users.getUserById('user1');

            // Assert
            assert.ok(user);
            assert.strictEqual(user.Id, 'user1');
            assert.strictEqual(user.Name, 'John Doe');
        });

        it('should return undefined for non-existing ID', () => {
            // Act
            const user = users.getUserById('nonexistent');

            // Assert
            assert.strictEqual(user, undefined);
        });
    });

    describe('count', () => {
        it('should return the number of user records', () => {
            // Act
            const count = users.count();

            // Assert
            assert.strictEqual(count, 3);
        });

        it('should return 0 for empty users', () => {
            // Arrange
            const emptyUsers = new Users([]);

            // Act
            const count = emptyUsers.count();

            // Assert
            assert.strictEqual(count, 0);
        });
    });
});