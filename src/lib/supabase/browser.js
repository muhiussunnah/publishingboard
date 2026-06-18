'use client';
// Shared browser Supabase client for the CRM feature pages (todo, files,
// credentials, famevent, stats, videostats, login). Uses the public anon key
// against our project. All ported features import { supabase } from here.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(url, anon);
export default supabase;
