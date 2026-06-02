// Seed a Supabase project with the demo data.
//   1) Run supabase/schema.sql in the Supabase SQL editor (creates tables)
//   2) npm run seed        (reads .env.local automatically via --env-file)
//
// Idempotent: clears each table then re-inserts the demo set.
import { createClient } from '@supabase/supabase-js';
import buildSeed from '../src/lib/data/seed.js';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('\n✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.\n');
    return 1;
  }

  const db = createClient(url, key, { auth: { persistSession: false } });
  const seed = buildSeed();
  const tables = ['customers', 'items', 'videos', 'leads'];

  const hint = (error) => {
    const msg = error?.message || String(error);
    if (/relation .* does not exist|Could not find the table|schema cache/i.test(msg)) {
      console.error('\n✗ Tables not found. In Supabase → SQL Editor, paste supabase/schema.sql and Run, then re-run `npm run seed`.\n');
    } else {
      console.error('\n✗ Supabase error:', msg, '\n');
    }
  };

  for (const tbl of tables) {
    const del = await db.from(tbl).delete().not('id', 'is', null);
    if (del.error) { hint(del.error); return 1; }
    const rows = seed[tbl].map(({ id, ...data }) => ({ data }));
    const { error } = await db.from(tbl).insert(rows);
    if (error) { hint(error); return 1; }
    console.log(`  ✓ ${tbl.padEnd(10)} ${rows.length} rows`);
  }

  const { error: sErr } = await db.from('settings').upsert([
    { key: 'salespeople', value: seed.salespeople },
    { key: 'customerTypes', value: seed.customerTypes },
  ]);
  if (sErr) { hint(sErr); return 1; }
  console.log('  ✓ settings    salespeople + customerTypes');
  console.log('\n✓ Supabase seeded. Restart the app to see Live (Supabase) data.\n');
  return 0;
}

main().then((code) => { process.exitCode = code; });
