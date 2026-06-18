"use client";
import {
  Trash2, ExternalLink, Plus, MapPin, Globe,
  Link as LinkIcon, FolderOpen, Edit3, Copy
} from "lucide-react";
import toast from "react-hot-toast";

export default function CityCard({ city, links, onAddLink, onDeleteCity, onDeleteLink, onEditLink, user }) {

  // Secure visit
  const handleVisit = (url) => {
    if (!user) return toast.error("Login to visit 🔒");
    window.open(url, "_blank");
  };

  // Secure open all
  const handleOpenAll = () => {
    if (!user) return toast.error("Login to view 🔒");
    if (links.length === 0) return toast.error("No links available");
    links.forEach(link => window.open(link.url, '_blank'));
  };

  // Secure copy all (no copy without login)
  const handleCopyAll = () => {
    if (!user) return toast.error("Login to copy links 🔒");
    if (links.length === 0) return toast.error("No links to copy");

    const allLinksText = links.map(link => link.url).join("\n");

    navigator.clipboard.writeText(allLinksText);
    toast.success(`${links.length} Links Copied! 📋`);
  };

  // Secure edit
  const handleEdit = (link) => {
    if (!user) return toast.error("Login to edit 🔒");
    if (onEditLink) onEditLink(link);
    else toast("Edit option coming soon!");
  };

  return (
    <div
      className="card card-hover rounded-2xl p-6 group relative overflow-hidden flex flex-col h-full"
    >

      {/* City Header */}
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)', border: '1px solid var(--line-2)' }}
          >
            <Globe className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-tight truncate" style={{ color: 'var(--ink)' }}>{city.name}</h3>
            <div className="flex items-center gap-1 text-xs uppercase font-bold tracking-wider mt-1 truncate" style={{ color: 'var(--muted)' }}>
              <MapPin className="w-3 h-3" /> {city.country}
            </div>
          </div>
        </div>

        {/* Delete City Button (Only for User) */}
        {user && (
          <button
            onClick={() => onDeleteCity(city.id)}
            className="btn-danger transition-colors p-2 rounded-lg shrink-0"
            title="Delete City"
            style={{ background: 'transparent', color: 'var(--faint)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--faint)'; }}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Links Header */}
      <div className="flex justify-between items-center mb-3 pb-2" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--ink-2)' }}>
          <LinkIcon className="w-4 h-4" />
          <span>{links?.length || 0} Research Links</span>
        </div>

        <div className="flex items-center gap-2">
            {/* Copy All Button */}
            <button
              onClick={handleCopyAll}
              className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
              title="Copy all links to clipboard"
              style={{ background: 'var(--bg-tint)', color: 'var(--ink-2)', border: '1px solid var(--line-2)' }}
            >
              <Copy className="w-3 h-3" /> Copy All
            </button>

            <button
              onClick={handleOpenAll}
              className="text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'var(--greenbg)', color: 'var(--green)', border: '1px solid var(--line-2)' }}
            >
              <FolderOpen className="w-3 h-3" /> Open All
            </button>
        </div>
      </div>

      {/* Links List */}
      <div className="space-y-3 flex-grow overflow-y-auto pr-1 max-h-[200px]">
        {links?.length === 0 ? (
          <p className="text-center text-xs py-4 italic" style={{ color: 'var(--faint)' }}>No links added yet.</p>
        ) : (
          links?.map(link => (
            <div
              key={link.id}
              className="p-3 rounded-lg transition-colors flex justify-between items-center group/link"
              style={{ background: 'var(--bg-tint)', border: '1px solid var(--line)' }}
            >

              {/* Link Info with URL Preview */}
              <div className="min-w-0 flex-1 mr-2">
                <h4 className="text-sm font-medium truncate" title={link.title} style={{ color: 'var(--ink)' }}>{link.title}</h4>
                <p className="mono text-[10px] truncate mt-0.5 opacity-70" style={{ color: 'var(--muted)' }}>
                  {link.url}
                </p>
              </div>

              {/* Action Icons: Visit, Edit, Delete */}
              <div className="flex items-center gap-1 shrink-0">
                {/* 1. Visit Icon */}
                <button
                  onClick={() => handleVisit(link.url)}
                  className="p-1.5 rounded-md transition-colors"
                  title="Visit Link"
                  style={{ color: 'var(--muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--greenbg)'; e.currentTarget.style.color = 'var(--green)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {/* 2. Edit Icon (Protected) */}
                {user && (
                   <button
                    onClick={() => handleEdit(link)}
                    className="p-1.5 rounded-md transition-colors"
                    title="Edit Link"
                    style={{ color: 'var(--muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--amber-bg)'; e.currentTarget.style.color = 'var(--amber)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* 3. Delete Icon (Protected) */}
                {user && (
                  <button
                    onClick={() => onDeleteLink(link.id)}
                    className="p-1.5 rounded-md transition-colors"
                    title="Delete Link"
                    style={{ color: 'var(--muted)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Link Button (Protected) */}
      {user ? (
        <button
          onClick={() => onAddLink(city.id)}
          className="w-full mt-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shrink-0"
          style={{ border: '1px dashed var(--line-2)', color: 'var(--muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--pink)'; e.currentTarget.style.color = 'var(--pink-600)'; e.currentTarget.style.background = 'var(--pinkbg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line-2)'; e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Plus className="w-4 h-4" /> Add Research Link
        </button>
      ) : (
        <div className="mt-4 py-3 text-center text-xs italic rounded-xl" style={{ color: 'var(--faint)', border: '1px dashed var(--line)' }}>
           Login to contribute
        </div>
      )}
    </div>
  );
}
