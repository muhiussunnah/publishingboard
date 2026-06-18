'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogIn, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/browser';
import Logo from '@/components/ui/Logo';

const publicItems = [
  { name: 'Home', path: '/' },
  { name: 'Board', path: '/board' },
  { name: 'Event', path: '/famevent' },
  { name: 'Stats', path: '/stats' },
  { name: 'To Do', path: '/todo' },
];
const authItems = [
  { name: 'Files', path: '/files' },
  { name: 'VideoStats', path: '/videostats' },
  { name: 'Vault', path: '/credentials' },
];
const aiTools = [{ name: 'Mini Content Writer', path: '/tools/mini-writer' }];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(false);
  const [tools, setTools] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    setUser(null); setProfile(false); setOpen(false);
    router.push('/login');
  };

  const isActive = (p) => (p === '/' ? pathname === '/' : pathname.startsWith(p));
  const linkCls = (p) => `relative px-3.5 py-2 text-[13.5px] font-semibold rounded-full transition-colors ${isActive(p) ? '' : 'hover:text-[var(--ink)]'}`;
  const linkStyle = (p) => ({ color: isActive(p) ? 'var(--pink-600)' : 'var(--muted)' });

  return (
    <nav className="fixed top-0 inset-x-0 z-50 transition-all" style={{ background: scrolled ? 'rgba(255,255,255,.78)' : 'rgba(255,255,255,.55)', backdropFilter: 'saturate(180%) blur(16px)', borderBottom: `1px solid ${scrolled ? 'var(--line)' : 'transparent'}` }}>
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={34} />
            <span className="font-display text-[19px] grad-text tracking-tight2">famies</span>
          </Link>

          {/* desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {publicItems.map((i) => (
              <Link key={i.path} href={i.path} className={linkCls(i.path)} style={linkStyle(i.path)}>{i.name}</Link>
            ))}
            <div className="relative" onMouseEnter={() => setTools(true)} onMouseLeave={() => setTools(false)}>
              <button className="flex items-center gap-1 px-3.5 py-2 text-[13.5px] font-semibold rounded-full transition-colors" style={{ color: pathname.includes('/tools') ? 'var(--pink-600)' : 'var(--muted)' }}>
                AI Tools <ChevronDown size={14} className={`transition-transform ${tools ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {tools && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 card p-1.5" style={{ boxShadow: 'var(--shadow)' }}>
                    {aiTools.map((tl) => (
                      <Link key={tl.path} href={tl.path} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors hover:bg-[var(--bg-tint)]" style={{ color: 'var(--ink-2)' }}>
                        <Sparkles size={14} style={{ color: 'var(--pink)' }} /> {tl.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {user && authItems.map((i) => (
              <Link key={i.path} href={i.path} className={linkCls(i.path)} style={linkStyle(i.path)}>{i.name}</Link>
            ))}
          </div>

          {/* right */}
          <div className="hidden lg:flex items-center gap-2">
            {user ? (
              <div className="relative">
                <button onClick={() => setProfile((p) => !p)} className="grid place-items-center w-9 h-9 rounded-full text-white font-display text-[14px]" style={{ background: 'var(--grad)' }}>
                  {(user.email?.[0] || 'U').toUpperCase()}
                </button>
                <AnimatePresence>
                  {profile && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 mt-2 w-52 card p-1.5" style={{ boxShadow: 'var(--shadow)' }}>
                      <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--line)' }}>
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Signed in as</p>
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink)' }}>{user.email}</p>
                      </div>
                      <button onClick={logout} className="w-full text-left px-3 py-2.5 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-colors hover:bg-[var(--red-bg)]" style={{ color: 'var(--red)' }}>
                        <LogOut size={15} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="btn btn-primary"><LogIn size={15} /> Login</Link>
            )}
          </div>

          {/* mobile toggle */}
          <button onClick={() => setOpen((o) => !o)} className="lg:hidden btn btn-ghost !px-2">{open ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>

      {/* mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="lg:hidden overflow-hidden" style={{ background: 'rgba(255,255,255,.96)', borderBottom: '1px solid var(--line)' }}>
            <div className="px-4 py-3 space-y-1">
              {[...publicItems, ...aiTools, ...(user ? authItems : [])].map((i) => (
                <Link key={i.path} href={i.path} onClick={() => setOpen(false)} className="block px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-colors" style={{ color: isActive(i.path) ? 'var(--pink-600)' : 'var(--ink-2)', background: isActive(i.path) ? 'var(--pinkbg)' : 'transparent' }}>{i.name}</Link>
              ))}
              <div className="pt-2 mt-1 border-t" style={{ borderColor: 'var(--line)' }}>
                {user ? (
                  <button onClick={logout} className="w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-semibold flex items-center gap-2" style={{ color: 'var(--red)' }}><LogOut size={15} /> Logout</button>
                ) : (
                  <Link href="/login" onClick={() => setOpen(false)} className="btn btn-primary w-full"><LogIn size={15} /> Login</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
