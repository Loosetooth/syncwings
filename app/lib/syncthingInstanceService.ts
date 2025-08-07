import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

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
  getConfigXmlPath(username: string) {
    return path.join(this.getConfigDir(username), 'config.xml');
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
      - ${tcpPort}:${tcpPort}/tcp
      - ${udpPort}:${udpPort}/udp
      - ${discoveryPort}:${discoveryPort}/udp
    restart: unless-stopped
`;
  }
  async updateSyncthingConfig(username: string, index: number) {
    const tcpPort = 22000 + index;
    const discoveryPort = 21027 + index;

    const configPath = this.getConfigXmlPath(username);

    const xml = fs.readFileSync(configPath, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false });
    const builder = new XMLBuilder({ ignoreAttributes: false, format: true });
    const config = parser.parse(xml);

    // Update listenAddress (each as a separate element)
    const listenAddresses = [
      `tcp://0.0.0.0:${tcpPort}`,
      `quic://0.0.0.0:${tcpPort}`,
      'dynamic+https://relays.syncthing.net/endpoint'
    ];
    config.configuration.options.listenAddress = listenAddresses;

    // Update localAnnouncePort and localAnnounceMCAddr
    config.configuration.options.localAnnouncePort = discoveryPort;
    config.configuration.options.localAnnounceMCAddr = `[ff12::8384]:${discoveryPort}`;

    // Write back
    const newXml = builder.build(config);
    if (xml === newXml) {
      console.log(`No changes to config.xml for ${username}`);
      return { updated: false };
    } else {
      const waitTimes = [5000, 10000, 15000];
      // check if file exists before writing
      while (!fs.existsSync(configPath)) {
        if (waitTimes.length === 0) {
          console.error(`Config file does not exist for ${username}: ${configPath}`);
          throw new Error(`Config file for ${username} does not exist after multiple attempts: ${configPath}`);
        }
        // Wait for a while before retrying
        await new Promise(resolve => setTimeout(resolve, waitTimes.shift()));
      }

      fs.writeFileSync(configPath, newXml, 'utf8');
      console.log(`Updated config.xml for ${username}`);
      return { updated: true };
    }
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
  async startInstance(username: string, index: number) {
    this.ensureUserDirs(username);
    this.writeComposeFile(username, index);
    this.startComposeInstance(username);
    const { updated } = await this.updateSyncthingConfig(username, index);
    if (updated) {
      console.log(`Syncthing config updated for ${username}. Restarting instance...`);
      this.stopComposeInstance(username);
      // Add a short delay to ensure container is fully stopped
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.startComposeInstance(username);
    }
  }
  stopInstance(username: string) {
    this.stopComposeInstance(username);
  }
}
