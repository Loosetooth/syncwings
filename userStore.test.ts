import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { UserStore, User } from './userStore';

const TEST_CONFIG_DIR = path.join(process.cwd(), '__test_config');
let store: UserStore;

function cleanTestConfig() {
  if (fs.existsSync(TEST_CONFIG_DIR)) fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  if (store) store.resetUserCache();
}

describe('UserStore', () => {
  beforeAll(() => {
    store = new UserStore(TEST_CONFIG_DIR);
    cleanTestConfig();
  })

  beforeEach(() => {
    cleanTestConfig();
    fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
    store.reloadUsersFromDisk();
  })

  afterEach(() => {
    cleanTestConfig();
  })

  it('should add and authenticate a user', () => {
    store.addUser('alice', 'password123');
    expect(store.authenticate('alice', 'password123')).toBe(true);
    expect(store.authenticate('alice', 'wrongpass')).toBe(false);
    expect(store.authenticate('bob', 'password123')).toBe(false);
  });

  it('should not allow duplicate usernames', () => {
    store.addUser('bob', 'pw');
    expect(() => store.addUser('bob', 'pw2')).toThrow();
  });

  it('should persist and reload users', () => {
    store.addUser('carol', 'pw');
    store.reloadUsersFromDisk();
    expect(store.authenticate('carol', 'pw')).toBe(true);
  });

  it('should read and write users', () => {
    store.addUser('dave', 'pw');
    let users = store.readUsers();
    expect(users.length).toBe(1);
    expect(users[0].username).toBe('dave');
    // Overwrite users
    store.writeUsers([{ username: 'eve', passwordHash: users[0].passwordHash, syncthingInstance: 'eve' }]);
    store.reloadUsersFromDisk();
    users = store.readUsers();
    expect(users.length).toBe(1);
    expect(users[0].username).toBe('eve');
  });

  it('should make the first user admin by default', () => {
    store.addUser('admin', 'pw');
    expect(store.isAdmin('admin')).toBe(true);
    store.addUser('bob', 'pw');
    expect(store.isAdmin('bob')).toBe(false);
  });

  it('should allow promoting a user to admin', () => {
    store.addUser('admin', 'pw');
    store.addUser('bob', 'pw');
    expect(store.isAdmin('bob')).toBe(false);
    store.promoteToAdmin('bob');
    expect(store.isAdmin('bob')).toBe(true);
  });

  it('should persist admin status after reload', () => {
    store.addUser('admin', 'pw');
    store.addUser('bob', 'pw');
    store.promoteToAdmin('bob');
    store.reloadUsersFromDisk();
    expect(store.isAdmin('admin')).toBe(true);
    expect(store.isAdmin('bob')).toBe(true);
  });
});
