import { create } from 'zustand';
import { LocalDB, SESSION_KEY } from '../lib/db';

type UserSession = {
    token: string;
    email: string;
    displayName: string;
    expiresAt: string;
} | null;

interface AppState {
    isOffline: boolean;
    session: UserSession;
    
    // Actions
    setOfflineStatus: (status: boolean) => void;
    login: (sessionData: UserSession) => Promise<void>;
    logout: () => Promise<void>;
    initStore: () => Promise<void>;
}

/**
 * Zustand global state manager.
 */
export const useStore = create<AppState>((set) => ({
    isOffline: !navigator.onLine,
    session: null,

    setOfflineStatus: (status: boolean) => set({ isOffline: status }),

    login: async (sessionData) => {
        set({ session: sessionData });
        if (sessionData) {
            await LocalDB.setItem(SESSION_KEY, sessionData);
        } else {
            await LocalDB.deleteItem(SESSION_KEY);
        }
    },

    logout: async () => {
        set({ session: null });
        await LocalDB.clearAll();
    },

    initStore: async () => {
        const savedSession = await LocalDB.getItem<UserSession>(SESSION_KEY);
        if (savedSession) {
            set({ session: savedSession });
        }
    }
}));
