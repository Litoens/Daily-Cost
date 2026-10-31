// Import Supabase CDN script in HTML before loading this file or use ES modules from CDN.
// For browser ES modules:
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Supabase configuration
const SUPABASE_URL = 'https://pbivydommrnxxerkdjva.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NzpyseV36Bd7EGh868B4HQ_QYaQXUNc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
