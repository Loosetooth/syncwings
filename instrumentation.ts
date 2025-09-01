
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initUserStore } = await import('./app/lib/userStoreSingleton');
    initUserStore();
  }
}