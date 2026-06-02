// Supabase backend — activates automatically when NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are set. Uses a pragmatic "document" schema
// (id + jsonb data per table) so the flexible publication shapes round-trip
// cleanly and the app logic is identical to the local JSON backend.
import { createClient } from '@supabase/supabase-js';

const TABLES = { customers: 'customers', items: 'items', videos: 'videos', leads: 'leads' };

let _client = null;
function db() {
  if (_client) return _client;
  _client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  return _client;
}

const rowToRecord = (row) => ({ id: row.id, ...(row.data || {}) });

export const supabaseStore = {
  backend: 'supabase',

  async readAll() {
    const out = { customers: [], items: [], videos: [], leads: [], salespeople: [], customerTypes: [] };
    for (const [coll, table] of Object.entries(TABLES)) {
      const { data, error } = await db().from(table).select('*').order('created_at', { ascending: true });
      if (error) throw error;
      out[coll] = (data || []).map(rowToRecord);
    }
    const { data: settings } = await db().from('settings').select('*');
    for (const s of settings || []) {
      if (s.key === 'salespeople') out.salespeople = s.value || [];
      if (s.key === 'customerTypes') out.customerTypes = s.value || [];
    }
    return out;
  },

  async upsert(collection, record) {
    const table = TABLES[collection];
    const { id, ...data } = record;
    if (id) {
      const { error } = await db().from(table).update({ data }).eq('id', id);
      if (error) throw error;
      return record;
    }
    const { data: inserted, error } = await db().from(table).insert({ data }).select('*').single();
    if (error) throw error;
    return rowToRecord(inserted);
  },

  async remove(collection, id) {
    const { error } = await db().from(TABLES[collection]).delete().eq('id', id);
    if (error) throw error;
    return { id };
  },

  async bulkAdd(collection, records) {
    const rows = records.map((data) => ({ data }));
    const { data: inserted, error } = await db().from(TABLES[collection]).insert(rows).select('*');
    if (error) throw error;
    return (inserted || []).map(rowToRecord);
  },

  async setMeta(key, arr) {
    const { error } = await db().from('settings').upsert({ key, value: arr });
    if (error) throw error;
    return arr;
  },
};
