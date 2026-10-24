import { describe, it, expect, afterEach, vi } from 'vitest';

const DEFAULT_DIGEST = 'sha256:29b785d6c7a362581c2254dcafbe91d76a20a73871a520dc85d7d970113bc965';
const CUSTOM_DIGEST = 'sha256:004822ae423dcecc445659e66db7ef9efc984ec4a317d205fede4527b24dde8c';

// constants.ts reads process.env at import time, so re-import it for each env combination
async function loadConstants(env: { digest?: string; tag?: string }) {
  vi.stubEnv('FILESTASH_CONTAINER_DIGEST', env.digest ?? '');
  vi.stubEnv('FILESTASH_CONTAINER_TAG', env.tag ?? '');
  vi.resetModules();
  return import('./constants');
}

describe('FileStash container image constants', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the default digest when neither digest nor tag is set', async () => {
    const { fileStashContainerDigest } = await loadConstants({});
    expect(fileStashContainerDigest).toBe(DEFAULT_DIGEST);
  });

  it('uses the configured digest when only a digest is set', async () => {
    const { fileStashContainerDigest } = await loadConstants({ digest: CUSTOM_DIGEST });
    expect(fileStashContainerDigest).toBe(CUSTOM_DIGEST);
  });

  it('uses the tag (and no digest) when only a tag is set', async () => {
    const { fileStashContainerDigest, fileStashContainerTag } = await loadConstants({ tag: 'v0.6' });
    expect(fileStashContainerDigest).toBe('');
    expect(fileStashContainerTag).toBe('v0.6');
  });

  it('prefers the digest when both digest and tag are set', async () => {
    const { fileStashContainerDigest } = await loadConstants({ digest: CUSTOM_DIGEST, tag: 'v0.6' });
    expect(fileStashContainerDigest).toBe(CUSTOM_DIGEST);
  });
});
