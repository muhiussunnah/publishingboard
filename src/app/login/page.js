'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/browser';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Welcome back, Commander! 🚀');
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div
      className="flex items-center justify-center p-4 relative overflow-hidden"
      style={{ minHeight: '100dvh', background: 'var(--bg)' }}
    >
      {/* Soft ambient blobs — pink / green, low opacity */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '-12%',
          left: '-10%',
          width: '26rem',
          height: '26rem',
          background:
            'radial-gradient(circle at 30% 30%, rgba(255, 61, 127, 0.22), transparent 62%)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: '-12%',
          right: '-10%',
          width: '26rem',
          height: '26rem',
          background:
            'radial-gradient(circle at 60% 60%, rgba(18, 189, 138, 0.20), transparent 62%)',
          filter: 'blur(90px)',
        }}
      />

      <div
        className="card glass w-full relative z-10 pop-in"
        style={{
          maxWidth: '420px',
          padding: '2.25rem',
          borderRadius: '1rem',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-8 transition-colors text-sm"
          style={{ color: 'var(--muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="font-display grad-text" style={{ fontSize: '1.875rem' }}>
            Admin Login
          </h1>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>
            Enter credentials to access FamAI Engine
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="field-label">Email</label>
            <div className="relative">
              <Mail
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--faint)' }}
              />
              <input
                type="email"
                required
                placeholder="admin@famies.com"
                className="field-input"
                style={{ paddingLeft: '2.75rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Password</label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--faint)' }}
              />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="field-input"
                style={{ paddingLeft: '2.75rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
            style={{
              padding: '13px 16px',
              fontSize: '14px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
