'use server';

import { revalidatePath } from 'next/cache';
import { store } from '@/lib/data/store';

// ---- Reads -----------------------------------------------------------------
export async function getBoardData() {
  return store.readAll();
}

// ---- Publications (items) --------------------------------------------------
export async function saveItem(record) {
  const saved = await store.upsert('items', sanitizeItem(record));
  revalidatePath('/');
  return saved;
}

export async function deleteItem(id) {
  await store.remove('items', id);
  revalidatePath('/');
  return { ok: true };
}

export async function setItemStatus(id, status) {
  const saved = await store.upsert('items', { id, status });
  revalidatePath('/');
  return saved;
}

export async function distributeYear({ mailbox = 0, video = 0, months = 12, start }) {
  const startDate = start ? new Date(start) : new Date();
  const records = [];
  const spread = (count, day, type) => {
    if (count <= 0) return;
    for (let i = 0; i < count; i++) {
      const monthIndex = Math.floor((i * months) / count);
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex, day);
      const ends = new Date(d);
      ends.setDate(ends.getDate() + 30);
      records.push({
        type,
        title: '',
        status: 'utkast',
        ageAll: true,
        starts: d.toISOString().split('T')[0],
        ends: ends.toISOString().split('T')[0],
        note: '',
      });
    }
  };
  spread(Number(mailbox), 5, 'brevlada');
  spread(Number(video), 15, 'video');
  const created = await store.bulkAdd('items', records);
  revalidatePath('/');
  return created;
}

// ---- Customers -------------------------------------------------------------
export async function saveCustomer(record) {
  const saved = await store.upsert('customers', record);
  revalidatePath('/');
  return saved;
}

export async function deleteCustomer(id) {
  await store.remove('customers', id);
  revalidatePath('/');
  return { ok: true };
}

// ---- Videos ----------------------------------------------------------------
export async function saveVideo(record) {
  const saved = await store.upsert('videos', record);
  revalidatePath('/');
  return saved;
}

export async function deleteVideo(id) {
  await store.remove('videos', id);
  revalidatePath('/');
  return { ok: true };
}

// ---- Leads -----------------------------------------------------------------
export async function saveLead(record) {
  const saved = await store.upsert('leads', record);
  revalidatePath('/');
  return saved;
}

export async function deleteLead(id) {
  await store.remove('leads', id);
  revalidatePath('/');
  return { ok: true };
}

export async function setLeadStage(id, stage) {
  const saved = await store.upsert('leads', { id, stage });
  revalidatePath('/');
  return saved;
}

export async function addLeadDialog(id, entry, dialog) {
  const next = [entry, ...(dialog || [])];
  const saved = await store.upsert('leads', { id, dialog: next });
  revalidatePath('/');
  return saved;
}

// ---- helpers ---------------------------------------------------------------
function sanitizeItem(record) {
  const r = { ...record };
  ['ageFrom', 'ageTo'].forEach((k) => {
    if (r[k] === '' || r[k] === undefined) r[k] = null;
    else if (r[k] !== null) r[k] = Number(r[k]);
  });
  return r;
}
