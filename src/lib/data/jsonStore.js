// Local JSON-file persistence — the default backend so the board is fully
// dynamic on localhost with zero external setup. Swapped for Supabase
// automatically when SUPABASE env vars are present (see store.js).
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import buildSeed from './seed';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const COLLECTIONS = ['customers', 'items', 'videos', 'leads'];
const META = ['salespeople', 'customerTypes'];

let cache = null;
let writeQueue = Promise.resolve();

async function ensureLoaded() {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DB_FILE, 'utf8');
    cache = JSON.parse(raw);
  } catch {
    cache = buildSeed();
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
  }
  // guarantee shape
  for (const c of COLLECTIONS) if (!Array.isArray(cache[c])) cache[c] = [];
  for (const m of META) if (!Array.isArray(cache[m])) cache[m] = [];
  return cache;
}

function persist() {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify(cache, null, 2), 'utf8');
  });
  return writeQueue;
}

export const jsonStore = {
  backend: 'json',

  async readAll() {
    await ensureLoaded();
    return JSON.parse(JSON.stringify(cache));
  },

  async upsert(collection, record) {
    await ensureLoaded();
    if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown collection ${collection}`);
    const list = cache[collection];
    const rec = { ...record };
    if (!rec.id) {
      rec.id = crypto.randomUUID();
      list.push(rec);
    } else {
      const idx = list.findIndex((x) => x.id === rec.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...rec };
      else list.push(rec);
    }
    await persist();
    return rec;
  },

  async remove(collection, id) {
    await ensureLoaded();
    if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown collection ${collection}`);
    cache[collection] = cache[collection].filter((x) => x.id !== id);
    await persist();
    return { id };
  },

  async bulkAdd(collection, records) {
    await ensureLoaded();
    if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown collection ${collection}`);
    const created = records.map((r) => ({ ...r, id: r.id || crypto.randomUUID() }));
    cache[collection].push(...created);
    await persist();
    return created;
  },

  async setMeta(key, arr) {
    await ensureLoaded();
    if (!META.includes(key)) throw new Error(`Unknown meta ${key}`);
    cache[key] = arr;
    await persist();
    return arr;
  },

  async reset() {
    cache = buildSeed();
    await persist();
    return cache;
  },
};
