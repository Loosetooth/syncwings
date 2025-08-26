import { UserStore } from "./userStore";

declare global {
  var userStoreSingleton: UserStore | undefined;
  var userStoreInitialized: boolean | undefined;
}

export function getUserStore() {
  if (!globalThis.userStoreSingleton) {
    initUserStore();
  }
  return globalThis.userStoreSingleton;
}

export function initUserStore() {
  if (globalThis.userStoreInitialized) return;
  console.log('Initializing new UserStore')
  globalThis.userStoreInitialized = true;
  globalThis.userStoreSingleton = new UserStore();
  const userStore = globalThis.userStoreSingleton;
  console.log('Starting all UserStore instances');
  userStore.startAllInstances();

  if (typeof process !== 'undefined' && process.on) {
    process.on('SIGINT', () => {
      userStore.stopAllInstances();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      userStore.stopAllInstances();
      process.exit(0);
    });
  }
}
