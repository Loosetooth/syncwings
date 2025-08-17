import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { InstanceService } from './instanceService';
import { execSync } from 'child_process';

const TEST_BASE_DIR = path.join(process.cwd(), '__test_syncthing_instances');
const TEST_USER = 'testuser';
const TEST_INDEX = 99;
let service: InstanceService;

function cleanTestDir() {
  if (fs.existsSync(TEST_BASE_DIR)) fs.rmSync(TEST_BASE_DIR, { recursive: true, force: true });
}

describe('SyncthingInstanceService (integration)', () => {
  beforeEach(() => {
    cleanTestDir();
    fs.mkdirSync(TEST_BASE_DIR, { recursive: true });
    service = new InstanceService(TEST_BASE_DIR, true);
  });

  afterEach(() => {
    // Always try to stop/remove the instance and clean up
    try { service.removeInstanceAndData(TEST_USER); } catch {}
    cleanTestDir();
  });

  it('should create user dirs and compose file', () => {
    service.ensureUserDirs(TEST_USER);
    service.writeComposeFile(TEST_USER, TEST_INDEX);
    const userDir = service.getUserDir(TEST_USER);
    const composeFile = service.getComposeFile(TEST_USER);
    expect(fs.existsSync(userDir)).toBe(true);
    expect(fs.existsSync(composeFile)).toBe(true);
    const yaml = fs.readFileSync(composeFile, 'utf8');
    expect(yaml).toContain(`container_name: syncthing_${TEST_USER}`);
  });

  it('should start and stop a docker compose instance', () => {
    service.ensureUserDirs(TEST_USER);
    service.writeComposeFile(TEST_USER, TEST_INDEX);
    // Start instance
    service.startComposeInstance(TEST_USER);
    // Check with docker ps if container is running
    const containerName = `syncthing_${TEST_USER}`;
    const ps = execSync('docker ps --format "{{.Names}}"').toString();
    console.log('Running containers:', ps);
    expect(ps).toContain(containerName);
    // Stop and remove
    service.stopComposeInstance(TEST_USER);
    const psAfter = execSync('docker ps --format "{{.Names}}"').toString();
    console.log('Running containers after stop:', psAfter);
    expect(psAfter).not.toContain(containerName);
  },  30000); // 30 seconds
});
