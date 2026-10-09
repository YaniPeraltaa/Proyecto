// Importar cliente Supabase mediante CDN ESM
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://arfrmpefkrzvaajvcfbc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yMh7ZnbaV44Dd0-WyS9X3A_ZKPvLubu';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
