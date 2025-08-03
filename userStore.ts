
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User } from './user';

export class UserStore {
  private configDir: string;
  private usersFile: string;
  private userMapCache: Map<string, User> | null = null;

  constructor(configDir?: string) {
    this.configDir = configDir || process.env.CONFIG_DIR || process.cwd();
    this.usersFile = path.join(this.configDir, 'users.json');
  }

  resetUserCache() {
    this.userMapCache = null;
  }

  private loadUserMap(): Map<string, User> {
    if (!fs.existsSync(this.usersFile)) return new Map();
    const users = JSON.parse(fs.readFileSync(this.usersFile, 'utf8')) as User[];
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
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2), { mode: 0o600 });
    this.userMapCache = userMap;
  }

  reloadUsersFromDisk(): void {
    this.userMapCache = this.loadUserMap();
  }

  addUser(username: string, password: string, isAdmin?: boolean): void {
    const userMap = this.getUserMap();
    if (userMap.has(username)) throw new Error('User exists');
    const passwordHash = bcrypt.hashSync(password, 10);
    // First user is admin
    const isFirstUser = userMap.size === 0;
    userMap.set(username, { username, passwordHash, syncthingInstance: username, isAdmin: isFirstUser || isAdmin });
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
    this.writeUserMap(userMap);
  }
}
