import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { fileStashContainerTag, syncthingContainerTag } from './constants';
import { generateFilestashSecretKey, encryptFilestashConfig, decryptFilestashConfig } from './filestash/crypto';
import { enableFileStash } from './constants.shared';
import { waitForFileExists } from './awaitFileExists';
import { updateSyncthingConfigString } from './syncthingConfig';

/**
 * Service to manage Syncthing instances for users.
 * Handles user directories, Docker Compose files, and instance management.
 * Each user has a unique Syncthing instance with its own configuration and data directories.
 */
export class InstanceService {
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
  getFileStashConfigPath(username: string) {
    return path.join(this.getFilestashConfigDir(username), 'config.json');
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
  getFilestashConfigDir(username: string) {
    return path.join(this.getUserDir(username), 'filestash', 'config');
  }
  generateComposeYaml(username: string, index: number): string {
    const webPort = 8384 + index;
    const tcpPort = 22000 + index;
    const udpPort = 22000 + index;
    const discoveryPort = 21027 + index;
    const dataDirExternal = process.env.DATA_DIR_EXTERNAL || this.baseDir || '/data';
    const userExternalDir = `${dataDirExternal}/users/${username}`;

    const fileStashUiPort = 8334 + index;

    const mainConfig = `
services:
  syncthing:
    image: syncthing/syncthing:${syncthingContainerTag}
    container_name: syncthing_${username}
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
    volumes:
      - ${userExternalDir}/config:/var/syncthing/config
      - ${userExternalDir}/data:/data
    ports:
      - 127.0.0.1:${webPort}:8384
      - ${tcpPort}:${tcpPort}/tcp
      - ${udpPort}:${udpPort}/udp
      - ${discoveryPort}:${discoveryPort}/udp
    restart: unless-stopped
    `;

    // If File Stash is enabled, add its configuration
    const fileStashConfig = enableFileStash ? `
  filestash:
    container_name: filestash_${username}
    image: machines/filestash:${fileStashContainerTag}
    restart: unless-stopped
    user: "1000:1000"
    environment:
      - APPLICATION_URL=
      - CANARY=true
      - FILESTASH_BASE=/filestash
    ports:
      - "127.0.0.1:${fileStashUiPort}:8334"
    volumes:
      - ${userExternalDir}/filestash:/app/data/state/
      - ${userExternalDir}/data:/app/userdata
` : '';


    return mainConfig + fileStashConfig;
  }

  async updateSyncthingConfig(username: string, index: number) {
    const configPath = this.getConfigXmlPath(username);

    let xml = '';
    try {
      await waitForFileExists(configPath);
      xml = fs.readFileSync(configPath, 'utf8');
    } catch (error) {
      console.error(`Error reading ${configPath}:`, error);
      throw new Error(`Could not read config file for ${username}: ${configPath}`);
    }

    const updateResult = updateSyncthingConfigString(xml, username, index);

    if(!updateResult.updated) {
      return { updated: false };
    } else {
      const newXml = updateResult.xml!;
      try {
        await waitForFileExists(configPath);
      } catch (error) {
        console.error(`Config file does not exist for ${username}: ${configPath}`);
        throw new Error(`Config file for ${username} does not exist after multiple attempts: ${configPath}`);
      }

      fs.writeFileSync(configPath, newXml, 'utf8');
      console.log(`Updated config.xml for ${username}`);
      return { updated: true };
    }
  }

  async updateFileStashConfig(username: string, index: number) {
    const configPath = this.getFileStashConfigPath(username);

    type FileStashConfig = {
      general?: { secret_key?: string };
      connections?: { type: string; label: string }[];
      middleware?: {
        identity_provider?: { type: string; params?: string };
        attribute_mapping?: { related_backend: string; params?: string | null };
      };
      features?: {
        share?: {
          enable?: boolean;
        };
      };
    };

    let originalConfig: FileStashConfig = {};
    let newConfig: FileStashConfig = {};
    let secretKey: string | undefined;

    // Wait until config file exists (up to ~30s)
    // This is needed because the filestash container may not have created it yet
    // when we first start the instance
    // We will retry a few times with increasing delays
    // If after all retries it still doesn't exist, we will create a new config
    try {
      await waitForFileExists(configPath);
      originalConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      // clone the original config to newConfig
      newConfig = structuredClone(originalConfig);
      secretKey = newConfig.general?.secret_key;
    } catch (error) {
      // If it doesn't exist after retries, we will create a new config
      console.error(`Filestash config file does not exist for user ${username}.`);
      throw new Error(`Could not read config file for ${username}: ${configPath}`);
    }

    if (!secretKey) {
      secretKey = generateFilestashSecretKey();
      if (!newConfig.general) newConfig.general = {};
      newConfig.general.secret_key = secretKey;
    }

    // Set required properties
    newConfig.connections = [
      {
        type: 'local',
        label: 'local',
      },
    ];

    // Middleware filestash configuration
    const idParamObj = { strategy: 'direct' };
    const idpParamsUnencrypted = JSON.stringify(idParamObj);
    const idpParams = encryptFilestashConfig(secretKey, idpParamsUnencrypted);
    const attributeParamsObj = { local: { type: 'local', password: secretKey, path: '/app/userdata' } };
    const attributeParamsUnencrypted = JSON.stringify(attributeParamsObj);
    const attributeMappingParams = encryptFilestashConfig(secretKey, attributeParamsUnencrypted);

    // Check if the config is the same, if not, update
    // We need to check unencrypted values because encrypted values will differ each time
    // due to changing nonce/iv
    const unencryptedOriginalIdpParams = originalConfig.middleware?.identity_provider?.params ?
      decryptFilestashConfig(secretKey, originalConfig.middleware?.identity_provider?.params) : undefined;
    const unencryptedOriginalAttributeParams = originalConfig.middleware?.attribute_mapping?.params ?
      decryptFilestashConfig(secretKey, originalConfig.middleware?.attribute_mapping?.params) : undefined;
    const unencryptedOriginalMiddleware = {
      identity_provider: {
        type: originalConfig.middleware?.identity_provider?.type,
        params: unencryptedOriginalIdpParams,
      },
      attribute_mapping: {
        related_backend: originalConfig.middleware?.attribute_mapping?.related_backend,
        params: unencryptedOriginalAttributeParams,
      },
    };
    const unencryptedNewMiddleware = {
      identity_provider: {
        type: 'passthrough',
        params: idpParamsUnencrypted,
      },
      attribute_mapping: {
        related_backend: 'local',
        params: attributeParamsUnencrypted,
      },
    };

    // Set features.share.enabled to false by default
    if (!newConfig.features) newConfig.features = {};
    if (!newConfig.features.share) newConfig.features.share = {};
    newConfig.features.share.enable = false;

    const isShareFeatureSame = originalConfig.features?.share?.enable === newConfig.features.share.enable;
    const isMiddlewareSame = JSON.stringify(unencryptedOriginalMiddleware) === JSON.stringify(unencryptedNewMiddleware);

    if (isShareFeatureSame && isMiddlewareSame) {
      console.log(`No changes to filestash middleware config for ${username}`);
      return { updated: false };
    }

    newConfig.middleware = {
      identity_provider: {
        type: 'passthrough',
        params: idpParams,
      },
      attribute_mapping: {
        related_backend: 'local',
        params: attributeMappingParams,
      },
    };

    try {
      await waitForFileExists(configPath);
    } catch (error) {
      console.error(`Config file does not exist for ${username}: ${configPath}`);
      throw new Error(`Config file for ${username} does not exist after multiple attempts: ${configPath}`);
    }

    // Write the new config
    console.log(`Updating filestash config.json for ${username}`);
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 4), 'utf8');
    return { updated: true };
  }

  ensureUserDirs(username: string) {
    fs.mkdirSync(this.getUserDir(username), { recursive: true });
    fs.mkdirSync(this.getConfigDir(username), { recursive: true });
    fs.mkdirSync(this.getDataDir(username), { recursive: true });
    fs.mkdirSync(this.getFilestashConfigDir(username), { recursive: true });
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

    // Wait a bit to allow services to write or update their config files
    await new Promise(resolve => setTimeout(resolve, 10_000));

    // Stop the instance to safely update configs
    this.stopComposeInstance(username);

    try {
      const { updated } = await this.updateSyncthingConfig(username, index);
    } catch (error) {
      console.error(`Failed to update Syncthing config for ${username}:`, error);
    }
    try {
      const { updated: fileStashUpdated } = await this.updateFileStashConfig(username, index);
    } catch (error) {
      console.error(`Failed to update Filestash config for ${username}:`, error);
    }

    // Start the instance after config updates
    this.startComposeInstance(username);
  }
  stopInstance(username: string) {
    this.stopComposeInstance(username);
  }
}
