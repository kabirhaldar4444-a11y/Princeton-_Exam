import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
}

// Generate a unique storage key per browser tab.
// This isolates auth state completely — logging out in one tab won't affect
// another tab, even if both are logged in with different accounts.
const getTabStorageKey = () => {
  const KEY = '_pmi_tab_id';
  let tabId = window.sessionStorage.getItem(KEY);
  if (!tabId) {
    tabId = 'sb_' + Math.random().toString(36).slice(2, 10);
    window.sessionStorage.setItem(KEY, tabId);
  }
  return tabId;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage,
    storageKey: getTabStorageKey(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
