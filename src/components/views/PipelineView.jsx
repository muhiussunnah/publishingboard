'use client';

import { useMemo, useState } from 'react';
import { Plus, Phone, MapPin, User, GripVertical } from 'lucide-react';
import { useBoard } from '@/components/Board';
import { PIPELINE_COLUMNS, STAGE_META } from '@/lib/domain';
import { fmtMoney } from '@/lib/format';

export default function PipelineView() {
  const { leads, openLead, setLeadStage, t, lang } = useBoard();
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(PIPELINE_COLUMNS.map((s) => [s, []]));
    for (const l of leads) (map[l.stage] || (map[l.stage] = [])).push(l);
    return map;
  }, [leads]);

  const total = leads.filter((l) => l.stage !== 'forlorad').reduce((s, l) => s + Number(l.value || 0), 0);
  const won = leads.filter((l) => l.stage === 'vunnen').reduce((s, l) => s + Number(l.value || 0), 0);

  const drop = (stage) => {
    if (dragId) setLeadStage(dragId, stage);
    setDragId(null); setOverCol(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="card px-3.5 py-2 text-[13px]"><span style={{ color: 'var(--ink-muted)' }}>{t('pipeline.total')}: </span><b style={{ color: 'var(--ink)' }}>{fmtMoney(total, lang)}</b></span>
          <span className="card px-3.5 py-2 text-[13px]"><span style={{ color: 'var(--ink-muted)' }}>{t('pipeline.won')}: </span><b style={{ color: 'var(--c-green)' }}>{fmtMoney(won, lang)}</b></span>
        </div>
        <button onClick={() => openLead()} className="btn btn-pink"><Plus size={16} /> {t('action.newLead')}</button>
      </div>

      <div className="grid gap-3 pb-4" style={{ gridTemplateColumns: `repeat(${PIPELINE_COLUMNS.length}, minmax(230px, 1fr))`, overflowX: 'auto' }}>
        {PIPELINE_COLUMNS.map((stage) => {
          const list = byStage[stage] || [];
          const m = STAGE_META[stage] || {};
          const sum = list.reduce((s, l) => s + Number(l.value || 0), 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOverCol(stage); }}
              onDragLeave={() => setOverCol((c) => (c === stage ? null : c))}
              onDrop={() => drop(stage)}
              className="rounded-2xl p-2.5 transition"
              style={{ background: overCol === stage ? m.bg : 'var(--bg-2)', minHeight: 200, outline: overCol === stage ? `2px dashed ${m.color}` : 'none' }}
            >
              <div className="flex items-center justify-between px-1.5 pb-2.5">
                <span className="chip" style={{ background: m.bg, color: m.color }}>{t(`stage.${stage}`)}</span>
                <span className="mono text-[11px]" style={{ color: 'var(--ink-muted)' }}>{list.length}</span>
              </div>

              <div className="space-y-2">
                {list.map((l) => (
                  <div
                    key={l.id}
                    draggable
                    onDragStart={() => setDragId(l.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    onClick={() => openLead(l)}
                    className="card card-hover p-3 cursor-pointer group"
                    style={dragId === l.id ? { opacity: 0.4 } : undefined}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <h3 className="font-display text-[15px] leading-tight" style={{ color: 'var(--ink)' }}>{l.company}</h3>
                      <GripVertical size={14} className="opacity-0 group-hover:opacity-100 transition shrink-0 mt-0.5" style={{ color: 'var(--ink-muted)' }} />
                    </div>
                    <div className="mt-2 space-y-1 text-[11.5px] mono" style={{ color: 'var(--ink-muted)' }}>
                      {l.contact && <div className="flex items-center gap-1.5 truncate"><User size={11} /> {l.contact}</div>}
                      {l.phone && <div className="flex items-center gap-1.5 truncate"><Phone size={11} /> {l.phone}</div>}
                      {l.city && <div className="flex items-center gap-1.5"><MapPin size={11} /> {l.city}</div>}
                    </div>
                    <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t" style={{ borderColor: 'var(--line)' }}>
                      <span className="text-[10.5px] mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-2)', color: 'var(--ink-soft)' }}>{l.owner}</span>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--c-green)' }}>{fmtMoney(l.value, lang)}</span>
                    </div>
                  </div>
                ))}
                {list.length === 0 && <div className="text-center text-[11px] mono py-6" style={{ color: 'var(--ink-muted)' }}>—</div>}
              </div>

              {sum > 0 && <div className="px-1.5 pt-2 mono text-[10.5px]" style={{ color: 'var(--ink-muted)' }}>Σ {fmtMoney(sum, lang)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
