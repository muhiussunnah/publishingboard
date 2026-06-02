import { jsonStore } from './jsonStore';
import { supabaseStore } from './supabaseStore';

const useSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const store = useSupabase ? supabaseStore : jsonStore;
export const BACKEND = store.backend;
