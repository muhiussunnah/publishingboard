// Seed a Supabase project with the demo data.
//   1) Run supabase/schema.sql in the Supabase SQL editor (creates tables)
//   2) npm run seed        (reads .env.local automatically via --env-file)
//
// Idempotent: clears each table then re-inserts the demo set.
// Customers are inserted first so we can remap item.customerId → the new UUIDs.
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

  const hint = (error) => {
    const msg = error?.message || String(error);
    if (/relation .* does not exist|Could not find the table|schema cache/i.test(msg)) {
      console.error('\n✗ Tables not found. In Supabase → SQL Editor, paste supabase/schema.sql and Run, then re-run `npm run seed`.\n');
    } else {
      console.error('\n✗ Supabase error:', msg, '\n');
    }
  };

  const clear = async (tbl) => (await db.from(tbl).delete().not('id', 'is', null)).error;

  // 1) customers first → build seedId → newUUID map so item links survive
  let err = await clear('customers');
  if (err) { hint(err); return 1; }
  const idMap = {};
  for (const c of seed.customers) {
    const { id: seedId, ...data } = c;
    const { data: row, error } = await db.from('customers').insert({ data }).select('id').single();
    if (error) { hint(error); return 1; }
    idMap[seedId] = row.id;
  }
  console.log(`  ✓ customers  ${seed.customers.length} rows`);

  // 2) items with remapped customerId
  err = await clear('items');
  if (err) { hint(err); return 1; }
  const itemRows = seed.items.map(({ id, customerId, ...rest }) => ({ data: { ...rest, customerId: idMap[customerId] ?? null } }));
  err = (await db.from('items').insert(itemRows)).error;
  if (err) { hint(err); return 1; }
  console.log(`  ✓ items      ${itemRows.length} rows`);

  // 3) standalone collections
  for (const tbl of ['videos', 'leads']) {
    err = await clear(tbl);
    if (err) { hint(err); return 1; }
    const rows = seed[tbl].map(({ id, ...data }) => ({ data }));
    err = (await db.from(tbl).insert(rows)).error;
    if (err) { hint(err); return 1; }
    console.log(`  ✓ ${tbl.padEnd(10)} ${rows.length} rows`);
  }

  // 4) settings
  err = (await db.from('settings').upsert([
    { key: 'salespeople', value: seed.salespeople },
    { key: 'customerTypes', value: seed.customerTypes },
  ])).error;
  if (err) { hint(err); return 1; }
  console.log('  ✓ settings    salespeople + customerTypes');

  console.log('\n✓ Supabase seeded (customer links remapped). Reload the app for Live data.\n');
  return 0;
}

main().then((code) => { process.exitCode = code; });
