"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/browser";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Play, CheckCircle2, Clock, Calendar, MapPin, Link as LinkIcon,
  Trash2, ArrowRight, Plus, Loader2, Filter, AlertTriangle, Archive, Video, RefreshCw, X, BarChart3, Edit, Image as ImageIcon, Eye, UploadCloud, Save, MinusCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ✅ City List (Universal Added at the top)
const cityList = [
  "Universal",
  "Stockholm", "Upplands Väsby", "Österåker", "Sollentuna", "Uppsala",
  "Botkyrka", "Huddinge", "Järfälla", "Lidingö", "Nacka", "Norrtälje",
  "Solna", "Södertälje", "Tyresö", "Upplands-Bro", "Vaxholm", "Värmdö",
  "Sundbyberg", "Sigtuna", "Vallentuna", "Täby", "Danderyd", "Ekerö",
  "Haninge", "Nykvarn", "Nynäshamn", "Salem"
];

// Default Video Types
const VIDEO_TYPES = [
  "Event cards", "Places to visit", "This weeks Highlights",
  "Inspiration ad for famies", "Category video", "Most clicked this week",
  "How to videos", "Local UGC", "Others"
];

// On-brand chart palette (pink / green / violet / amber + supporting hues)
const CITY_COLORS = [
  '#ff3d7f', '#12bd8a', '#7c3aed', '#d97706', '#2563eb', '#e91e69', '#0e7490', '#1fd29a',
  '#c2410c', '#ff6aa3', '#475569', '#6fd6b4'
];

// --- Helper: Date Filtering Logic ---
const filterDataByTime = (data, timeFilter) => {
  const now = new Date();
  return data.filter(item => {
    if (item.status !== 'completed' && item.status !== 'archived') return false;
    if (!item.completed_at) return false;

    const date = new Date(item.completed_at);

    if (timeFilter === '30_days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return date >= thirtyDaysAgo;
    }
    if (timeFilter === 'this_month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'this_year') {
      return date.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'last_year') {
      return date.getFullYear() === now.getFullYear() - 1;
    }
    return true; // lifetime
  });
};

// --- Custom Tooltip for City Chart (light card) ---
const CustomCityTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="card p-3" style={{ boxShadow: 'var(--shadow)' }}>
        <p className="font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
          <MapPin className="w-3 h-3" style={{ color: data.fill }} /> {data.name}
        </p>
        <div className="text-xs" style={{ color: 'var(--ink-2)' }}>
          <span className="block">Videos: <strong style={{ color: 'var(--green)' }}>{data.value}</strong></span>
          <span className="block">Share: <strong style={{ color: 'var(--pink-600)' }}>{data.percent}%</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

