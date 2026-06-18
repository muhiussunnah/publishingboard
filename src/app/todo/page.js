'use client';
// ============================================================================
// Famies Todo Operator — full React port of the vanilla-JS operator board.
// Single client component, light design system, wired to our Supabase.
// Tables: tasks(id text pk, data jsonb, updated_at), recurring(id, data, updated_at),
//         meta(key text pk, value text). Each row stores the full object in `data`.
// ============================================================================
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/browser';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, History, Check, Send, Trash2, MoreVertical, Repeat,
  ChevronLeft, ChevronRight, Crown, X,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts';

// ─── members / employees (exact list + colors from source) ──────────────────
const MEMBERS = [
  { name: 'Albin', color: '#5B8DEF' }, { name: 'Injamul', color: '#1FB57A' },
  { name: 'Tayyab', color: '#F2994A' }, { name: 'Tåve', color: '#BB6BD9' },
  { name: 'Johan', color: '#EB5757' }, { name: 'Rifqi', color: '#2D9CDB' },
  { name: 'Ezra', color: '#E0A92B' }, { name: 'Stefan', color: '#43B97F' },
  { name: 'Anders', color: '#8A7DF5' }, { name: 'Cecilia', color: '#FF85A1' },
];
const COLOR = Object.fromEntries(MEMBERS.map((m) => [m.name, m.color]));
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUSES = [
  { key: 'todo', label: 'To Do', swatch: 'var(--muted)' },
  { key: 'progress', label: 'In Progress', swatch: 'var(--blue)' },
  { key: 'question', label: 'Needs answer or review', swatch: 'var(--amber)' },
  { key: 'done', label: 'Done this week', swatch: 'var(--green)' },
];

// ─── date / ISO-week helpers — PORTED EXACTLY FROM SOURCE ────────────────────
function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const fday = (first.getUTCDay() + 6) % 7;
  first.setUTCDate(first.getUTCDate() - fday + 3);
  const wk = 1 + Math.round((t - first) / (7 * 864e5));
  return t.getUTCFullYear() + '-W' + String(wk).padStart(2, '0');
}
function weekDates(base) {
  const d = new Date(base);
  const day = (d.getDay() + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - day);
  mon.setHours(0, 0, 0, 0);
  return WEEKDAYS.map((wd, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return { wd, key: x.toISOString().slice(0, 10), label: wd };
  });
}
const NOW = () => new Date();
const CURWEEK = () => isoWeek(NOW());
const dkey = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const todayKey = () => dkey(NOW());
function ago(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 90) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  return Math.round(s / 86400) + 'd ago';
}
const isNew = (ts) => (Date.now() - ts) < 86400000;
const fmtDue = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const isOverdue = (t) => t.due && t.status !== 'done' && t.due < todayKey();
const uid = (p) => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

// ─── recurring helpers ──────────────────────────────────────────────────────
function recurPills(r) {
  const wd = weekDates(NOW());
  const tk = todayKey();
  if (r.sched.type === 'daily') return wd.map((d) => ({ key: d.key, label: d.label, today: d.key === tk, past: d.key < tk }));
  if (r.sched.type === 'weekdays') return wd.filter((d) => r.sched.days.includes(d.wd)).map((d) => ({ key: d.key, label: d.label, today: d.key === tk, past: d.key < tk }));
  return [{ key: CURWEEK(), label: 'This week', today: true, past: false, weekly: true }];
}
function recurAllDone(r) {
  const p = recurPills(r);
  if (!p.length) return false;
  return p.every((x) => r.completions && r.completions[x.key]);
}

// ─── small presentational atoms ─────────────────────────────────────────────
function Avatar({ name, size = 18, font = 9.5 }) {
  return (
    <span
      style={{
        width: size, height: size, borderRadius: '50%', flex: '0 0 auto',
        background: COLOR[name] || '#888', color: '#fff', fontSize: font, fontWeight: 800,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '-.02em',
      }}
    >
      {(name && name[0] ? name[0].toUpperCase() : '?')}
    </span>
  );
}
const DotsIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
);

