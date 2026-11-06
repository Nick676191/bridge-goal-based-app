// The connection to PYN's Supabase project: the online database, logins and
// photo storage. Every read and write to the server goes through `supabase`.

import 'react-native-url-polyfill/auto'; // supabase-js needs the web's URL tools
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

// The project address and its publishable key, from the Supabase dashboard
// (Project Settings > API Keys). The publishable key is meant to ship inside
// the app: on its own it can only do what the database's row-level security
// rules allow. Never put the secret (service_role) key in the app or in GitHub.
export const SUPABASE_URL = 'https://wrwcrjmmsfxakulvrwlj.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_bzMjPkpmh7xHkGWXBt8aXQ_mwUhtgw5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // Keep people logged in between app launches by saving the session on the
    // phone. (On the web preview the browser's own storage is used.)
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// A login stays valid by refreshing in the background. Only do that while the
// app is open on screen, as Supabase recommends for phone apps.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
