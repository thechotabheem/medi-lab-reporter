import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const DB_NAME = 'lab-reporter-cache';
const DB_VERSION = 1;
const STORE_NAME = 'queryCache';
const CACHE_KEY = 'reactQueryCache';

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * IndexedDB-based persister for React Query cache.
 * Stores the entire query cache so pages load with cached data when offline.
 */
export function createIDBPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        const db = await openCacheDB();
        return new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).put(client, CACHE_KEY);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // IndexedDB may not be available
      }
    },
    restoreClient: async () => {
      try {
        const db = await openCacheDB();
        return new Promise<PersistedClient | undefined>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const request = tx.objectStore(STORE_NAME).get(CACHE_KEY);
          request.onsuccess = () => resolve(request.result as PersistedClient | undefined);
          request.onerror = () => reject(request.error);
        });
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        const db = await openCacheDB();
        return new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          tx.objectStore(STORE_NAME).delete(CACHE_KEY);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // ignore
      }
    },
  };
}
