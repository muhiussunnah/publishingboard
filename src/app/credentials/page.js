'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/browser';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Eye, EyeOff, Copy, Trash2, Plus,
  ExternalLink, Key, User, Search, Loader2, Save, X, Globe, Edit,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CredentialsPage() {
  const [creds, setCreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Password show/hide state (tracked per credential id)
  const [revealed, setRevealed] = useState({});

  // Modal & edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    site_name: '', site_url: '', username: '', password: '', category: 'general',
  });

  // 1. Auth check + load data
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }
        setUser(session.user);
        fetchData();
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error(error);
        toast.error('Could not load the vault');
      }
      if (data) setCreds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const toggleReveal = (id) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Open modal (Add New)
  const openAddModal = () => {
    setFormData({ site_name: '', site_url: '', username: '', password: '', category: 'general' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open modal (Edit)
  const openEditModal = (cred) => {
    setFormData({
      site_name: cred.site_name,
      site_url: cred.site_url || '',
      username: cred.username,
      password: cred.password,
      category: cred.category || 'general',
    });
    setEditingId(cred.id);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.site_name || !formData.username || !formData.password) {
      return toast.error('Please fill required fields');
    }

    let error;

    if (editingId) {
      // Edit mode -> Update
      const { error: updateError } = await supabase
        .from('credentials')
        .update(formData)
        .eq('id', editingId);
      error = updateError;
    } else {
      // New -> Insert
      const { error: insertError } = await supabase
        .from('credentials')
        .insert([formData]);
      error = insertError;
    }

    if (error) {
      console.error(error);
      toast.error('Failed to save');
    } else {
      toast.success(editingId ? 'Credential updated' : 'Credential saved to vault');
      setIsModalOpen(false);
      setFormData({ site_name: '', site_url: '', username: '', password: '', category: 'general' });
      setEditingId(null);
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    await supabase.from('credentials').delete().eq('id', id);
    fetchData();
    toast.success('Deleted');
  };

  // Filtering
  const filteredCreds = creds.filter((c) =>
    (c.site_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Not logged in
  if (!loading && !user) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-24 pb-16">
        <div className="card flex flex-col items-center justify-center text-center px-6 py-20">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)' }}
          >
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl mb-2" style={{ color: 'var(--ink)' }}>Access denied</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            This vault is locked. Please log in to access credentials.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center justify-center py-24 text-sm" style={{ color: 'var(--muted)' }}>
          <Loader2 className="animate-spin mr-2 w-4 h-4" /> Opening vault…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-24 pb-16">

      {/* Header */}
      <div className="mb-9 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="font-display text-3xl mb-2 flex items-center gap-3">
            <span className="grad-text">Secure Vault</span>
            <ShieldCheck className="w-7 h-7" style={{ color: 'var(--green)' }} />
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Securely manage company logins and access keys.
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--faint)' }}
            />
            <input
              type="text"
              placeholder="Search credentials…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>
          <button onClick={openAddModal} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filteredCreds.length === 0 ? (
        <div className="card flex flex-col items-center justify-center text-center px-6 py-20">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-tint)', color: 'var(--muted)' }}
          >
            <Key className="w-7 h-7" />
          </div>
          <h3 className="font-display text-lg mb-1" style={{ color: 'var(--ink)' }}>
            {searchQuery ? 'No matches found' : 'Your vault is empty'}
          </h3>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
            {searchQuery
              ? 'Try a different search term.'
              : 'Add your first credential to get started.'}
          </p>
          {!searchQuery && (
            <button onClick={openAddModal} className="btn btn-primary">
              <Plus className="w-4 h-4" /> Add New
            </button>
          )}
        </div>
      ) : (
        /* Grid cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCreds.map((cred) => (
            <motion.div
              key={cred.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card card-hover p-6 group relative overflow-hidden"
            >
              {/* Gradient top line */}
              <div
                className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--grad)' }}
              />

              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)' }}
                  >
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3
                      className="font-display text-lg leading-tight mb-0.5 truncate"
                      style={{ color: 'var(--ink)' }}
                    >
                      {cred.site_name}
                    </h3>
                    {cred.site_url && (
                      <a
                        href={cred.site_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs hover:underline flex items-center gap-1"
                        style={{ color: 'var(--green)' }}
                      >
                        Visit site <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Action buttons: Edit & Delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(cred)}
                    className="btn btn-ghost"
                    style={{ padding: '8px' }}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cred.id)}
                    className="btn btn-danger"
                    style={{ padding: '8px' }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Username field */}
              <div
                className="rounded-xl p-3 mb-3 flex justify-between items-center group/field"
                style={{ background: 'var(--bg-tint)', border: '1px solid var(--line)' }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <User className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--faint)' }} />
                  <span className="text-sm truncate" style={{ color: 'var(--ink-2)' }}>
                    {cred.username}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(cred.username, 'Username')}
                  className="p-1.5 rounded-md transition-opacity opacity-0 group-hover/field:opacity-100"
                  style={{ color: 'var(--muted)' }}
                  title="Copy username"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Password field */}
              <div
                className="rounded-xl p-3 flex justify-between items-center group/field"
                style={{ background: 'var(--bg-tint)', border: '1px solid var(--line)' }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Key className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--faint)' }} />
                  {revealed[cred.id] ? (
                    <span className="text-sm mono truncate" style={{ color: 'var(--pink-600)' }}>
                      {cred.password}
                    </span>
                  ) : (
                    <span
                      className="text-lg tracking-widest leading-none"
                      style={{ color: 'var(--faint)' }}
                    >
                      •••••••••••
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleReveal(cred.id)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--muted)' }}
                    title={revealed[cred.id] ? 'Hide password' : 'Show password'}
                  >
                    {revealed[cred.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(cred.password, 'Password')}
                    className="p-1.5 rounded-md transition-opacity opacity-0 group-hover/field:opacity-100"
                    style={{ color: 'var(--muted)' }}
                    title="Copy password"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(12, 13, 17, 0.45)', backdropFilter: 'blur(6px)' }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card w-full max-w-md p-8 relative"
              style={{ boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-ghost absolute top-4 right-4"
                style={{ padding: '8px' }}
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="font-display text-2xl mb-6 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <ShieldCheck className="w-6 h-6" style={{ color: 'var(--green)' }} />
                {editingId ? 'Edit Credential' : 'Add Credential'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="field-label">Site name</label>
                  <input
                    className="field-input"
                    placeholder="e.g. Envato Elements"
                    value={formData.site_name}
                    onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Website URL</label>
                  <input
                    className="field-input"
                    placeholder="https://…"
                    value={formData.site_url}
                    onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Username / Email</label>
                  <input
                    className="field-input"
                    placeholder="admin@famies.com"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Password</label>
                  <input
                    type="text"
                    className="field-input mono"
                    placeholder="SecretPass123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>

                <button onClick={handleSave} className="btn btn-primary w-full mt-2" style={{ padding: '12px' }}>
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Credential' : 'Save to Vault'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
