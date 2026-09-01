import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iozofoybmvyerkpieoov.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Jz-MIKjPSrPJWOjHW4fCTg_WtvITSsn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 30,
    },
    timeout: 20000,
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
