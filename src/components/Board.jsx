'use client';

import { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { isOverdue, isToday } from '@/lib/format';
import * as api from '@/app/actions';

import Header from '@/components/Header';
import Stats from '@/components/Stats';
import Tabs from '@/components/Tabs';
import TodayView from '@/components/views/TodayView';
import WeekView from '@/components/views/WeekView';
import CustomersView from '@/components/views/CustomersView';
import EventsView from '@/components/views/EventsView';
import CitiesView from '@/components/views/CitiesView';
import LibraryView from '@/components/views/LibraryView';
import PipelineView from '@/components/views/PipelineView';
import ListView from '@/components/views/ListView';
import ItemModal from '@/components/modals/ItemModal';
import CustomerModal from '@/components/modals/CustomerModal';
import VideoModal from '@/components/modals/VideoModal';
import LeadModal from '@/components/modals/LeadModal';
import DistributeModal from '@/components/modals/DistributeModal';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const BoardCtx = createContext(null);
export const useBoard = () => useContext(BoardCtx);

export default function Board({ initialData, backend }) {
  const { t, lang } = useI18n();

  const [customers, setCustomers] = useState(initialData.customers || []);
  const [items, setItems] = useState(initialData.items || []);
  const [videos, setVideos] = useState(initialData.videos || []);
  const [leads, setLeads] = useState(initialData.leads || []);
  const [team] = useState(initialData.salespeople || []);
  const [ctypes] = useState(initialData.customerTypes || []);

  const [view, setView] = useState('today');
  const [toast, setToast] = useState(null);

  // modal state: a record (or seed) or null
  const [itemModal, setItemModal] = useState(null);
  const [customerModal, setCustomerModal] = useState(null);
  const [videoModal, setVideoModal] = useState(null);
  const [leadModal, setLeadModal] = useState(null);
  const [distOpen, setDistOpen] = useState(false);

  const flash = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }, []);

  const getCustomer = useCallback((id) => customers.find((c) => c.id === id) || null, [customers]);

  // ---- mutators (optimistic local state + server persist) ----
  const upsertLocal = (setter) => (rec) =>
    setter((prev) => {
      const i = prev.findIndex((x) => x.id === rec.id);
      if (i < 0) return [...prev, rec];
      const next = [...prev];
      next[i] = { ...next[i], ...rec };
      return next;
    });

  const handlers = useMemo(() => ({
    // items
    async saveItem(record) {
      const saved = await api.saveItem(record);
      upsertLocal(setItems)(saved);
      flash(t('misc.savedToast'));
      return saved;
    },
    async deleteItem(id) {
      setItems((p) => p.filter((x) => x.id !== id));
      await api.deleteItem(id);
      flash(t('misc.deletedToast'));
    },
    async setItemStatus(id, status) {
      upsertLocal(setItems)({ id, status });
      await api.setItemStatus(id, status);
    },
    async distribute(opts) {
      const created = await api.distributeYear(opts);
      setItems((p) => [...p, ...created]);
      flash(t('misc.savedToast'));
    },
    // customers
    async saveCustomer(record) {
      const saved = await api.saveCustomer(record);
      upsertLocal(setCustomers)(saved);
      flash(t('misc.savedToast'));
      return saved;
    },
    async deleteCustomer(id) {
      setCustomers((p) => p.filter((x) => x.id !== id));
      await api.deleteCustomer(id);
      flash(t('misc.deletedToast'));
    },
    // videos
    async saveVideo(record) {
      const saved = await api.saveVideo(record);
      upsertLocal(setVideos)(saved);
      flash(t('misc.savedToast'));
      return saved;
    },
    async deleteVideo(id) {
      setVideos((p) => p.filter((x) => x.id !== id));
      await api.deleteVideo(id);
      flash(t('misc.deletedToast'));
    },
    // leads
    async saveLead(record) {
      const saved = await api.saveLead(record);
      upsertLocal(setLeads)(saved);
      flash(t('misc.savedToast'));
      return saved;
    },
    async deleteLead(id) {
      setLeads((p) => p.filter((x) => x.id !== id));
      await api.deleteLead(id);
      flash(t('misc.deletedToast'));
    },
    async setLeadStage(id, stage) {
      upsertLocal(setLeads)({ id, stage });
      await api.setLeadStage(id, stage);
    },
  }), [flash, t]);

  // ---- counts for tab badges ----
  const counts = useMemo(() => {
    const todayCount = items.filter((it) => it.status !== 'publicerad' && (isOverdue(it) || isToday(it))).length;
    const cityCount = new Set(items.map((it) => it.city).filter(Boolean)).size;
    return {
      today: todayCount,
      customers: customers.length,
      events: items.filter((it) => it.type === 'event').length,
      cities: cityCount,
      library: videos.length,
      pipeline: leads.filter((l) => l.stage !== 'vunnen' && l.stage !== 'forlorad').length,
      list: items.length,
    };
  }, [items, customers, videos, leads]);

  const ctx = {
    customers, items, videos, leads, team, ctypes, getCustomer, lang, t,
    openItem: (seed) => setItemModal(seed || { type: 'brevlada' }),
    openCustomer: (rec) => setCustomerModal(rec || {}),
    openVideo: (rec) => setVideoModal(rec || {}),
    openLead: (rec) => setLeadModal(rec || {}),
    openDistribute: () => setDistOpen(true),
    ...handlers,
  };

  const VIEWS = {
    today: TodayView, week: WeekView, customers: CustomersView, events: EventsView,
    cities: CitiesView, library: LibraryView, pipeline: PipelineView, list: ListView,
  };
  const ActiveView = VIEWS[view] || TodayView;

  return (
    <BoardCtx.Provider value={ctx}>
      <div className="min-h-dvh">
        <Header backend={backend} onNew={() => ctx.openItem()} onDistribute={ctx.openDistribute} />
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
          <Stats />
          <Tabs view={view} setView={setView} counts={counts} />
          <main className="pb-24 pt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <ErrorBoundary>
                  <ActiveView />
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* modals */}
      <ItemModal seed={itemModal} onClose={() => setItemModal(null)} />
      <CustomerModal record={customerModal} onClose={() => setCustomerModal(null)} />
      <VideoModal record={videoModal} onClose={() => setVideoModal(null)} />
      <LeadModal record={leadModal} onClose={() => setLeadModal(null)} />
      <DistributeModal open={distOpen} onClose={() => setDistOpen(false)} />

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full px-4 py-2.5 text-white text-[13px] font-semibold shadow-lg"
            style={{ background: 'var(--c-green)' }}
          >
            <Check size={15} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </BoardCtx.Provider>
  );
}
