import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://qjuilxfvqvmoqykpdugi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdWlseGZ2cXZtb3F5a3BkdWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NzM0NDUsImV4cCI6MjA3OTM0OTQ0NX0.IpSokpXv7wlbmJWs3wbRw5ULI-QWevQC1vrcSJCjLys";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
