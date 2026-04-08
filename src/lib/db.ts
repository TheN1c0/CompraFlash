import { get, set, update, del, clear } from 'idb-keyval';

// Key definitions
export const OFFLINE_QUEUE_KEY = 'compraflash_sync_queue';
export const CACHED_LISTS_KEY = 'compraflash_lists';
export const SESSION_KEY = 'compraflash_session';

/**
 * Wrapper for idb-keyval to handle the PWA Offline Persistence caching layer.
 * 
 * SOLID Principle: SRP - This only deals with raw IndexedDB operations.
 */
export const LocalDB = {
    // Get item from local storage by string key
    getItem: async <T>(key: string): Promise<T | undefined> => {
        try {
            return await get<T>(key);
        } catch (error) {
            console.error(`Error reading ${key} from IndexedDB:`, error);
            return undefined;
        }
    },

    // Set item in local storage
    setItem: async <T>(key: string, value: T): Promise<void> => {
        try {
            await set(key, value);
        } catch (error) {
            console.error(`Error writing ${key} to IndexedDB:`, error);
        }
    },

    // Delete item
    deleteItem: async (key: string): Promise<void> => {
        try {
            await del(key);
        } catch (error) {
            console.error(`Error deleting ${key} from IndexedDB:`, error);
        }
    },

    // Clear entire local DB (e.g. on logout)
    clearAll: async (): Promise<void> => {
        try {
            await clear();
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
        }
    }
};
