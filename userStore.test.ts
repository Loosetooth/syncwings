import { describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { UserStore } from './userStore';
import { SyncthingInstanceService } from './syncthingInstanceService';

const TEST_CONFIG_DIR = path.join(process.cwd(), '__test_config');
let store: UserStore;

function cleanTestConfig() {
  if (fs.existsSync(TEST_CONFIG_DIR)) fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  if (store) store.resetUserCache();
}

describe('UserStore', () => {
  beforeAll(() => {
    const syncthingService = new SyncthingInstanceService(TEST_CONFIG_DIR, false);
    store = new UserStore(TEST_CONFIG_DIR, syncthingService);
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
    store.writeUsers([{ username: 'eve', passwordHash: users[0].passwordHash, syncthingInstance: 'eve', index: 2 }]);
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

  it('should assign unique, incrementing indices to users', () => {
    store.addUser('u1', 'pw');
    store.addUser('u2', 'pw');
    store.addUser('u3', 'pw');
    const users = store.readUsers();
    const indices = users.map(u => u.index);
    expect(indices.length).toBe(3);
    // All indices should be unique
    expect(new Set(indices).size).toBe(3);
    // Indices should be incrementing (not all 1)
    expect(Math.max(...indices)).toBeGreaterThan(1);
  });

  it('should persist indices across reloads', () => {
    store.addUser('a', 'pw');
    store.addUser('b', 'pw');
    const before = store.readUsers().map(u => u.index);
    store.reloadUsersFromDisk();
    const after = store.readUsers().map(u => u.index);
    expect(after).toEqual(before);
  });

  it('should not reuse indices after user deletion', () => {
    store.addUser('x', 'pw');
    store.addUser('y', 'pw');
    let users = store.readUsers();
    const idxX = users.find(u => u.username === 'x')!.index;
    const idxY = users.find(u => u.username === 'y')!.index;
    // Remove 'x'
    store.writeUsers(users.filter(u => u.username !== 'x'));
    store.reloadUsersFromDisk();
    // Add new user
    store.addUser('z', 'pw');
    users = store.readUsers();
    const idxZ = users.find(u => u.username === 'z')!.index;
    // idxZ should be greater than idxY (never reused)
    expect(idxZ).toBeGreaterThan(idxY);
  });
});
