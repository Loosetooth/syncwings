
export const syncthingContainerTag = process.env.SYNCTHING_CONTAINER_TAG || '2.0.3';

const isFileStashTagSpecified = !!process.env.FILESTASH_CONTAINER_TAG;
export const fileStashContainerDigest = process.env.FILESTASH_CONTAINER_DIGEST ||
  isFileStashTagSpecified ?
    '' : 'sha256:29b785d6c7a362581c2254dcafbe91d76a20a73871a520dc85d7d970113bc965';
export const fileStashContainerTag = process.env.FILESTASH_CONTAINER_TAG || 'latest';
export const localIpAddress = process.env.LOCAL_IP_ADDRESS || '';
export const explicitlyListenToLocalIp = process.env.EXPLICITLY_LISTEN_TO_LOCAL_IP === 'true';

export function getMaxUsers(): number {
  return process.env.MAX_USERS ? parseInt(process.env.MAX_USERS, 10) : 10;
}