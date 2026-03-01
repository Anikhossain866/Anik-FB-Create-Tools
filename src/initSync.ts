import { db, isFirebaseConfigured } from './firebase';
import { ref, onValue, set } from 'firebase/database';

export async function initSync() {
  try {
    let serverState: any = { users: [], logs: [], accounts: [] };
    
    // If Firebase is configured, use it
    if (isFirebaseConfigured() && db) {
      const dbRef = ref(db, 'app_data');
      
      onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          serverState = {
            users: data.users || [],
            logs: data.logs || [],
            accounts: data.accounts || []
          };
          window.dispatchEvent(new Event('sync_update'));
        }
      });
      
      const originalGetItem = localStorage.getItem.bind(localStorage);
      const originalSetItem = localStorage.setItem.bind(localStorage);
      
      localStorage.getItem = (key: string) => {
        if (key === 'app_users') return JSON.stringify(serverState.users || []);
        if (key === 'app_logs') return JSON.stringify(serverState.logs || []);
        if (key === 'app_accounts') return JSON.stringify(serverState.accounts || []);
        return originalGetItem(key);
      };
      
      localStorage.setItem = (key: string, value: string) => {
        if (key === 'app_users') {
          serverState.users = JSON.parse(value);
          set(ref(db, 'app_data/users'), serverState.users).catch(console.error);
          return;
        }
        if (key === 'app_logs') {
          serverState.logs = JSON.parse(value);
          set(ref(db, 'app_data/logs'), serverState.logs).catch(console.error);
          return;
        }
        if (key === 'app_accounts') {
          serverState.accounts = JSON.parse(value);
          set(ref(db, 'app_data/accounts'), serverState.accounts).catch(console.error);
          return;
        }
        originalSetItem(key, value);
      };
      
      return; // Exit early since Firebase is handling sync
    }

    // Fallback to local server API if Firebase is not configured
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          serverState = await res.json();
          window.dispatchEvent(new Event('sync_update'));
        }
      } catch (e) {
        console.error('Fetch state error', e);
      }
    };
    
    await fetchState();
    
    // Poll every 5 seconds to keep data fresh
    setInterval(fetchState, 5000);
    
    const originalGetItem = localStorage.getItem.bind(localStorage);
    const originalSetItem = localStorage.setItem.bind(localStorage);
    
    localStorage.getItem = (key: string) => {
      if (key === 'app_users') return JSON.stringify(serverState.users || []);
      if (key === 'app_logs') return JSON.stringify(serverState.logs || []);
      if (key === 'app_accounts') return JSON.stringify(serverState.accounts || []);
      return originalGetItem(key);
    };
    
    localStorage.setItem = (key: string, value: string) => {
      if (key === 'app_users') {
        serverState.users = JSON.parse(value);
        fetch('/api/action', { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({ type: 'UPDATE_USERS', payload: serverState.users }) 
        }).catch(console.error);
        return;
      }
      if (key === 'app_logs') {
        serverState.logs = JSON.parse(value);
        fetch('/api/action', { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({ type: 'UPDATE_LOGS', payload: serverState.logs }) 
        }).catch(console.error);
        return;
      }
      if (key === 'app_accounts') {
        serverState.accounts = JSON.parse(value);
        fetch('/api/action', { 
          method: 'POST', 
          headers: {'Content-Type': 'application/json'}, 
          body: JSON.stringify({ type: 'UPDATE_ACCOUNTS', payload: serverState.accounts }) 
        }).catch(console.error);
        return;
      }
      originalSetItem(key, value);
    };
  } catch (e) {
    console.error('Failed to init sync', e);
  }
}
