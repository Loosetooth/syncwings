import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Service to manage Syncthing instances for users.
 * Handles user directories, Docker Compose files, and instance management.
 * Each user has a unique Syncthing instance with its own configuration and data directories.
 */
export class SyncthingInstanceService {
  private baseDir: string;
  private enableDocker: boolean;
  constructor(baseDir: string, enableDocker: boolean = true) {
    this.baseDir = baseDir;
    this.enableDocker = enableDocker;
  }

  getUserDir(username: string) {
    return path.join(this.baseDir, 'users', username);
  }
  getComposeFile(username: string) {
    return path.join(this.getUserDir(username), 'docker-compose.yaml');
  }
  getConfigDir(username: string) {
    return path.join(this.getUserDir(username), 'config');
  }
  getDataDir(username: string) {
    return path.join(this.getUserDir(username), 'data');
  }
  generateComposeYaml(username: string, index: number): string {
    const webPort = 8384 + index;
    const tcpPort = 22000 + index;
    const udpPort = 22000 + index;
    const discoveryPort = 21027 + index;
    const dataDirExternal = process.env.DATA_DIR_EXTERNAL || this.baseDir || '/data';
    const userExternalDir = `${dataDirExternal}/users/${username}`;
    return `
services:
  syncthing:
    image: linuxserver/syncthing:1.30.0
    container_name: syncthing_${username}
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
    volumes:
      - ${userExternalDir}/config:/config
      - ${userExternalDir}/data:/data
    ports:
      - ${webPort}:8384
      - ${tcpPort}:22000/tcp
      - ${udpPort}:22000/udp
      - ${discoveryPort}:21027/udp
    restart: unless-stopped
`;
  }
  ensureUserDirs(username: string) {
    fs.mkdirSync(this.getUserDir(username), { recursive: true });
    fs.mkdirSync(this.getConfigDir(username), { recursive: true });
    fs.mkdirSync(this.getDataDir(username), { recursive: true });
  }
  writeComposeFile(username: string, index: number) {
    const composePath = this.getComposeFile(username);
    const yaml = this.generateComposeYaml(username, index);
    fs.writeFileSync(composePath, yaml, 'utf8');
  }
  startComposeInstance(username: string) {
    if (!this.enableDocker) return;
    const userDir = this.getUserDir(username);
    try {
      execSync('docker compose up -d', { cwd: userDir, stdio: 'ignore' });
    } catch (e) {
      console.error(`Failed to start docker compose for ${username}:`, e);
    }
  }
  stopComposeInstance(username: string) {
    if (!this.enableDocker) return;
    const userDir = this.getUserDir(username);
    try {
      execSync('docker compose down', { cwd: userDir, stdio: 'ignore' });
    } catch (e) {
      // It's ok if already stopped
    }
  }
  removeUserDirs(username: string) {
    const userDir = this.getUserDir(username);
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true, force: true });
    }
  }
  removeInstanceAndData(username: string) {
    this.stopComposeInstance(username);
    this.removeUserDirs(username);
  }
}
