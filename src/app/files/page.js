"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/browser";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, ExternalLink, Trash2, Plus, Lock,
  FileSpreadsheet, File, Layout, Loader2, X, Save,
  Edit3, Mail, FolderPlus, Folder, Search, ArrowLeft, ArrowRightLeft
} from "lucide-react";
import toast from "react-hot-toast";

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  const [editingFile, setEditingFile] = useState(null);
  const [fileToMove, setFileToMove] = useState(null);

  const [formData, setFormData] = useState({ name: "", url: "", owner_email: "", category: "doc" });
  const [newFolderName, setNewFolderName] = useState("");

  const fetchData = async () => {
    try {
      const { data: fileData } = await supabase.from('files').select('*').order('created_at', { ascending: false });
      if (fileData) setFiles(fileData);

      const { data: folderData } = await supabase.from('folders').select('*').order('created_at', { ascending: false });
      if (folderData) setFolders(folderData);
    } catch (e) {
      // Tables may be empty / missing — fail soft, render empty state.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (e) {
        setUser(null);
      }
    };
    checkUser();
    fetchData();

    const channel = supabase.channel('files-page-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'files' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'folders' }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const getIcon = (category) => {
    switch (category) {
      case 'sheet': return <FileSpreadsheet className="w-6 h-6" style={{ color: 'var(--green)' }} />;
      case 'doc': return <FileText className="w-6 h-6" style={{ color: 'var(--pink)' }} />;
      case 'slide': return <Layout className="w-6 h-6" style={{ color: 'var(--amber)' }} />;
      default: return <File className="w-6 h-6" style={{ color: 'var(--muted)' }} />;
    }
  };

  // --- Actions ---

  // Open Edit Modal
  const openEditModal = (file, e) => {
    if (e) e.stopPropagation(); // stop click bubbling

    setEditingFile(file);
    setFormData({
      name: file.name,
      url: file.url,
      owner_email: file.owner_email || "",
      category: file.category || "doc"
    });
    setIsModalOpen(true);
  };

  // Save file (Create or Update)
  const handleSaveFile = async () => {
    if (!user) return toast.error("Login required 🔒");
    if (!formData.name || !formData.url) return toast.error("Please fill required fields");

    let error;

    // On edit keep folder id untouched; only new files get the current folder id
    const payload = { ...formData };

    if (editingFile) {
      // Update
      const { error: err } = await supabase.from('files').update(payload).eq('id', editingFile.id);
      error = err;
      toast.success("File updated!");
    } else {
      // Create (Assign current folder ID)
      payload.folder_id = currentFolder?.id || null;
      const { error: err } = await supabase.from('files').insert([payload]);
      error = err;
      toast.success("File added!");
    }

    if (error) toast.error("Failed to save");
    else {
      setIsModalOpen(false);
      setEditingFile(null);
      setFormData({ name: "", url: "", owner_email: "", category: "doc" });
    }
  };

  const handleCreateFolder = async () => {
    if (!user) return toast.error("Login required 🔒");
    if (!newFolderName) return toast.error("Enter folder name");

    const { error } = await supabase.from('folders').insert([{ name: newFolderName }]);
    if (error) toast.error("Failed to create folder");
    else {
      toast.success("Folder created! 📁");
      setIsFolderModalOpen(false);
      setNewFolderName("");
    }
  };

  const handleMoveFile = async (targetFolderId) => {
    if (!fileToMove) return;

    const { error } = await supabase
      .from('files')
      .update({ folder_id: targetFolderId })
      .eq('id', fileToMove.id);

    if (error) toast.error("Failed to move file");
    else {
      toast.success("File moved successfully! 🚚");
      setIsMoveModalOpen(false);
      setFileToMove(null);
    }
  };

  const handleDelete = async (id, type) => {
    if (!user) return toast.error("Login required 🔒");
    if (!confirm(`Delete this ${type}?`)) return;

    const table = type === 'folder' ? 'folders' : 'files';
    await supabase.from(table).delete().eq('id', id);
    toast.success(`${type === 'folder' ? 'Folder' : 'File'} deleted`);
  };

  // Filter Logic
  const displayedFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery) return matchesSearch;
    return file.folder_id === (currentFolder ? currentFolder.id : null);
  });

  const displayedFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (searchQuery) return matchesSearch;
    return currentFolder === null;
  });

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center justify-center py-32" style={{ color: 'var(--muted)' }}>
          <Loader2 className="animate-spin mr-2 w-5 h-5" /> Loading Vault...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-24 pb-16">

      {/* Header & Controls */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl mb-1 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              {currentFolder ? (
                <button
                  onClick={() => setCurrentFolder(null)}
                  className="p-1 rounded-full transition-colors"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tint)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              ) : (
                <span className="text-3xl">📂</span>
              )}
              <span className="grad-text">
                {currentFolder ? currentFolder.name : "Resource Files"}
              </span>
            </h1>
            <p className="text-sm ml-1" style={{ color: 'var(--muted)' }}>Manage docs, assets &amp; folders.</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--faint)' }} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            {user && (
              <>
                <button
                  onClick={() => setIsFolderModalOpen(true)}
                  className="btn btn-outline"
                >
                  <FolderPlus className="w-4 h-4" /> New Folder
                </button>
                <button
                  onClick={() => {
                    setEditingFile(null);
                    setFormData({ name: "", url: "", owner_email: "", category: "doc" });
                    setIsModalOpen(true);
                  }}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4" /> Add File
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-3">

        {/* Empty State */}
        {displayedFolders.length === 0 && displayedFiles.length === 0 && (
          <div
            className="text-center py-16 rounded-xl"
            style={{ border: '1px dashed var(--line-2)', color: 'var(--muted)' }}
          >
            {searchQuery ? "No matching files found." : "This folder is empty."}
          </div>
        )}

        {/* 1. Folders Grid */}
        {!searchQuery && displayedFolders.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {displayedFolders.map(folder => (
              <motion.div
                key={folder.id}
                whileHover={{ scale: 1.02 }}
                className="card card-hover p-4 flex items-center justify-between cursor-pointer group"
                onClick={() => setCurrentFolder(folder)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Folder className="w-8 h-8 flex-shrink-0" style={{ color: 'var(--amber)', fill: 'var(--amber-bg)' }} />
                  <span className="font-bold text-sm truncate" style={{ color: 'var(--ink)' }}>{folder.name}</span>
                </div>
                {user && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, 'folder'); }}
                    className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: 'var(--faint)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--faint)')}
                    title="Delete folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* 2. Files List */}
        {displayedFiles.map((file) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="card card-hover p-4 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="p-3 rounded-lg flex-shrink-0" style={{ background: 'var(--bg-tint)' }}>
                {getIcon(file.category)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base truncate pr-4" style={{ color: 'var(--ink)' }}>{file.name}</h3>

                {user ? (
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="mono text-xs truncate max-w-[300px]" style={{ color: 'var(--muted)' }}>
                      {file.url}
                    </p>
                    {file.owner_email && (
                      <div
                        className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded w-fit"
                        style={{ color: 'var(--amber)', background: 'var(--amber-bg)', border: '1px solid var(--line)' }}
                      >
                        <Mail className="w-3 h-3" /> {file.owner_email}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs flex items-center gap-1 mt-1 cursor-not-allowed" style={{ color: 'var(--muted)' }}>
                    <Lock className="w-3 h-3" /> Protected
                  </div>
                )}
              </div>
            </div>

            {/* File Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {user ? (
                <>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: 'var(--greenbg)', color: 'var(--green)', border: '1px solid var(--line)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--greenbg)'; e.currentTarget.style.color = 'var(--green)'; }}
                    title="Visit"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Move Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setFileToMove(file); setIsMoveModalOpen(true); }}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: 'var(--violet-bg)', color: 'var(--violet)', border: '1px solid var(--line)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--violet)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--violet-bg)'; e.currentTarget.style.color = 'var(--violet)'; }}
                    title="Move to Folder"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={(e) => openEditModal(file, e)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid var(--line)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--amber-bg)'; e.currentTarget.style.color = 'var(--amber)'; }}
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(file.id, 'file'); }}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--line)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div
                  className="px-3 py-1 text-xs rounded-full"
                  style={{ background: 'var(--bg-tint)', color: 'var(--muted)', border: '1px solid var(--line)' }}
                >
                  Locked
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Add/Edit File Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(12, 13, 17, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-md relative"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <X />
              </button>
              <h2 className="font-display text-xl mb-6" style={{ color: 'var(--ink)' }}>{editingFile ? "Edit File" : "Add File"}</h2>

              <div className="space-y-3">
                <input placeholder="File Name" className="field-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                <input placeholder="URL Link" className="field-input" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                <input placeholder="owner@company.com" className="field-input" value={formData.owner_email} onChange={e => setFormData({ ...formData, owner_email: e.target.value })} />

                <div className="flex gap-2 pt-2">
                  {['doc', 'sheet', 'slide'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className="flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-colors"
                      style={formData.category === cat
                        ? { background: 'var(--grad)', color: '#fff', border: '1px solid transparent' }
                        : { background: 'var(--bg-tint)', color: 'var(--muted)', border: '1px solid var(--line-2)' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button onClick={handleSaveFile} className="btn btn-green w-full mt-2" style={{ padding: '12px 16px' }}>
                  <Save className="w-5 h-5" /> Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Create Folder Modal */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(12, 13, 17, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-sm relative"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="absolute top-4 right-4 transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <X />
              </button>
              <h2 className="font-display text-xl mb-4 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                <FolderPlus style={{ color: 'var(--pink)' }} /> New Folder
              </h2>
              <input placeholder="Folder Name (e.g. Q1 Reports)" className="field-input mb-4" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
              <button onClick={handleCreateFolder} className="btn btn-primary w-full" style={{ padding: '12px 16px' }}>Create Folder</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Move File Modal */}
      <AnimatePresence>
        {isMoveModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(12, 13, 17, 0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card p-6 w-full max-w-sm relative"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="absolute top-4 right-4 transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
              >
                <X />
              </button>
              <h2 className="font-display text-xl mb-4" style={{ color: 'var(--ink)' }}>Move File To...</h2>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {/* Root Option */}
                <button
                  onClick={() => handleMoveFile(null)}
                  className="w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors"
                  style={{ background: 'var(--bg-tint)', border: '1px solid var(--line)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--line-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
                >
                  <div className="p-2 rounded-md" style={{ background: 'var(--bg)' }}>
                    <Folder className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>Main / Root</span>
                </button>

                {/* Folder Options */}
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveFile(folder.id)}
                    className="w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors"
                    style={{ background: 'var(--bg)', border: '1px solid var(--line)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-tint)'; e.currentTarget.style.borderColor = 'var(--pink)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--line)'; }}
                  >
                    <div className="p-2 rounded-md" style={{ background: 'var(--bg-tint)' }}>
                      <Folder className="w-4 h-4" style={{ color: 'var(--amber)' }} />
                    </div>
                    <span className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{folder.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
