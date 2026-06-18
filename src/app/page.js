'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Globe2, BarChart3, CheckSquare, FolderOpen,
  Clapperboard, KeyRound, Sparkles, ArrowRight, ArrowUpRight, Compass, Target,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

const MODULES = [
  { name: 'Publishing Board', desc: 'Plan, approve & publish content and events across every kommun.', path: '/board', icon: LayoutDashboard, tint: 'var(--pinkbg)', color: 'var(--pink-600)' },
  { name: 'Events', desc: 'A live directory of family events, cities and useful links.', path: '/famevent', icon: Globe2, tint: 'var(--greenbg)', color: 'var(--green)' },
  { name: 'Growth Stats', desc: 'Weekly growth, city & category analytics at a glance.', path: '/stats', icon: BarChart3, tint: 'var(--blue-bg)', color: 'var(--blue)' },
  { name: 'To Do', desc: 'A shared task tracker that keeps the whole team in sync.', path: '/todo', icon: CheckSquare, tint: 'var(--amber-bg)', color: 'var(--amber)' },
  { name: 'Files', desc: 'Shared files & folders — everything the team needs, organised.', path: '/files', icon: FolderOpen, tint: 'var(--cyan-bg)', color: 'var(--cyan)' },
  { name: 'VideoStats', desc: 'The video production engine: track every project end-to-end.', path: '/videostats', icon: Clapperboard, tint: 'var(--violet-bg)', color: 'var(--violet)' },
  { name: 'Vault', desc: 'A secure vault for the team’s credentials and logins.', path: '/credentials', icon: KeyRound, tint: 'var(--pinkbg)', color: 'var(--pink-600)' },
  { name: 'AI Writer', desc: 'Generate publish-ready copy in seconds with Gemini AI.', path: '/tools/mini-writer', icon: Sparkles, tint: 'var(--greenbg)', color: 'var(--green)' },
];

const fade = { hidden: { opacity: 0, y: 18 }, show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] } }) };

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
      {/* hero */}
      <section className="pt-28 pb-14 text-center flex flex-col items-center">
        <motion.div variants={fade} initial="hidden" animate="show" custom={0}>
          <Logo size={76} />
        </motion.div>
        <motion.span variants={fade} initial="hidden" animate="show" custom={1} className="chip mt-6" style={{ background: 'var(--grad-soft)', color: 'var(--pink-600)' }}>
          <span className="dot" style={{ background: 'var(--green)' }} /> Internal CRM · for the whole team
        </motion.span>
        <motion.h1 variants={fade} initial="hidden" animate="show" custom={2} className="font-display mt-5 leading-[1.04] tracking-tight2" style={{ fontSize: 'clamp(36px, 6vw, 68px)', color: 'var(--ink)' }}>
          One home for everything<br /><span className="grad-text">Famies builds every day.</span>
        </motion.h1>
        <motion.p variants={fade} initial="hidden" animate="show" custom={3} className="mt-5 max-w-2xl text-[16px] sm:text-[17px]" style={{ color: 'var(--muted)' }}>
          From publishing family activities across Sweden to videos, tasks, stats and secure access —
          the entire team runs the day from a single, beautiful workspace.
        </motion.p>
        <motion.div variants={fade} initial="hidden" animate="show" custom={4} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/board" className="btn btn-primary !px-6 !py-3 text-[14px]">Open the board <ArrowRight size={16} /></Link>
          <Link href="/todo" className="btn btn-outline !px-6 !py-3 text-[14px]">View today’s tasks</Link>
        </motion.div>
      </section>

      {/* module launcher */}
      <section className="pb-16">
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-1.5 h-5 rounded-full" style={{ background: 'var(--grad)' }} />
          <h2 className="font-display text-[22px]" style={{ color: 'var(--ink)' }}>Your workspace</h2>
        </div>
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {MODULES.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div key={m.path} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i % 4}>
                <Link href={m.path} className="card card-hover p-5 group flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <span className="grid place-items-center w-12 h-12 rounded-2xl" style={{ background: m.tint, color: m.color }}><Icon size={22} /></span>
                    <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }} />
                  </div>
                  <h3 className="font-display text-[18px] mt-4 group-hover:text-[var(--pink-600)] transition-colors" style={{ color: 'var(--ink)' }}>{m.name}</h3>
                  <p className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--muted)' }}>{m.desc}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* mission & vision */}
      <section className="pb-24 grid gap-4 md:grid-cols-2">
        {[
          { icon: Target, k: 'Our mission', v: 'Help every family in Sweden discover joyful, local activities for their children — and give our team one effortless place to make it happen.', tint: 'var(--pinkbg)', color: 'var(--pink-600)' },
          { icon: Compass, k: 'Our vision', v: 'A connected Sweden where no family ever runs out of meaningful things to do together — powered by a team that ships with clarity and care.', tint: 'var(--greenbg)', color: 'var(--green)' },
        ].map((b) => {
          const Icon = b.icon;
          return (
            <motion.div key={b.k} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="card p-7 relative overflow-hidden">
              <span className="grid place-items-center w-12 h-12 rounded-2xl mb-4" style={{ background: b.tint, color: b.color }}><Icon size={22} /></span>
              <h3 className="font-display text-[20px]" style={{ color: 'var(--ink)' }}>{b.k}</h3>
              <p className="text-[15px] mt-2 leading-relaxed" style={{ color: 'var(--ink-2)' }}>{b.v}</p>
            </motion.div>
          );
        })}
      </section>
    </div>
  );
}
