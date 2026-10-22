import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { makeHandler } from './handler.mjs';

// Gleicher geschützter Zugang wie Kompass. Keine Mailinhalte im statischen Frontend.
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
Deno.serve(makeHandler({
  db, password: Deno.env.get('GFWEEKLY_PASSWORD') || '',
  asanaToken: Deno.env.get('ASANA_TOKEN') || '',
  workspace: Deno.env.get('ASANA_WORKSPACE') || '57435200923138',
  fetchImpl: fetch,
}));
