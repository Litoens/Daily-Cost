// Vendored, pinned copy of @supabase/supabase-js (no CDN at runtime); see js/vendor/README.md.
import { createClient } from './vendor/supabase-js-2.119.0.js'

// Supabase configuration
const SUPABASE_URL = 'https://pbivydommrnxxerkdjva.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NzpyseV36Bd7EGh868B4HQ_QYaQXUNc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
