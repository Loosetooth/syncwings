import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  username: string;
  passwordHash: string;
  syncthingInstance: string;
  isAdmin?: boolean;
  index: number;
}

// The users.json file will now store an object: { users: User[], latestIndex: number }

export class UserStore {
  private configDir: string;
  private usersFile: string;
  private userMapCache: Map<string, User> | null = null;
  private latestIndex: number = 1;

  constructor(configDir?: string) {
    this.configDir = configDir || process.env.CONFIG_DIR || process.cwd();
    this.usersFile = path.join(this.configDir, 'users.json');
    this.loadLatestIndex();
  }

  private loadLatestIndex() {
    if (!fs.existsSync(this.usersFile)) return;
    try {
      const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
      if (typeof data.latestIndex === 'number') {
        this.latestIndex = data.latestIndex;
      } else if (Array.isArray(data)) {
        // Legacy: just an array of users
        this.latestIndex = data.length;
      }
    } catch {}
  }

  resetUserCache() {
    this.userMapCache = null;
    this.loadLatestIndex();
  }

  private loadUserMap(): Map<string, User> {
    if (!fs.existsSync(this.usersFile)) return new Map();
    const raw = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
    const users: User[] = Array.isArray(raw) ? raw : raw.users;
    return new Map(users.map(u => [u.username, u]));
  }

  getUserMap(): Map<string, User> {
    if (this.userMapCache === null) {
      this.userMapCache = this.loadUserMap();
    }
    return this.userMapCache;
  }

  private writeUserMap(userMap: Map<string, User>): void {
    const users = Array.from(userMap.values());
    const data = { users, latestIndex: this.latestIndex };
    fs.writeFileSync(this.usersFile, JSON.stringify(data, null, 2), { mode: 0o600 });
    this.userMapCache = userMap;
  }

  reloadUsersFromDisk(): void {
    this.userMapCache = this.loadUserMap();
    this.loadLatestIndex();
  }

  addUser(username: string, password: string, isAdmin?: boolean): void {
    const userMap = this.getUserMap();
    if (userMap.has(username)) throw new Error('User exists');
    const passwordHash = bcrypt.hashSync(password, 10);
    // First user is admin
    const isFirstUser = userMap.size === 0;
    const index = ++this.latestIndex;
    userMap.set(username, { username, passwordHash, syncthingInstance: username, isAdmin: isFirstUser || isAdmin, index });
    this.writeUserMap(userMap);
  }

  promoteToAdmin(username: string): void {
    const userMap = this.getUserMap();
    const user = userMap.get(username);
    if (!user) throw new Error('User not found');
    user.isAdmin = true;
    userMap.set(username, user);
    this.writeUserMap(userMap);
  }

  isAdmin(username: string): boolean {
    const userMap = this.getUserMap();
    const user = userMap.get(username);
    return !!user?.isAdmin;
  }

  authenticate(username: string, password: string): boolean {
    const userMap = this.getUserMap();
    const user = userMap.get(username);
    if (!user) return false;
    return bcrypt.compareSync(password, user.passwordHash);
  }

  readUsers(): User[] {
    return Array.from(this.getUserMap().values());
  }

  writeUsers(users: User[]): void {
    const userMap = new Map(users.map(u => [u.username, u]));
    // Recalculate latestIndex in case of manual edits
    this.latestIndex = users.reduce((max, u) => Math.max(max, u.index || 0), 0);
    this.writeUserMap(userMap);
  }
}

export const userStore = new UserStore();