export default function VideoStatsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("30_days");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Custom Danger Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState("");

  // Form States
  const [formData, setFormData] = useState({ title: "", link: "", city: "", expiry_date: "", video_type: "Event cards", image_url: "", is_evergreen: false });
  const [isCustomType, setIsCustomType] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Upload States
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchData = async () => {
    const { data } = await supabase.from('video_projects').select('*').order('created_at', { ascending: false });
    if (data) setProjects(data);
    setLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();
    fetchData();

    const channel = supabase.channel('video-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_projects' }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // --- General Actions ---

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setSelectedFileName(file.name);

    // Auto Upload
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file);

      if (uploadError) {
        if (uploadError.message.includes("Bucket not found")) {
          toast.error("Bucket 'images' not found. Please create it in Supabase.");
        } else {
          toast.error("Upload failed: " + uploadError.message);
        }
        setIsUploading(false);
        return;
      }

      setUploadProgress(80);
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        image_url: data.publicUrl,
        title: prev.title || file.name
      }));

      setUploadProgress(100);
      toast.success("Image Uploaded! ✅");

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong with upload.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSaveProject = async () => {
    if (!formData.title && !formData.image_url) return toast.error("Title or Image required");

    // Determine expiry date: If evergreen, set to far future date
    const finalExpiryDate = formData.is_evergreen ? "9999-12-31" : formData.expiry_date;

    if (!finalExpiryDate) return toast.error("Expiry Date required unless Evergreen");

    const projectData = {
      title: formData.title,
      link: formData.link,
      city: formData.city,
      expiry_date: finalExpiryDate,
      video_type: formData.video_type,
      image_url: formData.image_url,
    };

    if (editingId) {
      const { error } = await supabase.from('video_projects').update(projectData).eq('id', editingId);
      if (error) toast.error("Failed to update");
      else toast.success("Updated Successfully!");
    } else {
      const { error } = await supabase.from('video_projects').insert([{ ...projectData, status: 'selected' }]);
      if (error) toast.error("Failed to add");
      else toast.success("Added to Board!");
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", link: "", city: "", expiry_date: "", video_type: "Event cards", image_url: "", is_evergreen: false });
    setSelectedFile(null);
    setSelectedFileName("");
    setIsCustomType(false);
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    // Check if date is far future (Evergreen)
    const isEvergreen = new Date(item.expiry_date).getFullYear() === 9999;

    setFormData({
      title: item.title,
      link: item.link || "",
      city: item.city || "",
      expiry_date: isEvergreen ? "" : item.expiry_date,
      video_type: item.video_type || "Event cards",
      image_url: item.image_url || "",
      is_evergreen: isEvergreen
    });
    if (!VIDEO_TYPES.includes(item.video_type) && item.video_type) {
      setIsCustomType(true);
    } else {
      setIsCustomType(false);
    }
    setSelectedFileName("");
    setIsModalOpen(true);
  };

  const handleMoveStatus = async (id, currentStatus) => {
    let newStatus = '';
    let updateData = {};

    if (currentStatus === 'selected') newStatus = 'in_progress';
    else if (currentStatus === 'in_progress') {
      newStatus = 'completed';
      updateData = { completed_at: new Date() };
    } else return;

    await supabase.from('video_projects').update({ status: newStatus, ...updateData }).eq('id', id);
    toast.success(`Moved to ${newStatus.replace('_', ' ')} 🚀`);
  };

  const handleDelete = async (id, status) => {
    if (!confirm("Are you sure you want to remove this?")) return;

    if (status === 'completed') {
      await supabase.from('video_projects').update({ status: 'archived' }).eq('id', id);
      toast.success("Moved to History 📂");
    } else {
      await supabase.from('video_projects').delete().eq('id', id);
      toast.success("Deleted Permanently 🗑️");
    }
  };

  const handleDeleteAllCompleted = async () => {
    if (!confirm("Remove all completed items from board? They will stay in 'Active' stats until expired.")) return;

    const completedIds = projects.filter(p => p.status === 'completed').map(p => p.id);
    if (completedIds.length === 0) return;

    await supabase.from('video_projects').update({ status: 'archived' }).in('id', completedIds);
    toast.success("Board Cleared! Stats Preserved.");
  };

  const openHardResetModal = () => {
    setIsResetModalOpen(true);
    setResetConfirmationText("");
  };

  const executeHardReset = async () => {
    if (resetConfirmationText !== "confirmed") return;

    const { error } = await supabase.from('video_projects').delete().neq('id', 0);

    if (error) toast.error("Failed to reset data");
    else {
      toast.success("Engine Reset Successfully! ✨");
      setProjects([]);
      setIsResetModalOpen(false);
    }
  };

  // --- Stats Calculation Logic ---

  const filteredHistory = filterDataByTime(projects, filter);
  const now = new Date();

  // 🔥 Active Videos Logic (Includes Evergreen)
  // Active = (Status is 'completed' OR 'archived') AND (Not Expired)
  const activeVideoProjects = projects.filter(p => {
    const isPublished = p.status === 'completed' || p.status === 'archived';
    const isNotExpired = new Date(p.expiry_date) >= now;
    // Note: Evergreen date (9999) is naturally >= now
    return isPublished && isNotExpired;
  });

  const totalActive = activeVideoProjects.length;

  const liveCount = filteredHistory.filter(p => new Date(p.expiry_date) >= now).length;
  const expiredCount = filteredHistory.filter(p => new Date(p.expiry_date) < now).length;

  const pieData = [
    { name: 'Live App Videos', value: liveCount, color: '#12bd8a' },
    { name: 'Expired Event Videos', value: expiredCount, color: '#e11d48' },
  ];

  const cityStats = cityList.map(city => {
    const count = activeVideoProjects.filter(p => p.city?.toLowerCase().trim() === city.toLowerCase()).length;
    return { name: city, count };
  }).sort((a, b) => b.count - a.count);

  const cityPieData = cityStats
    .filter(c => c.count > 0)
    .map((c, index) => ({
      name: c.name,
      value: c.count,
      percent: totalActive > 0 ? ((c.count / totalActive) * 100).toFixed(1) : 0,
      fill: CITY_COLORS[index % CITY_COLORS.length]
    }));

  // 🔥 Category Breakdown Logic (Automatic from DB)
  const categoryStats = VIDEO_TYPES.map(type => {
    const count = activeVideoProjects.filter(p => p.video_type === type).length;
    return { name: type, count };
  }).sort((a, b) => b.count - a.count); // Sort high to low

  // Also include any custom types not in the default list
  const customTypes = [...new Set(activeVideoProjects.map(p => p.video_type))].filter(t => !VIDEO_TYPES.includes(t));
  customTypes.forEach(type => {
    const count = activeVideoProjects.filter(p => p.video_type === type).length;
    categoryStats.push({ name: type, count });
  });


  const selectedList = projects.filter(p => p.status === 'selected');
  const inProgressList = projects.filter(p => p.status === 'in_progress');
  const completedList = projects.filter(p => p.status === 'completed');

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center justify-center py-32" style={{ color: 'var(--muted)' }}>
          <Loader2 className="animate-spin mr-2" /> Loading Engine...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 pt-24 pb-16">
        <div className="card flex flex-col items-center justify-center text-center py-24 px-6">
          <span className="grid place-items-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)' }}>
            <AlertTriangle size={26} />
          </span>
          <p className="font-display text-xl" style={{ color: 'var(--ink)' }}>Login Required</p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--muted)' }}>Sign in to access the Video Production Engine.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 pt-24 pb-16">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl mb-2 flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <span className="grad-text">Video Production Engine</span>
            <span>🎬</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Track production pipeline and historical performance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={openHardResetModal} className="btn btn-danger p-2.5" title="Reset All Data">
            <RefreshCw className="w-5 h-5" />
          </button>

          <button onClick={() => { setIsModalOpen(true); setEditingId(null); setFormData({ title: "", link: "", city: "", expiry_date: "", video_type: "Event cards", image_url: "", is_evergreen: false }); setSelectedFile(null); setSelectedFileName(""); }} className="btn btn-primary">
            <Plus className="w-5 h-5" /> Add New
          </button>

          <div className="flex items-center gap-2 rounded-xl p-1.5" style={{ background: 'var(--bg-tint)', border: '1px solid var(--line-2)' }}>
            <Filter className="w-4 h-4 ml-2" style={{ color: 'var(--faint)' }} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-sm font-bold outline-none p-2 cursor-pointer bg-transparent border-none focus:ring-0" style={{ color: 'var(--ink)' }}>
              <option value="30_days">Last 30 Days</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
              <option value="lifetime">Lifetime History</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics & Charts Section */}
      <div className="mb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats Cards */}
        <div className="lg:col-span-1 space-y-4">
          <StatsCard label="Pipeline Active" count={selectedList.length + inProgressList.length} sub="Pending Production" color="var(--pink)" bg="var(--pinkbg)" icon={Play} />
          <StatsCard label="Videos Published" count={filteredHistory.length} sub={`In ${filter.replace('_', ' ')}`} color="var(--green)" bg="var(--greenbg)" icon={CheckCircle2} />
          <div className="card p-6 flex flex-col justify-center items-center h-[140px]">
            <span className="text-xs uppercase font-bold mb-2" style={{ color: 'var(--muted)' }}>Completion Rate</span>
            <div className="text-3xl font-bold flex items-baseline gap-1" style={{ color: 'var(--ink)' }}>
              {liveCount} <span className="text-xs" style={{ color: 'var(--green)' }}>Live</span> / {expiredCount} <span className="text-xs" style={{ color: 'var(--red)' }}>Expired</span>
            </div>
          </div>
        </div>

        {/* Right: Charts */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 relative overflow-hidden flex flex-col items-center justify-between">
            <h3 className="text-sm font-bold w-full mb-2 flex items-center gap-2" style={{ color: 'var(--ink-2)' }}><BarChart3 className="w-4 h-4" style={{ color: 'var(--green)' }} /> Production History</h3>
            <div className="h-[200px] w-full relative">
              {filteredHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: 'var(--line-2)', borderRadius: '8px', color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' }} itemStyle={{ color: 'var(--ink)', fontWeight: 'bold' }} /><Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', color: 'var(--ink-2)' }} /></PieChart></ResponsiveContainer>
              ) : (<div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--faint)' }}>No Data</div>)}
            </div>
          </div>
          <div className="card p-6 relative overflow-hidden flex flex-col items-center justify-between">
            <h3 className="text-sm font-bold w-full mb-2 flex items-center gap-2" style={{ color: 'var(--ink-2)' }}><MapPin className="w-4 h-4" style={{ color: 'var(--pink)' }} /> City Distribution</h3>
            <div className="h-[200px] w-full relative">
              {cityPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={cityPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">{cityPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={2} />)}</Pie><Tooltip content={<CustomCityTooltip />} /></PieChart></ResponsiveContainer>
              ) : (<div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--faint)' }}>No Active Videos</div>)}
            </div>
            {cityPieData.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center mt-2">
                {cityPieData.slice(0, 3).map(c => (<div key={c.name} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted)' }}><span className="w-2 h-2 rounded-full" style={{ background: c.fill }} /> {c.name}</div>))}
                {cityPieData.length > 3 && <span className="text-[10px]" style={{ color: 'var(--faint)' }}>+{cityPieData.length - 3} more</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BoardColumn title="Selected Events" count={selectedList.length} icon={Calendar} color="var(--pink)"
          action={<button onClick={() => { setIsModalOpen(true); setEditingId(null); setSelectedFile(null); setSelectedFileName(""); setFormData({ title: "", link: "", city: "", expiry_date: "", video_type: "Event cards", image_url: "", is_evergreen: false }); }} className="p-2 rounded-lg text-white" style={{ background: 'var(--grad)' }}><Plus className="w-5 h-5" /></button>}
        >
          {selectedList.map(item => <ProjectCard key={item.id} item={item} onEdit={handleEditClick} onMove={() => handleMoveStatus(item.id, 'selected')} onDelete={() => handleDelete(item.id, 'selected')} />)}
          {selectedList.length === 0 && <EmptyState text="No events selected" />}
        </BoardColumn>

        <BoardColumn title="In Progress" count={inProgressList.length} icon={Loader2} color="var(--amber)" animateIcon={true}>
          {inProgressList.map(item => <ProjectCard key={item.id} item={item} onEdit={handleEditClick} onMove={() => handleMoveStatus(item.id, 'in_progress')} onDelete={() => handleDelete(item.id, 'in_progress')} isProgress />)}
          {inProgressList.length === 0 && <EmptyState text="Engine idle..." />}
        </BoardColumn>

        <BoardColumn title="Published / Live" count={completedList.length} icon={CheckCircle2} color="var(--green)"
          action={completedList.length > 0 && <button onClick={handleDeleteAllCompleted} className="text-xs flex items-center gap-1 px-2 py-1 rounded transition-all" style={{ background: 'var(--bg)', border: '1px solid var(--line-2)', color: 'var(--muted)' }}><Archive className="w-3 h-3" /> Clear Board</button>}
        >
          {completedList.map(item => <ProjectCard key={item.id} item={item} onEdit={handleEditClick} onDelete={() => handleDelete(item.id, 'completed')} isCompleted />)}
          {completedList.length === 0 && <EmptyState text="Nothing published yet" />}
        </BoardColumn>
      </div>

      {/* City Stats (Moved to Bottom) */}
      <div className="mb-16 mt-20">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-xl flex items-center gap-2" style={{ color: 'var(--ink)' }}>
            <Video className="w-5 h-5" style={{ color: 'var(--pink)' }} /> All Active Videos by City
          </h2>
          <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)' }}>
            Total Active: {activeVideoProjects.length}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {cityStats.map((city) => (
            <div key={city.name} className="card p-3 flex justify-between items-center transition-all" style={city.count > 0 ? { borderColor: 'var(--pink)' } : { background: 'var(--bg-tint)', opacity: 0.6 }}>
              <span className="text-xs font-bold truncate" style={{ color: 'var(--ink-2)' }}>{city.name}</span>
              <span className="text-sm font-extrabold" style={{ color: city.count > 0 ? 'var(--green)' : 'var(--faint)' }}>
                {city.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 🚀 Category Stats (Auto Count from Active Videos) */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl flex items-center gap-2" style={{ color: 'var(--ink)' }}>
              <BarChart3 className="w-5 h-5" style={{ color: 'var(--violet)' }} /> Live Videos by Category
            </h2>
            <div className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--violet-bg)', color: 'var(--violet)' }}>
              Categories: {categoryStats.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {categoryStats.map((cat, idx) => (
            <div key={idx} className="card p-3 flex justify-between items-center transition-all" style={cat.count > 0 ? { borderColor: 'var(--violet)' } : { background: 'var(--bg-tint)', opacity: 0.6 }}>
              <span className="text-xs font-bold truncate pr-2" style={{ color: 'var(--ink-2)' }}>{cat.name}</span>
              <span className="text-sm font-extrabold" style={{ color: cat.count > 0 ? 'var(--violet)' : 'var(--faint)' }}>
                {cat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(12,13,17,0.45)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card p-8 w-full max-w-md relative" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--ink)' }}>{editingId ? "Edit Event" : "Add Selected Event"}</h2>
              <div className="space-y-4">

                {/* Image Link & Upload Option */}
                <div className="grid grid-cols-1 gap-3">
                  {/* URL Input */}
                  <input placeholder="Image URL (e.g. https://...)" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="field-input text-xs" />

                  {/* File Upload Visual */}
                  <div className="relative rounded-xl p-3 text-center transition-colors cursor-pointer group" style={{ border: '1px dashed var(--line-2)', background: 'var(--bg-tint)' }}>
                    <input type="file" onChange={handleFileChange} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" accept="image/*" />
                    <div className="flex flex-col items-center justify-center gap-1 relative">
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--pink)' }} />
                          <span className="text-xs mt-1" style={{ color: 'var(--pink-600)' }}>Uploading {uploadProgress}%...</span>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 group-hover:scale-110 transition-transform" style={{ color: 'var(--pink)' }} />
                          {formData.image_url && !formData.image_url.startsWith('http') ? (
                            <span className="text-xs font-bold" style={{ color: 'var(--green)' }}>Image Uploaded ✅</span>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>Click to Upload Image File</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <input placeholder="Event Title (Optional if Image Only)" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="field-input" />

                {/* Video Type */}
                <div className="flex gap-2">
                  {isCustomType ? (
                    <input placeholder="Enter Custom Video Type" value={formData.video_type} onChange={e => setFormData({ ...formData, video_type: e.target.value })} className="field-input flex-1" autoFocus />
                  ) : (
                    <select value={formData.video_type} onChange={e => setFormData({ ...formData, video_type: e.target.value })} className="field-select flex-1 cursor-pointer">
                      {VIDEO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                  <button onClick={() => setIsCustomType(!isCustomType)} className="p-2 rounded-lg border transition-colors" style={isCustomType ? { background: 'var(--grad)', borderColor: 'transparent', color: '#fff' } : { background: 'var(--bg-tint)', borderColor: 'var(--line-2)', color: 'var(--muted)' }} title="Custom Type">
                    {isCustomType ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>

                <input placeholder="Event Link (https://...)" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="field-input" />

                <div className="relative">
                  <input placeholder="City Name" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="field-input" list="city-options" />
                  <datalist id="city-options">{cityList.map(c => <option key={c} value={c} />)}</datalist>
                </div>

                {/* 🔥 Evergreen Toggle & Date Picker */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_evergreen}
                      onChange={(e) => setFormData({ ...formData, is_evergreen: e.target.checked })}
                      id="evergreen"
                      className="w-4 h-4 cursor-pointer"
                      style={{ accentColor: 'var(--pink)' }}
                    />
                    <label htmlFor="evergreen" className="text-sm cursor-pointer select-none" style={{ color: 'var(--ink-2)' }}>
                      Evergreen Content (Never Expires)
                    </label>
                  </div>

                  {!formData.is_evergreen && (
                    <div>
                      <label className="field-label">Expiry Date (Required)</label>
                      <input type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} className="field-input" />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
                  <button onClick={handleSaveProject} disabled={isUploading} className="btn btn-primary">
                    {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : (editingId ? "Update Event" : "Add to Board")}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DANGER / RESET Modal */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(12,13,17,0.55)', backdropFilter: 'blur(6px)' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card p-8 w-full max-w-md relative overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)', borderColor: 'var(--red)' }}>
              <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'var(--grad)' }} />
              <button onClick={() => setIsResetModalOpen(false)} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--muted)' }}><X className="w-5 h-5" /></button>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--red-bg)' }}><AlertTriangle className="w-8 h-8" style={{ color: 'var(--red)' }} /></div>
                <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--ink)' }}>Delete Everything?</h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>This action cannot be undone.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <input value={resetConfirmationText} onChange={(e) => setResetConfirmationText(e.target.value)} className="field-input text-center tracking-widest mono" placeholder="confirmed" />
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setIsResetModalOpen(false)} className="btn btn-ghost flex-1 py-3">Cancel</button>
                  <button onClick={executeHardReset} disabled={resetConfirmationText !== "confirmed"} className="flex-1 py-3 rounded-xl font-bold text-white transition-all" style={resetConfirmationText === "confirmed" ? { background: 'var(--red)', boxShadow: 'var(--shadow)' } : { background: 'var(--bg-tint)', color: 'var(--faint)', cursor: 'not-allowed', opacity: 0.6 }}>Delete All Data</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}</style>
    </div>
  );
}

// Sub-components
function StatsCard({ label, count, sub, color, bg, icon: Icon }) {
  return (
    <div className="card card-hover p-5 flex items-center justify-between group">
      <div><p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--muted)' }}>{label}</p><h2 className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>{count}</h2><p className="text-xs mt-1" style={{ color: 'var(--faint)' }}>{sub}</p></div>
      <div className="p-3 rounded-xl" style={{ background: bg, color }}><Icon className="w-6 h-6" /></div>
    </div>
  );
}

function BoardColumn({ title, count, icon: Icon, children, color, action, animateIcon }) {
  return (
    <div className="card p-4 flex flex-col h-full min-h-[500px]" style={{ background: 'var(--bg-tint)' }}>
      <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: '1px solid var(--line)' }}><div className="flex items-center gap-2"><Icon className={`w-5 h-5 ${animateIcon ? 'animate-spin' : ''}`} style={{ color }} /><h3 className="font-display font-bold text-lg" style={{ color }}>{title}</h3><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--muted)' }}>{count}</span></div>{action}</div>
      <div className="space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar"><AnimatePresence mode="popLayout">{children}</AnimatePresence></div>
    </div>
  );
}

