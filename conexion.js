// Importar cliente Supabase mediante CDN ESM
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://vmqjslifladwmyengxct.supabase.co';
const SUPABASE_KEY = 'sb_publishable_k7cJZ9Dxc97UxZsrX-g29w_vnU_yl_Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    global: {
        headers: { 'apikey': SUPABASE_KEY }
    }
});