// ============================================================================
export default function TodoPage() {
  const [oneOffs, setOneOffs] = useState([]);
  const [recurrings, setRecurrings] = useState([]);
  const [filter, setFilter] = useState('All');
  const [view, setView] = useState('board');        // board | overview
  const [ovTab, setOvTab] = useState('calendar');   // calendar | leaderboard | analytics
  const [me, setMe] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [calRef, setCalRef] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [tick, setTick] = useState(0); // forces re-render for relative-time refresh

  // modal state
  const [addOpen, setAddOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  // refs for refresh gating (avoid stale closures inside subscriptions / timers)
  const draggingRef = useRef(null);
  const modalOpenRef = useRef(false);
  const refreshTimer = useRef(null);

  const modalOpen = addOpen || histOpen;
  useEffect(() => { modalOpenRef.current = modalOpen; }, [modalOpen]);
  useEffect(() => { draggingRef.current = dragging; }, [dragging]);

  // ── load me from localStorage ──
  useEffect(() => {
    let stored = null;
    try { stored = localStorage.getItem('famies_me') || null; } catch { /* ignore */ }
    setMe(stored);
  }, []);

  // ── data layer (Supabase) ──
  const loadAll = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([
        supabase.from('tasks').select('data'),
        supabase.from('recurring').select('data'),
      ]);
      if (!t.error && t.data) setOneOffs(t.data.map((x) => x.data).filter(Boolean));
      if (!r.error && r.data) setRecurrings(r.data.map((x) => x.data).filter(Boolean));
    } catch (e) {
      // tables may not exist yet — render empty board gracefully
      console.error('todo load failed', e);
    }
  }, []);

  const saveTask = useCallback(async (t) => {
    try { await supabase.from('tasks').upsert({ id: t.id, data: t, updated_at: new Date().toISOString() }); } catch (e) { console.error(e); }
  }, []);
  const delTaskDb = useCallback(async (id) => {
    try { await supabase.from('tasks').delete().eq('id', id); } catch (e) { console.error(e); }
  }, []);
  const saveRecur = useCallback(async (r) => {
    try { await supabase.from('recurring').upsert({ id: r.id, data: r, updated_at: new Date().toISOString() }); } catch (e) { console.error(e); }
  }, []);
  const delRecurDb = useCallback(async (id) => {
    try { await supabase.from('recurring').delete().eq('id', id); } catch (e) { console.error(e); }
  }, []);

  // ── seed-once (only the teammate whose meta insert succeeds creates demo data) ──
  const seedIfEmpty = useCallback(async () => {
    let first = false;
    try {
      const ins = await supabase.from('meta').insert({ key: 'seeded', value: '1' });
      first = !ins.error;
    } catch { first = false; }
    if (!first) return;
    const seeds = [
      { assignee: 'Injamul', title: 'Event publishing', sched: { type: 'weekdays', days: ['Tue', 'Wed'] } },
      { assignee: 'Tayyab', title: 'Social media publish', sched: { type: 'daily', days: [] } },
      { assignee: 'Tåve', title: 'Gaining followers from FB', sched: { type: 'weekly', days: [] } },
      { assignee: 'Albin', title: 'Contact Almi', sched: { type: 'weekly', days: [] } },
    ];
    const newRecs = [];
    for (const s of seeds) {
      const r = { id: uid('r'), assignee: s.assignee, title: s.title, sched: s.sched, completions: {}, createdAt: Date.now() };
      newRecs.push(r);
      await saveRecur(r);
    }
    const ex = { id: uid('t'), assignee: 'Injamul', title: 'Quality check images in event calendar', status: 'todo', note: '', due: null, createdAt: Date.now(), completedAt: null };
    setRecurrings((p) => [...p, ...newRecs]);
    setOneOffs((p) => [...p, ex]);
    await saveTask(ex);
  }, [saveRecur, saveTask]);

  // ── refresh (debounced) — skip while modal open or dragging ──
  const refresh = useCallback(async () => {
    if (modalOpenRef.current || draggingRef.current) return;
    await loadAll();
  }, [loadAll]);
  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(refresh, 400);
  }, [refresh]);

  // ── init: load, seed, subscribe realtime, periodic refresh, prompt name ──
  useEffect(() => {
    let channel;
    (async () => {
      await loadAll();
      await seedIfEmpty();
      try {
        channel = supabase.channel('famies-board')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, scheduleRefresh)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring' }, scheduleRefresh)
          .subscribe();
      } catch (e) { console.error('realtime', e); }
    })();
    const periodic = setInterval(refresh, 20000);
    const relClock = setInterval(() => setTick((x) => x + 1), 60000); // keep "ago" labels fresh
    return () => {
      if (channel) supabase.removeChannel(channel);
      clearInterval(periodic);
      clearInterval(relClock);
      clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // prompt for name on first load once me has resolved (null) and members ready
  const [askName, setAskName] = useState(false);
  useEffect(() => {
    if (me === null) {
      const id = setTimeout(() => setAskName(true), 300);
      return () => clearTimeout(id);
    }
    setAskName(false);
  }, [me]);

  const pickMe = (name) => {
    setMe(name);
    setAskName(false);
    try { localStorage.setItem('famies_me', name); } catch { /* ignore */ }
  };

  // ── celebrate micro-animation ──
  const celebrate = useCallback((ev) => {
    try {
      const el = document.createElement('div');
      el.textContent = '✓ nice';
      el.style.cssText = `position:fixed;pointer-events:none;z-index:90;font-size:13px;font-weight:800;color:var(--green);
        left:${(ev?.clientX || window.innerWidth / 2) - 20}px;top:${(ev?.clientY || 120) - 20}px;
        animation:famrise 1s ease forwards;`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1000);
    } catch { /* ignore */ }
  }, []);

  // ── derived filters / counts ──
  const matchFilter = useCallback((n) => filter === 'All' || n === filter, [filter]);

  const openCountFor = useCallback((n) =>
    oneOffs.filter((t) => t.assignee === n && t.status !== 'done').length
    + recurrings.filter((r) => r.assignee === n && !recurAllDone(r)).length,
  [oneOffs, recurrings]);
  const openCountAll = useCallback(() =>
    oneOffs.filter((t) => t.status !== 'done').length
    + recurrings.filter((r) => !recurAllDone(r)).length,
  [oneOffs, recurrings]);

  // ── weekly scoring (ported) ──
  const recurDueDone = useCallback((name) => {
    let due = 0, done = 0; const tk = todayKey();
    recurrings.filter((r) => r.assignee === name).forEach((r) => {
      recurPills(r).forEach((p) => {
        const isDue = p.weekly ? true : (p.key <= tk);
        if (isDue) { due++; if (r.completions && r.completions[p.key]) done++; }
      });
    });
    return { due, done };
  }, [recurrings]);

  const weekScore = useCallback((name) => {
    const wk = CURWEEK();
    const rd = recurDueDone(name);
    const open = oneOffs.filter((t) => t.assignee === name && t.status !== 'done').length;
    const doneWk = oneOffs.filter((t) => t.assignee === name && t.status === 'done' && isoWeek(new Date(t.completedAt || t.createdAt)) === wk).length;
    const total = rd.due + open + doneWk;
    const done = rd.done + doneWk;
    return { total, done, open, pct: total ? Math.round(done / total * 100) : null };
  }, [oneOffs, recurDueDone]);

  // ── mutations ──
  const setStatus = useCallback((id, status, ev) => {
    setOneOffs((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t) return prev;
      const wasDone = t.status === 'done';
      const updated = { ...t, status };
      if (status === 'done') { updated.completedAt = Date.now(); updated.completedBy = me || t.assignee; if (ev) celebrate(ev); }
      else if (wasDone) { updated.completedAt = null; }
      saveTask(updated);
      return prev.map((x) => (x.id === id ? updated : x));
    });
  }, [me, celebrate, saveTask]);

  const sendForReview = useCallback((id, reviewer) => {
    setOneOffs((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t) return prev;
      const updated = { ...t, status: 'question', assignee: reviewer };
      if (reviewer !== t.assignee) updated.reviewFrom = t.assignee;
      saveTask(updated);
      return prev.map((x) => (x.id === id ? updated : x));
    });
  }, [saveTask]);

  const sendBack = useCallback((id) => {
    setOneOffs((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t) return prev;
      const updated = { ...t, status: 'progress' };
      if (t.reviewFrom) { updated.assignee = t.reviewFrom; updated.reviewFrom = null; }
      saveTask(updated);
      return prev.map((x) => (x.id === id ? updated : x));
    });
  }, [saveTask]);

  const reassign = useCallback((id, name) => {
    setOneOffs((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t) return prev;
      const updated = { ...t, assignee: name };
      saveTask(updated);
      return prev.map((x) => (x.id === id ? updated : x));
    });
  }, [saveTask]);

  const deleteTask = useCallback((id) => {
    setOneOffs((prev) => prev.filter((x) => x.id !== id));
    delTaskDb(id);
  }, [delTaskDb]);

  const updateNote = useCallback((id, note, persist) => {
    setOneOffs((prev) => {
      const t = prev.find((x) => x.id === id);
      if (!t) return prev;
      const updated = { ...t, note };
      if (persist) saveTask(updated);
      return prev.map((x) => (x.id === id ? updated : x));
    });
  }, [saveTask]);

  const togglePill = useCallback((rid, pk, ev) => {
    setRecurrings((prev) => {
      const r = prev.find((x) => x.id === rid);
      if (!r) return prev;
      const completions = { ...(r.completions || {}) };
      completions[pk] = !completions[pk];
      if (completions[pk]) celebrate(ev);
      const updated = { ...r, completions };
      saveRecur(updated);
      return prev.map((x) => (x.id === rid ? updated : x));
    });
  }, [celebrate, saveRecur]);

  const removeRecur = useCallback((id) => {
    setRecurrings((prev) => prev.filter((x) => x.id !== id));
    delRecurDb(id);
  }, [delRecurDb]);

  // ── add-task save ──
  const addTask = useCallback((payload) => {
    if (payload.type === 'once') {
      const t = { id: uid('t'), assignee: payload.assignee, title: payload.title, status: 'todo', note: '', due: payload.due || null, createdAt: Date.now(), completedAt: null };
      setOneOffs((p) => [...p, t]);
      saveTask(t);
    } else {
      const sched = payload.sched === 'weekdays' ? { type: 'weekdays', days: payload.days.slice() } : { type: payload.sched, days: [] };
      const r = { id: uid('r'), assignee: payload.assignee, title: payload.title, sched, completions: {}, createdAt: Date.now() };
      setRecurrings((p) => [...p, r]);
      saveRecur(r);
    }
    setAddOpen(false);
  }, [saveTask, saveRecur]);

  // ── drag-and-drop ──
  const onDropCol = (statusKey) => {
    setDragOver(null);
    if (dragging) setStatus(dragging, statusKey);
    setDragging(null);
  };

  // add-modal launcher (calendar passes a prefill date)
  const [prefillDue, setPrefillDue] = useState('');
  const openAdd = (due = '') => { setPrefillDue(due || ''); setAddOpen(true); };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 pt-24 pb-16">
      <style>{`@keyframes famrise{0%{opacity:0;transform:translateY(6px) scale(.9)}15%{opacity:1}100%{opacity:0;transform:translateY(-26px) scale(1)}}`}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl leading-none flex items-center" style={{ color: 'var(--ink)' }}>
            Todo <span className="grad-text">Operator</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-wide mt-2" style={{ color: 'var(--muted)' }}>
            Shared board · synced live · resets every Monday
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MeChip me={me} onPick={pickMe} ask={askName} onDismissAsk={() => setAskName(false)} />
          <div className="chip" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink-2)', padding: '9px 13px', fontSize: 13 }}>
            <span className="dot" style={{ background: 'var(--green)' }} /> Week <b style={{ color: 'var(--ink)' }}>{CURWEEK().replace('-W', ' · w')}</b>
          </div>
          <button className="btn btn-outline" onClick={() => setHistOpen(true)}>
            <History className="w-4 h-4" /> Look back
          </button>
          <button className="btn btn-primary" onClick={() => openAdd()}>
            <Plus className="w-4 h-4" /> New task
          </button>
        </div>
      </div>

      {/* View switch */}
      <div className="mb-4">
        <Segmented
          options={[{ v: 'board', label: 'Board' }, { v: 'overview', label: 'Overview' }]}
          value={view}
          onChange={setView}
        />
      </div>

      {view === 'board' ? (
        <>
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-3">
            <FilterPill active={filter === 'All'} onClick={() => setFilter('All')} count={openCountAll()} all />
            {MEMBERS.map((m) => (
              <FilterPill key={m.name} member={m} active={filter === m.name} onClick={() => setFilter(m.name)} count={openCountFor(m.name)} />
            ))}
          </div>

          {/* Board */}
          <div className="grid gap-4 grid-cols-1 min-[680px]:grid-cols-2 min-[1080px]:grid-cols-4">
            {STATUSES.map((st) => (
              <BoardColumn
                key={st.key}
                status={st}
                dragOver={dragOver === st.key}
                onDragOver={(e) => { e.preventDefault(); setDragOver(st.key); }}
                onDragLeave={() => setDragOver((d) => (d === st.key ? null : d))}
                onDrop={(e) => { e.preventDefault(); onDropCol(st.key); }}
              >
                <ColumnBody
                  status={st}
                  oneOffs={oneOffs}
                  recurrings={recurrings}
                  matchFilter={matchFilter}
                  onDragStart={setDragging}
                  onDragEnd={() => setDragging(null)}
                  onAction={(id, act, ev) => {
                    if (act === 'review') return; // handled inside card via picker
                    if (act === 'sendback') sendBack(id);
                    else setStatus(id, act, ev);
                  }}
                  onReview={sendForReview}
                  onReassign={reassign}
                  onDelete={deleteTask}
                  onNote={updateNote}
                  onTogglePill={togglePill}
                  onRemoveRecur={removeRecur}
                  onSetStatus={setStatus}
                />
              </BoardColumn>
            ))}
          </div>
        </>
      ) : (
        <Overview
          oneOffs={oneOffs}
          recurrings={recurrings}
          weekScore={weekScore}
          ovTab={ovTab}
          setOvTab={setOvTab}
          calRef={calRef}
          setCalRef={setCalRef}
          onAddOnDay={openAdd}
          onReassign={reassign}
          onDelete={deleteTask}
          onSetStatus={setStatus}
        />
      )}

      <p className="text-xs text-center mt-8" style={{ color: 'var(--muted)' }}>
        Shared board — everyone sees the same view, synced live. Drag cards between columns on desktop, or use the buttons on any device. Todo-Score resets every Monday.
      </p>

      {/* Add modal */}
      <AnimatePresence>
        {addOpen && (
          <AddTaskModal
            defaultAssignee={MEMBERS.some((m) => m.name === filter) ? filter : MEMBERS[0].name}
            prefillDue={prefillDue}
            onClose={() => setAddOpen(false)}
            onSave={addTask}
          />
        )}
      </AnimatePresence>

      {/* History modal */}
      <AnimatePresence>
        {histOpen && (
          <HistoryModal oneOffs={oneOffs} recurrings={recurrings} onClose={() => setHistOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── segmented control (view switch / sub-switch) ────────────────────────────
function Segmented({ options, value, onChange, center }) {
  return (
    <div className={center ? 'flex justify-center' : 'inline-flex'}>
      <div className="inline-flex p-1 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}>
        {options.map((o) => {
          const on = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange(o.v)}
              className="px-4 py-2 rounded-full text-[13.5px] font-bold transition-all"
              style={on ? { background: 'var(--ink)', color: '#fff' } : { background: 'transparent', color: 'var(--ink-2)' }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── filter pill ─────────────────────────────────────────────────────────────
function FilterPill({ member, active, onClick, count, all }) {
  return (
    <button
      onClick={onClick}
      className="flex-none flex items-center gap-2 rounded-full text-[13px] font-semibold transition-all whitespace-nowrap"
      style={{
        padding: '8px 14px 8px 9px',
        border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'),
        background: active ? 'var(--ink)' : 'var(--bg)',
        color: active ? '#fff' : 'var(--ink-2)',
      }}
    >
      {all ? (
        <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--grad)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>F</span>
      ) : (
        <Avatar name={member.name} size={20} font={10} />
      )}
      {all ? 'All' : member.name}
      <span
        className="inline-flex items-center justify-center font-bold"
        style={{
          minWidth: 19, height: 19, padding: '0 5px', borderRadius: 999, fontSize: 11,
          background: active ? 'rgba(255,255,255,.22)' : 'var(--bg-tint)',
          color: active ? '#fff' : 'var(--ink-2)',
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ── board column wrapper ────────────────────────────────────────────────────
function BoardColumn({ status, children, dragOver, onDragOver, onDragLeave, onDrop }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="rounded-2xl p-3"
      style={{
        background: dragOver ? 'var(--pinkbg)' : 'var(--bg-tint)',
        border: '1px solid var(--line)',
        minHeight: 160,
        boxShadow: dragOver ? 'inset 0 0 0 2px var(--pink)' : 'none',
        transition: 'background .15s ease, box-shadow .15s ease',
      }}
    >
      {children}
    </div>
  );
}

// ── column header + body (decides what cards to render) ─────────────────────
function ColumnBody({
  status, oneOffs, recurrings, matchFilter,
  onDragStart, onDragEnd, onAction, onReview, onReassign, onDelete, onNote,
  onTogglePill, onRemoveRecur, onSetStatus,
}) {
  const items = [];
  if (status.key === 'todo') {
    recurrings
      .filter((r) => matchFilter(r.assignee))
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((r) => items.push(
        <RecurCard
          key={r.id} r={r}
          onTogglePill={onTogglePill}
          onRemove={onRemoveRecur}
        />,
      ));
  }
  let oo = oneOffs.filter((t) => t.status === status.key && matchFilter(t.assignee));
  if (status.key === 'done') oo = oo.filter((t) => isoWeek(new Date(t.completedAt || t.createdAt)) === CURWEEK());
  oo.sort((a, b) => {
    if (status.key === 'done') return (b.completedAt || 0) - (a.completedAt || 0);
    const ao = isOverdue(a) ? 0 : 1, bo = isOverdue(b) ? 0 : 1; if (ao !== bo) return ao - bo;
    const ad = a.due || '9999', bd = b.due || '9999'; if (ad !== bd) return ad < bd ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
  oo.forEach((t) => items.push(
    <TaskCard
      key={t.id} t={t}
      onDragStart={onDragStart} onDragEnd={onDragEnd}
      onAction={onAction} onReview={onReview}
      onReassign={onReassign} onDelete={onDelete} onNote={onNote} onSetStatus={onSetStatus}
    />,
  ));

  const emptyText = status.key === 'done'
    ? 'Nothing closed yet this week.'
    : status.key === 'question' ? 'Nothing waiting to be answered or reviewed.' : 'Nothing here.';

  return (
    <>
      <div className="flex items-center justify-between px-1.5 pb-3 pt-1">
        <div className="flex items-center gap-2 text-[13px] font-extrabold" style={{ color: 'var(--ink)' }}>
          <span className="dot" style={{ width: 9, height: 9, background: status.swatch }} /> {status.label}
        </div>
        <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{items.length}</div>
      </div>
      {items.length === 0 ? (
        <div className="text-center font-medium" style={{ fontSize: 12.5, color: 'var(--muted)', padding: '22px 8px', border: '1px dashed var(--line)', borderRadius: 'var(--r-sm)' }}>
          {emptyText}
        </div>
      ) : items}
    </>
  );
}

// ── popover (context menu / review picker / reassign) ───────────────────────
function Popover({ anchorRect, onClose, children, width = 200 }) {
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [onClose]);
  if (!anchorRect) return null;
  let x = anchorRect.x, y = anchorRect.y;
  const h = 220;
  if (x + width > window.innerWidth - 10) x = window.innerWidth - width - 10;
  if (y + h > window.innerHeight - 10) y = Math.max(10, window.innerHeight - h - 10);
  return (
    <div
      ref={ref}
      className="pop-in"
      style={{
        position: 'fixed', left: x, top: y, width, zIndex: 80,
        background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
        boxShadow: 'var(--shadow-lg)', padding: 6,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
const PopBtn = ({ children, onClick, danger }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-2 text-left rounded-lg text-[13px] font-semibold"
    style={{ padding: '9px 10px', color: danger ? 'var(--red)' : 'var(--ink)', background: 'transparent' }}
    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tint)')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
  >
    {children}
  </button>
);
const PopLabel = ({ children }) => (
  <div className="font-extrabold uppercase" style={{ fontSize: 10, color: 'var(--muted)', padding: '7px 10px 4px', letterSpacing: '.04em' }}>{children}</div>
);

// ── task card (one-off) ─────────────────────────────────────────────────────
function TaskCard({ t, onDragStart, onDragEnd, onAction, onReview, onReassign, onDelete, onNote, onSetStatus }) {
  const [menu, setMenu] = useState(null);    // context menu anchor
  const [review, setReview] = useState(null); // review picker anchor
  const [noteVal, setNoteVal] = useState(t.note || '');
  useEffect(() => { setNoteVal(t.note || ''); }, [t.note]);

  const od = isOverdue(t);
  const newTag = isNew(t.createdAt) && t.status !== 'done';

  let dueEl = null;
  if (t.due && t.status !== 'done') {
    if (t.due < todayKey()) dueEl = <DueBadge variant="overdue">Overdue · {fmtDue(t.due)}</DueBadge>;
    else if (t.due === todayKey()) dueEl = <DueBadge variant="today">Due today</DueBadge>;
    else dueEl = <DueBadge>Due {fmtDue(t.due)}</DueBadge>;
  }

  // actions per status
  const actions = [];
  const reviewBtn = <ActBtn key="rev" onClick={(e) => setReview({ x: e.clientX, y: e.clientY })}>Ask / Review</ActBtn>;
  if (t.status === 'todo') {
    actions.push(<ActBtn key="start" variant="primary" onClick={(e) => onAction(t.id, 'progress', e)}>Start</ActBtn>);
    actions.push(<ActBtn key="done" variant="good" onClick={(e) => onAction(t.id, 'done', e)}>Done</ActBtn>);
    actions.push(reviewBtn);
  } else if (t.status === 'progress') {
    actions.push(<ActBtn key="done" variant="good" onClick={(e) => onAction(t.id, 'done', e)}>Done</ActBtn>);
    actions.push(reviewBtn);
  } else if (t.status === 'question') {
    if (t.reviewFrom) {
      actions.push(<ActBtn key="approve" variant="good" onClick={(e) => onAction(t.id, 'done', e)}>Approve · close</ActBtn>);
      actions.push(<ActBtn key="back" onClick={() => onAction(t.id, 'sendback')}>Send back to {t.reviewFrom}</ActBtn>);
    } else {
      actions.push(<ActBtn key="resume" variant="primary" onClick={(e) => onAction(t.id, 'progress', e)}>Resume</ActBtn>);
      actions.push(<ActBtn key="done" variant="good" onClick={(e) => onAction(t.id, 'done', e)}>Done</ActBtn>);
    }
  } else if (t.status === 'done') {
    actions.push(<ActBtn key="reopen" onClick={() => onAction(t.id, 'todo')}>Reopen</ActBtn>);
  }

  const ageText = t.status === 'done'
    ? ('closed ' + ago(t.completedAt || t.createdAt) + (t.completedBy ? ' by ' + t.completedBy : ''))
    : ago(t.createdAt);

  return (
    <div
      draggable
      onDragStart={(e) => { onDragStart(t.id); e.dataTransfer.effectAllowed = 'move'; }}
      onDragEnd={onDragEnd}
      className="card"
      style={{
        padding: '13px 13px 11px', marginBottom: 10, cursor: 'grab', position: 'relative',
        borderColor: od ? 'rgba(225,29,72,.35)' : 'var(--line)',
        boxShadow: od ? 'inset 3px 0 0 var(--red), var(--shadow-xs)' : 'var(--shadow-xs)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.32, letterSpacing: '-.01em', wordBreak: 'break-word', color: 'var(--ink)' }}>{t.title}</div>
        <button onClick={(e) => { e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY }); }} style={{ color: 'var(--muted)', padding: 3, borderRadius: 7, lineHeight: 0, flex: '0 0 auto' }}><DotsIcon /></button>
      </div>

      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <span className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}><Avatar name={t.assignee} /> {t.assignee}</span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)' }}>{ageText}</span>
        {t.status === 'question' && t.reviewFrom && (
          <span style={{ fontSize: 11.5, color: 'var(--amber)', fontWeight: 700 }}>↩ from {t.reviewFrom}</span>
        )}
        {dueEl}
        {newTag && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: 'var(--pink)', borderRadius: 999, padding: '2px 7px', letterSpacing: '.03em', textTransform: 'uppercase' }}>New</span>}
      </div>

      {actions.length > 0 && <div className="flex gap-1.5 mt-2.5 flex-wrap">{actions}</div>}

      {/* note / feedback */}
      {t.status === 'question' ? (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 9 }}>
          <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--amber)' }}>Question / review feedback</label>
          <textarea
            value={noteVal}
            onChange={(e) => setNoteVal(e.target.value)}
            onBlur={() => onNote(t.id, noteVal, true)}
            placeholder="Ask your question, or leave feedback for the owner…"
            className="field-textarea"
            style={{ marginTop: 6, minHeight: 38, fontSize: 12.5, padding: '8px 9px' }}
          />
        </div>
      ) : t.note ? (
        <div style={{ marginTop: 10, borderTop: '1px solid var(--line)', paddingTop: 9 }}>
          <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--muted)' }}>Note</label>
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 5, whiteSpace: 'pre-wrap' }}>{t.note}</div>
        </div>
      ) : null}

      {/* review picker */}
      {review && (
        <Popover anchorRect={review} onClose={() => setReview(null)} width={210}>
          <ReviewPicker t={t} onSend={(name) => { onReview(t.id, name); setReview(null); }} />
        </Popover>
      )}

      {/* context menu */}
      {menu && (
        <Popover anchorRect={menu} onClose={() => setMenu(null)} width={190}>
          <PopBtn onClick={() => { onSetStatus(t.id, t.status === 'done' ? 'todo' : 'done'); setMenu(null); }}>
            <Check className="w-4 h-4" /> {t.status === 'done' ? 'Reopen task' : 'Mark done'}
          </PopBtn>
          <PopLabel>Reassign</PopLabel>
          <select
            defaultValue={t.assignee}
            onChange={(e) => { onReassign(t.id, e.target.value); setMenu(null); }}
            style={{ width: 'calc(100% - 12px)', margin: '0 6px 6px', border: '1px solid var(--line)', borderRadius: 8, padding: 8, fontSize: 13 }}
          >
            {MEMBERS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
          <PopBtn danger onClick={() => { onDelete(t.id); setMenu(null); }}>
            <Trash2 className="w-4 h-4" /> Delete task
          </PopBtn>
        </Popover>
      )}
    </div>
  );
}

function ReviewPicker({ t, onSend }) {
  const def = t.assignee === 'Albin' ? 'Injamul' : 'Albin';
  const [val, setVal] = useState(def);
  return (
    <>
      <PopLabel>Send for answer / review to</PopLabel>
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{ width: 'calc(100% - 12px)', margin: '0 6px 6px', border: '1px solid var(--line)', borderRadius: 8, padding: 8, fontSize: 13 }}
      >
        {MEMBERS.map((m) => <option key={m.name} value={m.name}>{m.name}{m.name === t.assignee ? ' (myself)' : ''}</option>)}
      </select>
      <PopBtn onClick={() => onSend(val)}><Send className="w-4 h-4" /> Send it over</PopBtn>
    </>
  );
}

function DueBadge({ children, variant }) {
  const base = { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 };
  if (variant === 'overdue') return <span style={{ ...base, color: '#fff', background: 'var(--red)' }}>{children}</span>;
  if (variant === 'today') return <span style={{ ...base, color: 'var(--amber)', background: 'var(--amber-bg)' }}>{children}</span>;
  return <span style={{ ...base, color: 'var(--muted)', background: 'var(--bg-tint)', border: '1px solid var(--line)' }}>{children}</span>;
}

function ActBtn({ children, onClick, variant }) {
  const base = { fontSize: 11.5, fontWeight: 700, borderRadius: 8, padding: '6px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, border: '1px solid var(--line)' };
  let style = { ...base, background: 'var(--bg-tint)', color: 'var(--ink-2)' };
  if (variant === 'primary') style = { ...base, background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' };
  if (variant === 'good') style = { ...base, background: 'var(--greenbg)', color: 'var(--green)', borderColor: 'transparent' };
  return <button onClick={(e) => { e.stopPropagation(); onClick(e); }} style={style}>{children}</button>;
}

// ── recurring card ──────────────────────────────────────────────────────────
function RecurCard({ r, onTogglePill, onRemove }) {
  const [menu, setMenu] = useState(null);
  const allDone = recurAllDone(r);
  const schedLabel = r.sched.type === 'daily' ? 'Daily' : r.sched.type === 'weekly' ? 'Weekly' : r.sched.days.join(' · ');
  const pills = recurPills(r);

  return (
    <div
      className="card"
      style={{
        padding: '13px 13px 11px', marginBottom: 10, position: 'relative',
        borderColor: allDone ? 'rgba(18,189,138,.35)' : 'rgba(255,61,127,.18)',
        background: allDone ? 'linear-gradient(180deg,#fff,#f5fcf8)' : 'linear-gradient(180deg,#fff,#fffafc)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.32, color: 'var(--ink)', wordBreak: 'break-word' }}>{r.title}</div>
        <button onClick={(e) => { e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY }); }} style={{ color: 'var(--muted)', padding: 3, borderRadius: 7, lineHeight: 0, flex: '0 0 auto' }}><DotsIcon /></button>
      </div>
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <span className="flex items-center gap-1.5" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)' }}><Avatar name={r.assignee} /> {r.assignee}</span>
        <span className="inline-flex items-center gap-1" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em', color: allDone ? 'var(--green)' : 'var(--pink)' }}>
          <Repeat className="w-3 h-3" /> {schedLabel}
        </span>
      </div>
      <div className="flex gap-1.5 flex-wrap mt-2.5">
        {pills.map((p) => {
          const on = r.completions && r.completions[p.key];
          const overdue = !on && p.past;
          return (
            <button
              key={p.key}
              onClick={(e) => { e.stopPropagation(); onTogglePill(r.id, p.key, e); }}
              style={{
                fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '6px 8px', minWidth: 34, textAlign: 'center', cursor: 'pointer', userSelect: 'none',
                border: '1px solid ' + (on ? 'var(--green)' : 'var(--line)'),
                background: on ? 'var(--green)' : 'var(--bg-tint)',
                color: on ? '#fff' : 'var(--ink-2)',
                boxShadow: p.today ? '0 0 0 2px var(--pinkbg)' : overdue ? '0 0 0 2px var(--red-bg)' : 'none',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {menu && (
        <Popover anchorRect={menu} onClose={() => setMenu(null)} width={190}>
          <PopLabel>Fixed task</PopLabel>
          <PopBtn danger onClick={() => { onRemove(r.id); setMenu(null); }}>
            <Trash2 className="w-4 h-4" /> Remove recurring
          </PopBtn>
        </Popover>
      )}
    </div>
  );
}

// ── "me" chip + picker ──────────────────────────────────────────────────────
function MeChip({ me, onPick, ask, onDismissAsk }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if ((open || ask) && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setRect({ x: r.left, y: r.bottom + 6 });
    }
  }, [open, ask]);

  const showPop = open || ask;
  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="chip"
        style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink-2)', padding: '9px 13px', fontSize: 13, cursor: 'pointer' }}
      >
        {me ? (<><span className="dot" style={{ background: 'var(--green)' }} /> You · <b style={{ color: 'var(--ink)' }}>{me}</b></>) : 'Pick your name'}
      </button>
      {showPop && rect && (
        <Popover anchorRect={rect} onClose={() => { setOpen(false); onDismissAsk(); }} width={200}>
          <PopLabel>Who are you?</PopLabel>
          {MEMBERS.map((m) => (
            <PopBtn key={m.name} onClick={() => { onPick(m.name); setOpen(false); }}>
              <Avatar name={m.name} /> {m.name}
            </PopBtn>
          ))}
        </Popover>
      )}
    </>
  );
}

// ── add-task modal ──────────────────────────────────────────────────────────
function AddTaskModal({ defaultAssignee, prefillDue, onClose, onSave }) {
  const [assignee, setAssignee] = useState(defaultAssignee);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('once');
  const [due, setDue] = useState(prefillDue || '');
  const [sched, setSched] = useState('daily');
  const [days, setDays] = useState(['Tue', 'Wed']);
  const inputRef = useRef(null);

  useEffect(() => { const id = setTimeout(() => inputRef.current?.focus(), 60); return () => clearTimeout(id); }, []);

  const save = () => {
    const tt = title.trim();
    if (!tt) { inputRef.current?.focus(); return; }
    onSave({ assignee, title: tt, type, due, sched, days });
  };
  const toggleDay = (d) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(20,20,28,.34)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className="card w-full max-w-[440px]" style={{ padding: 26, boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 2 }}>New task</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>Assign it to someone. They&apos;ll see it next time they open the board.</p>

        <div className="mb-3.5">
          <label className="field-label">Assign to</label>
          <select className="field-select" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {MEMBERS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
        </div>

        <div className="mb-3.5">
          <label className="field-label">Task</label>
          <input
            ref={inputRef} className="field-input" value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            placeholder="e.g. Quality check images in event calendar" autoComplete="off"
          />
        </div>

        <div className="mb-3.5">
          <label className="field-label">Type</label>
          <SegRow options={[{ v: 'once', label: 'One-off' }, { v: 'recurring', label: 'Recurring (fixed)' }]} value={type} onChange={setType} />
        </div>

        {type === 'once' ? (
          <div className="mb-3.5">
            <label className="field-label">Deadline (optional)</label>
            <input type="date" className="field-input" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        ) : (
          <div className="mb-3.5">
            <label className="field-label">Repeats</label>
            <SegRow options={[{ v: 'daily', label: 'Daily' }, { v: 'weekdays', label: 'Specific days' }, { v: 'weekly', label: 'Weekly' }]} value={sched} onChange={setSched} />
            {sched === 'weekdays' && (
              <div className="flex gap-1.5 flex-wrap" style={{ marginTop: 10 }}>
                {WEEKDAYS.map((d) => {
                  const on = days.includes(d);
                  return (
                    <button
                      key={d} onClick={() => toggleDay(d)}
                      className="flex-1" style={{
                        minWidth: 38, padding: '9px 0', borderRadius: 9, fontSize: 12, fontWeight: 700,
                        border: '1px solid ' + (on ? 'var(--pink)' : 'var(--line)'),
                        background: on ? 'var(--pink)' : 'var(--bg-tint)', color: on ? '#fff' : 'var(--ink-2)',
                      }}
                    >{d}</button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2.5 mt-5">
          <button className="btn btn-outline flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1.4 }} onClick={save}>Add task</button>
        </div>
      </motion.div>
    </div>
  );
}

// segmented row used inside the modal
function SegRow({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: 'var(--bg-tint)', border: '1px solid var(--line)' }}>
      {options.map((o) => {
        const on = value === o.v;
        return (
          <button
            key={o.v} onClick={() => onChange(o.v)}
            className="flex-1 rounded-lg text-[13px] font-bold transition-all"
            style={{ padding: 9, background: on ? 'var(--ink)' : 'transparent', color: on ? '#fff' : 'var(--ink-2)' }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

// ── history modal ───────────────────────────────────────────────────────────
function HistoryModal({ oneOffs, recurrings, onClose }) {
  const weeks = useMemo(() => {
    const done = oneOffs.filter((t) => t.status === 'done');
    const byWeek = {};
    done.forEach((t) => { const w = isoWeek(new Date(t.completedAt || t.createdAt)); (byWeek[w] = byWeek[w] || []).push(t); });
    const recWeek = {};
    recurrings.forEach((r) => {
      Object.keys(r.completions || {}).forEach((k) => {
        if (!r.completions[k]) return;
        const w = k.includes('W') ? k : isoWeek(new Date(k));
        recWeek[w] = recWeek[w] || {};
        recWeek[w][r.assignee] = (recWeek[w][r.assignee] || 0) + 1;
      });
    });
    const keys = [...new Set([...Object.keys(byWeek), ...Object.keys(recWeek)])].sort().reverse();
    return keys.map((w) => {
      const tally = {};
      (byWeek[w] || []).forEach((t) => { tally[t.assignee] = (tally[t.assignee] || 0) + 1; });
      Object.entries(recWeek[w] || {}).forEach(([n, c]) => { tally[n] = (tally[n] || 0) + c; });
      const total = Object.values(tally).reduce((a, b) => a + b, 0);
      const rows = Object.entries(tally).sort((a, b) => b[1] - a[1]);
      return { w, total, rows };
    });
  }, [oneOffs, recurrings]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(20,20,28,.34)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
        className="card w-full max-w-[540px]" style={{ padding: 26, maxHeight: '82vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }} onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display" style={{ fontSize: 20, color: 'var(--ink)' }}>Look back</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 18px' }}>Everything the team has closed, week by week. Proof of the work.</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X className="w-5 h-5" /></button>
        </div>

        {weeks.length === 0 ? (
          <div className="text-center font-medium" style={{ fontSize: 12.5, color: 'var(--muted)', padding: '22px 8px', border: '1px dashed var(--line)', borderRadius: 'var(--r-sm)' }}>
            No completed work logged yet. It&apos;ll fill up fast.
          </div>
        ) : weeks.map(({ w, total, rows }) => (
          <div key={w} style={{ marginBottom: 22 }}>
            <h3 className="font-display" style={{ fontSize: 14, color: 'var(--ink)', margin: '0 0 4px' }}>{w}{w === CURWEEK() ? ' · this week' : ''}</h3>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 12 }}>{total} tasks completed</div>
            {rows.map(([n, c]) => (
              <div key={n} className="flex items-center gap-2.5" style={{ padding: '9px 0', borderTop: '1px solid var(--line)' }}>
                <Avatar name={n} size={24} font={11} />
                <span className="flex-1" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{n}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--green)' }}>{c} <span style={{ color: 'var(--muted)', fontWeight: 600 }}>closed</span></span>
              </div>
            ))}
          </div>
        ))}

        <button className="btn btn-outline w-full mt-2" onClick={onClose}>Close</button>
      </motion.div>
    </div>
  );
}

// ── overview (stats + calendar / leaderboard / analytics) ───────────────────
function Overview({ oneOffs, recurrings, weekScore, ovTab, setOvTab, calRef, setCalRef, onAddOnDay, onReassign, onDelete, onSetStatus }) {
  let completed = 0, open = 0;
  MEMBERS.forEach((m) => { const s = weekScore(m.name); completed += s.done; open += s.open; });
  const overdue = oneOffs.filter(isOverdue).length;

  return (
    <div>
      <div className="grid gap-3.5 mb-5 grid-cols-1 min-[680px]:grid-cols-3">
        <StatCard n={completed} label="Completed this week" color="var(--green)" />
        <StatCard n={open} label="Still open" />
        <StatCard n={overdue} label="Overdue" color="var(--red)" />
      </div>

      <div className="mb-5">
        <Segmented
          center
          options={[{ v: 'calendar', label: 'Calendar' }, { v: 'leaderboard', label: 'Todo-Score' }, { v: 'analytics', label: 'Analytics' }]}
          value={ovTab}
          onChange={setOvTab}
        />
      </div>

      {ovTab === 'calendar' && (
        <CalendarView oneOffs={oneOffs} calRef={calRef} setCalRef={setCalRef} onAddOnDay={onAddOnDay} onReassign={onReassign} onDelete={onDelete} onSetStatus={onSetStatus} />
      )}
      {ovTab === 'leaderboard' && <Leaderboard weekScore={weekScore} />}
      {ovTab === 'analytics' && <Analytics oneOffs={oneOffs} recurrings={recurrings} weekScore={weekScore} />}
    </div>
  );
}

function StatCard({ n, label, color }) {
  return (
    <div className="card p-5">
      <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1, color: color || 'var(--ink)' }}>{n}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '.03em' }}>{label}</div>
    </div>
  );
}

// ── leaderboard ─────────────────────────────────────────────────────────────
function Leaderboard({ weekScore }) {
  const rows = MEMBERS.map((m) => ({ m, s: weekScore(m.name) }))
    .sort((a, b) => {
      const pa = a.s.pct, pb = b.s.pct;
      if (pa === null && pb === null) return 0;
      if (pa === null) return 1;
      if (pb === null) return -1;
      if (pb !== pa) return pb - pa;
      return b.s.done - a.s.done;
    });
  let rank = 0, lastPct = null, shown = 0;
  return (
    <div className="card" style={{ padding: '8px 8px 12px' }}>
      <div className="flex items-baseline justify-between flex-wrap gap-1.5" style={{ padding: '16px 16px 6px' }}>
        <h2 className="font-display" style={{ fontSize: 18, color: 'var(--ink)' }}>Todo-Score</h2>
        <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>{CURWEEK().replace('-W', ' · week ')} · share of tasks closed</span>
      </div>
      {rows.map((x) => {
        shown++;
        if (x.s.pct !== lastPct) { rank = shown; lastPct = x.s.pct; }
        const r = x.s.pct === null ? 99 : rank;
        const rankBg = x.s.pct === null ? null : r === 1 ? '#E7B43A' : r === 2 ? '#AEB2BC' : r === 3 ? '#C68A57' : null;
        const pctColor = x.s.pct === null ? 'var(--muted)' : x.s.pct >= 90 ? 'var(--green)' : x.s.pct >= 70 ? 'var(--ink)' : 'var(--red)';
        const barW = x.s.pct === null ? 0 : x.s.pct;
        const rankLabel = x.s.pct === null ? '–' : r;
        const leader = r === 1 && x.s.pct !== null;
        return (
          <div key={x.m.name} className="flex items-center gap-3.5" style={{ padding: '13px 14px', borderRadius: 14 }}>
            <div className="flex items-center justify-center flex-none" style={{
              width: 26, height: 26, borderRadius: '50%', fontSize: 12, fontWeight: 800,
              background: rankBg || 'var(--bg-tint)', color: rankBg ? '#fff' : 'var(--ink-2)',
              border: rankBg ? 'none' : '1px solid var(--line)',
            }}>{rankLabel}</div>
            <Avatar name={x.m.name} size={34} font={14} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2" style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>
                {x.m.name}
                {leader && <span className="inline-flex items-center gap-1" style={{ fontSize: 10, fontWeight: 800, color: '#E7B43A', textTransform: 'uppercase', letterSpacing: '.04em' }}><Crown className="w-3 h-3" /> Leader</span>}
              </div>
              <div style={{ height: 7, borderRadius: 99, background: 'var(--line)', marginTop: 8, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, width: barW + '%', background: x.m.color, transition: 'width .5s cubic-bezier(.2,.8,.2,1)' }} />
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, marginTop: 6 }}>
                {x.s.pct === null ? 'No tasks this week' : x.s.done + ' of ' + x.s.total + ' done'}
              </div>
            </div>
            <div style={{ fontSize: x.s.pct === null ? 15 : 22, fontWeight: 800, letterSpacing: '-.02em', width: 64, textAlign: 'right', color: pctColor }}>
              {x.s.pct === null ? '—' : x.s.pct + '%'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── calendar ────────────────────────────────────────────────────────────────
function CalendarView({ oneOffs, calRef, setCalRef, onAddOnDay, onReassign, onDelete, onSetStatus }) {
  const [chipMenu, setChipMenu] = useState(null); // { task, x, y }
  const y = calRef.getFullYear(), mo = calRef.getMonth();
  const monName = calRef.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const startDay = (new Date(y, mo, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const weeks = Math.ceil((startDay + daysInMonth) / 7);
  const start = new Date(y, mo, 1 - startDay);
  const tk = todayKey();

  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const key = dkey(d);
    const inMonth = d.getMonth() === mo;
    const isToday = key === tk;
    const due = oneOffs.filter((t) => t.due === key).sort((a, b) => (a.status === 'done') - (b.status === 'done'));
    cells.push({ d, key, inMonth, isToday, due });
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="flex items-center justify-between" style={{ padding: '16px 18px 12px' }}>
        <div className="font-display" style={{ fontSize: 18, color: 'var(--ink)' }}>{monName}</div>
        <div className="flex items-center gap-1.5">
          <CalNavBtn onClick={() => setCalRef(new Date(y, mo - 1, 1))}><ChevronLeft className="w-4 h-4" /></CalNavBtn>
          <CalNavBtn wide onClick={() => { const n = new Date(); n.setDate(1); setCalRef(n); }}>Today</CalNavBtn>
          <CalNavBtn onClick={() => setCalRef(new Date(y, mo + 1, 1))}><ChevronRight className="w-4 h-4" /></CalNavBtn>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(7,1fr)', padding: '0 8px' }}>
        {WEEKDAYS.map((d) => <div key={d} style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', padding: '4px 8px 8px' }}>{d}</div>)}
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(7,1fr)', padding: 8 }}>
        {cells.map((c) => (
          <div
            key={c.key}
            onClick={() => onAddOnDay(c.key)}
            className="group relative"
            style={{
              minHeight: 106, border: '1px solid var(--line)', borderRadius: 12, padding: '7px 7px 6px', cursor: 'pointer',
              background: c.isToday ? '#fff' : 'var(--bg-tint)',
              opacity: c.inMonth ? 1 : 0.4,
              boxShadow: c.isToday ? 'inset 0 0 0 1.5px rgba(255,61,127,.35)' : 'none',
            }}
          >
            <span className="inline-flex items-center justify-center" style={{
              fontSize: 12.5, fontWeight: 700, minWidth: 22, height: 22, borderRadius: '50%',
              color: c.isToday ? '#fff' : 'var(--ink-2)', background: c.isToday ? 'var(--pink)' : 'transparent',
            }}>{c.d.getDate()}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onAddOnDay(c.key); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ position: 'absolute', top: 7, right: 7, background: 'var(--ink)', color: '#fff', width: 20, height: 20, borderRadius: 6, fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >+</button>
            {c.due.slice(0, 3).map((t) => {
              const od = isOverdue(t);
              return (
                <div
                  key={t.id}
                  onClick={(e) => { e.stopPropagation(); setChipMenu({ task: t, x: e.clientX, y: e.clientY }); }}
                  className="flex items-center gap-1.5"
                  style={{
                    marginTop: 5, fontSize: 11, fontWeight: 600, borderRadius: 7, padding: '3px 6px', cursor: 'pointer', overflow: 'hidden',
                    background: od ? 'var(--red-bg)' : '#fff', border: '1px solid ' + (od ? 'transparent' : 'var(--line)'),
                    opacity: t.status === 'done' ? 0.6 : 1,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', flex: '0 0 auto', background: COLOR[t.assignee] || '#888' }} />
                  <span style={{
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: od ? 'var(--red)' : t.status === 'done' ? 'var(--muted)' : 'var(--ink)',
                    textDecoration: t.status === 'done' ? 'line-through' : 'none',
                  }}>{t.title}</span>
                </div>
              );
            })}
            {c.due.length > 3 && <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--muted)', marginTop: 4, paddingLeft: 3 }}>+{c.due.length - 3} more</div>}
          </div>
        ))}
      </div>

      {chipMenu && (
        <Popover anchorRect={{ x: chipMenu.x, y: chipMenu.y }} onClose={() => setChipMenu(null)} width={190}>
          <PopBtn onClick={() => { onSetStatus(chipMenu.task.id, chipMenu.task.status === 'done' ? 'todo' : 'done'); setChipMenu(null); }}>
            <Check className="w-4 h-4" /> {chipMenu.task.status === 'done' ? 'Reopen task' : 'Mark done'}
          </PopBtn>
          <PopLabel>Reassign</PopLabel>
          <select
            defaultValue={chipMenu.task.assignee}
            onChange={(e) => { onReassign(chipMenu.task.id, e.target.value); setChipMenu(null); }}
            style={{ width: 'calc(100% - 12px)', margin: '0 6px 6px', border: '1px solid var(--line)', borderRadius: 8, padding: 8, fontSize: 13 }}
          >
            {MEMBERS.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
          <PopBtn danger onClick={() => { onDelete(chipMenu.task.id); setChipMenu(null); }}>
            <Trash2 className="w-4 h-4" /> Delete task
          </PopBtn>
        </Popover>
      )}
    </div>
  );
}
function CalNavBtn({ children, onClick, wide }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center"
      style={{ border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 9, height: 34, minWidth: 34, padding: wide ? '0 14px' : 0, color: 'var(--ink-2)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
    >{children}</button>
  );
}

// ── analytics (NEW tab — our analytics) ─────────────────────────────────────
function Analytics({ oneOffs, recurrings, weekScore }) {
  // overall % done this week (aggregate of member weekScores)
  let totalDue = 0, totalDone = 0;
  MEMBERS.forEach((m) => { const s = weekScore(m.name); if (s.total) { totalDue += s.total; totalDone += s.done; } });
  const overallPct = totalDue ? Math.round((totalDone / totalDue) * 100) : 0;

  // status split (To Do / In Progress / Review / Done this week)
  const wk = CURWEEK();
  const todo = oneOffs.filter((t) => t.status === 'todo').length + recurrings.filter((r) => !recurAllDone(r)).length;
  const progress = oneOffs.filter((t) => t.status === 'progress').length;
  const question = oneOffs.filter((t) => t.status === 'question').length;
  const doneWk = oneOffs.filter((t) => t.status === 'done' && isoWeek(new Date(t.completedAt || t.createdAt)) === wk).length;
  const statusData = [
    { name: 'To Do', value: todo, color: '#ff3d7f' },
    { name: 'In Progress', value: progress, color: '#2563eb' },
    { name: 'Review', value: question, color: '#d97706' },
    { name: 'Done', value: doneWk, color: '#12bd8a' },
  ];
  const hasStatus = statusData.some((s) => s.value > 0);

  // per-member completed count this week (recurring completions in week + done one-offs)
  const perMember = MEMBERS.map((m) => {
    const s = weekScore(m.name);
    return { name: m.name, color: m.color, done: s.done };
  }).filter((x) => x.done > 0).sort((a, b) => b.done - a.done);
  const maxDone = Math.max(1, ...perMember.map((x) => x.done));

  const R = 56, C = 2 * Math.PI * R;

  return (
    <div className="grid gap-5 grid-cols-1 min-[900px]:grid-cols-3">

      {/* overall progress ring */}
      <div className="card p-5 flex flex-col items-center justify-center">
        <h3 className="text-xs uppercase font-bold mb-3" style={{ color: 'var(--muted)' }}>Overall this week</h3>
        <div className="relative" style={{ width: 150, height: 150 }}>
          <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="75" cy="75" r={R} strokeWidth="13" fill="transparent" stroke="var(--line-2)" />
            <circle cx="75" cy="75" r={R} strokeWidth="13" fill="transparent" stroke="var(--green)" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C - (C * overallPct) / 100} style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-.03em' }}>{overallPct}%</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{totalDone} / {totalDue} done</span>
          </div>
        </div>
      </div>

      {/* status donut */}
      <div className="card p-5">
        <h3 className="text-xs uppercase font-bold mb-2 text-center" style={{ color: 'var(--muted)' }}>Status split</h3>
        <div style={{ height: 170 }}>
          {hasStatus ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData.filter((s) => s.value > 0)} innerRadius={42} outerRadius={66} paddingAngle={4} dataKey="value" nameKey="name">
                  {statusData.filter((s) => s.value > 0).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: 'var(--line-2)', borderRadius: 8, color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' }} itemStyle={{ color: 'var(--ink)', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full" style={{ fontSize: 12.5, color: 'var(--muted)' }}>No tasks yet.</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2.5 justify-center mt-1">
          {statusData.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)' }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }} /> {s.name} <b style={{ color: 'var(--ink)' }}>{s.value}</b>
            </span>
          ))}
        </div>
      </div>

      {/* per-member completed bars */}
      <div className="card p-5">
        <h3 className="text-xs uppercase font-bold mb-3" style={{ color: 'var(--muted)' }}>Completed this week</h3>
        {perMember.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: 150, fontSize: 12.5, color: 'var(--muted)' }}>Nothing completed yet.</div>
        ) : (
          <div className="space-y-2.5">
            {perMember.map((x) => (
              <div key={x.name} className="flex items-center gap-2.5">
                <Avatar name={x.name} size={22} font={11} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', width: 64, flex: '0 0 auto' }} className="truncate">{x.name}</span>
                <div className="flex-1" style={{ height: 8, borderRadius: 99, background: 'var(--bg-tint)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: (x.done / maxDone) * 100 + '%', background: x.color, transition: 'width .5s ease' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)', width: 22, textAlign: 'right' }}>{x.done}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
