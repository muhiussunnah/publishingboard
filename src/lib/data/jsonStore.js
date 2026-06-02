// Local persistence backend — the default so the board is fully dynamic with
// zero setup. It is SERVERLESS-SAFE: on read-only filesystems (e.g. Vercel)
// writes are silently skipped and the store runs in-memory for the instance,
// so the app never crashes. For durable, multi-instance persistence in
// production, set the Supabase env vars (see store.js / .env.example).
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import buildSeed from './seed';

const COLLECTIONS = ['customers', 'items', 'videos', 'leads'];
const META = ['salespeople', 'customerTypes'];

// Prefer a project-local folder (durable in dev); fall back to the OS temp dir.
const PRIMARY_DIR = path.join(process.cwd(), '.data');
const FALLBACK_DIR = path.join(os.tmpdir(), 'famies-publiceringsbord');
let dataDir = PRIMARY_DIR;
let dbFile = path.join(dataDir, 'db.json');

let cache = null;
let writable = true;
let writeQueue = Promise.resolve();

function normalize(obj) {
  for (const c of COLLECTIONS) if (!Array.isArray(obj[c])) obj[c] = [];
  for (const m of META) if (!Array.isArray(obj[m])) obj[m] = [];
  return obj;
}

async function tryReadFrom(dir) {
  try {
    const raw = await fs.readFile(path.join(dir, 'db.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function ensureLoaded() {
  if (cache) return cache;
  // try primary then fallback location
  let loaded = await tryReadFrom(PRIMARY_DIR);
  if (loaded) { dataDir = PRIMARY_DIR; }
  else {
    loaded = await tryReadFrom(FALLBACK_DIR);
    if (loaded) dataDir = FALLBACK_DIR;
  }
  dbFile = path.join(dataDir, 'db.json');

  if (loaded) {
    cache = normalize(loaded);
  } else {
    cache = normalize(buildSeed());
    await safeWrite(); // best-effort seed to disk
  }
  return cache;
}

// Never throws. On a read-only FS it switches to temp, then gives up gracefully.
async function safeWrite() {
  if (!writable) return;
  writeQueue = writeQueue.then(async () => {
    const payload = JSON.stringify(cache, null, 2);
    for (const dir of [dataDir, FALLBACK_DIR]) {
      try {
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, 'db.json'), payload, 'utf8');
        dataDir = dir;
        dbFile = path.join(dir, 'db.json');
        return;
      } catch {
        /* try next location */
      }
    }
    writable = false; // read-only environment — keep running in memory
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
    await safeWrite();
    return rec;
  },

  async remove(collection, id) {
    await ensureLoaded();
    if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown collection ${collection}`);
    cache[collection] = cache[collection].filter((x) => x.id !== id);
    await safeWrite();
    return { id };
  },

  async bulkAdd(collection, records) {
    await ensureLoaded();
    if (!COLLECTIONS.includes(collection)) throw new Error(`Unknown collection ${collection}`);
    const created = records.map((r) => ({ ...r, id: r.id || crypto.randomUUID() }));
    cache[collection].push(...created);
    await safeWrite();
    return created;
  },

  async setMeta(key, arr) {
    await ensureLoaded();
    if (!META.includes(key)) throw new Error(`Unknown meta ${key}`);
    cache[key] = arr;
    await safeWrite();
    return arr;
  },

  async reset() {
    cache = normalize(buildSeed());
    await safeWrite();
    return cache;
  },
};