function ProjectCard({ item, onEdit, onMove, onDelete, isProgress, isCompleted }) {
  const isEvergreen = new Date(item.expiry_date).getFullYear() === 9999;
  const isExpired = !isEvergreen && new Date(item.expiry_date) < new Date();

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="card card-hover p-4 relative group">
      <div className="flex justify-between items-start mb-2">
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1" style={{ background: 'var(--bg-tint)', border: '1px solid var(--line)', color: 'var(--muted)' }}><MapPin className="w-3 h-3" /> {item.city || "Unknown City"}</span>
          {item.video_type && <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)' }}>{item.video_type}</span>}
        </div>
        {isCompleted && isExpired && (<span className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}><AlertTriangle className="w-3 h-3" /> Expired</span>)}
        {isEvergreen && (<span className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1" style={{ background: 'var(--greenbg)', color: 'var(--green)' }}>🌲 Evergreen</span>)}
      </div>

      <h4 className="font-bold mb-1 line-clamp-2" style={{ color: 'var(--ink)' }}>{item.title}</h4>

      {/* View Image Button opens in New Tab */}
      <div className="flex flex-col gap-2 mt-2 mb-3">
        {item.image_url && (
          <a
            href={item.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center gap-1 w-fit transition-colors"
            style={{ color: 'var(--green)' }}
          >
            <Eye className="w-3 h-3" /> View Image
          </a>
        )}

        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 w-fit transition-colors" style={{ color: 'var(--pink-600)' }}>
            <LinkIcon className="w-3 h-3" /> Visit Link
          </a>
        )}
      </div>

      <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: '1px solid var(--line)' }}>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
          <Clock className="w-3 h-3" />
          {isEvergreen ? "Never Expires" : new Date(item.expiry_date).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button onClick={() => onEdit(item)} className="p-1.5 rounded transition-colors hover:bg-[var(--pinkbg)]" style={{ color: 'var(--muted)' }} title="Edit Event"><Edit className="w-4 h-4" /></button>
          )}
          <button onClick={onDelete} className="p-1.5 rounded transition-colors hover:bg-[var(--red-bg)]" style={{ color: 'var(--muted)' }} title={isCompleted ? "Archive to History" : "Delete"}><Trash2 className="w-4 h-4" /></button>
          {!isCompleted && (<button onClick={onMove} className="p-1.5 rounded-lg text-white transition-all" style={{ background: 'var(--grad)' }}><ArrowRight className="w-4 h-4" /></button>)}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="h-32 flex items-center justify-center text-sm rounded-xl" style={{ border: '2px dashed var(--line-2)', color: 'var(--muted)' }}>{text}</div>
  );
}
