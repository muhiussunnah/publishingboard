"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/browser";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from "recharts";
import { AlertCircle, CheckCircle2, AlertTriangle, Edit3, Save, X, Trash2, Search, Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";

// --- Configs ---
const cityList = [
  "Stockholm", "Upplands Väsby", "Österåker", "Sollentuna", "Uppsala",
  "Botkyrka", "Huddinge", "Järfälla", "Lidingö", "Nacka", "Norrtälje",
  "Solna", "Södertälje", "Tyresö", "Upplands-Bro", "Vaxholm", "Värmdö",
  "Sundbyberg", "Sigtuna", "Vallentuna", "Täby", "Danderyd", "Ekerö",
  "Haninge", "Nykvarn", "Nynäshamn", "Salem"
];

const getStatus = (current, target) => {
  if (target === 0) return { label: "N/A", emoji: "", style: { background: "var(--slate-bg)", color: "var(--slate)", borderColor: "var(--line-2)" }, icon: AlertCircle };
  if (current >= target) return { label: "Wow lovely!", emoji: "😍", style: { background: "var(--greenbg)", color: "var(--green)", borderColor: "rgba(18,189,138,0.2)" }, icon: CheckCircle2 };
  if (current >= target * 0.8) return { label: "Warning!", emoji: "⚠️", style: { background: "var(--amber-bg)", color: "var(--amber)", borderColor: "rgba(194,65,12,0.2)" }, icon: AlertTriangle };
  return { label: "Alert!", emoji: "🚨", style: { background: "var(--red-bg)", color: "var(--red)", borderColor: "rgba(225,29,72,0.2)" }, icon: AlertCircle };
};

export default function StatsPage() {
  const [stats, setStats] = useState([]);
  const [targetStats, setTargetStats] = useState(null);

  // Category Stats
  const [categoryStats, setCategoryStats] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({});

  // City Stats (Fixed & Realtime)
  const [cityStats, setCityStats] = useState([]);
  const [editingCity, setEditingCity] = useState(null);
  const [cityForm, setCityForm] = useState({});

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editForm, setEditForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

  // ডাটা লোড ফাংশন
  const fetchData = async () => {
    try {
      // 1. Weekly Stats
      const { data: weeklyData } = await supabase.from('weekly_stats').select('*').order('id', { ascending: true });
      if (weeklyData) {
        const target = weeklyData.find(item => item.week_label === 'Target');
        const weeks = weeklyData.filter(item => item.week_label !== 'Target').map(week => ({
          ...week,
          total_live: (week.events || 0) + (week.smart_reach || 0) + (week.sponsored || 0) +
                      (week.seasonal || 0) + (week.affiliate || 0) + (week.ugc || 0) + (week.mini_articles || 0)
        }));
        setTargetStats(target);
        setStats(weeks);
      }

      // 2. Category Stats
      const { data: catData } = await supabase.from('category_stats').select('*').order('id', { ascending: true });
      if (catData) setCategoryStats(catData);

      // 3. City Stats (Fixed Logic)
      const { data: cData } = await supabase.from('city_stats').select('*');

      // ডাটাবেস থেকে পাওয়া ডাটার সাথে আমাদের ফিক্সড সিটি লিস্ট মার্জ করা
      const mergedCities = cityList.map(city => {
         const found = cData?.find(c => c.city_name === city);
         // যদি ডাটাবেসে থাকে তো ভালো, না থাকলে 0 দিয়ে শো করাবো
         return found ? found : { city_name: city, events_count: 0 };
      });

      // বেশি ইভেন্ট ওয়ালা সিটি আগে দেখাবে
      mergedCities.sort((a, b) => b.events_count - a.events_count);
      setCityStats(mergedCities);
    } catch (err) {
      console.error("Stats fetch error:", err);
      toast.error("Could not load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error) setUser(session?.user ?? null);
      } catch (err) { setUser(null); }
      fetchData();
    };
    init();

    // অথ লিসেনার
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // 🔥 Realtime Subscription (All Tables)
    const channel = supabase.channel('stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_stats' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_stats' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'city_stats' }, fetchData) // সিটির রিয়েলটাইম আপডেট
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      authListener.unsubscribe();
    };
  }, []);

  // --- Actions ---
  const handleEdit = (item) => {
    if (!user) return toast.error("Login to edit stats 🔒");
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleQuickEdit = (item) => {
    if (!user) return toast.error("Login to edit stats 🔒");
    setEditForm(item);
    setIsQuickEditOpen(true);
  };

  const handleSave = async (isModal = false) => {
    const { total_live, ...dataToSave } = editForm;
    const { error } = await supabase.from('weekly_stats').update(dataToSave).eq('id', editForm.id);
    if (error) toast.error("Failed to update");
    else {
      toast.success("Updated successfully!");
      setEditingId(null);
      if(isModal) setIsQuickEditOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (!user) return toast.error("Login to delete 🔒");
    if(!confirm("Are you sure?")) return;
    const { error } = await supabase.from('weekly_stats').delete().eq('id', id);
    if (error) toast.error("Failed to delete");
    else toast.success("Week deleted");
  };

  const handleAddNewWeek = async () => {
    if (!user) return toast.error("Login to add new week 🔒");
    const weekLabel = prompt("Enter Week Name (e.g. Week 5):");
    if (!weekLabel) return;
    const { error } = await supabase.from('weekly_stats').insert([{
      week_label: weekLabel,
      events: 0, smart_reach: 0, sponsored: 0, seasonal: 0, affiliate: 0, ugc: 0, mini_articles: 0
    }]);
    if (error) toast.error("Error creating week");
    else toast.success("New week added!");
  };

  // --- Category Logic ---
  const handleEditCategory = (cat) => {
    if (!user) return toast.error("Login to edit categories 🔒");
    setEditingCategory(cat.id);
    setCategoryForm(cat);
  };

  const handleSaveCategory = async () => {
    const { error } = await supabase.from('category_stats').update(categoryForm).eq('id', categoryForm.id);
    if (error) toast.error("Failed to update category");
    else {
      setCategoryStats(prevStats =>
        prevStats.map(cat => (cat.id === categoryForm.id ? categoryForm : cat))
      );
      toast.success("Category updated! ✅");
      setEditingCategory(null);
    }
  };

  // --- City Logic (Fix applied here) ---
  const handleEditCity = (city) => {
    if (!user) return toast.error("Login to edit city stats 🔒");
    setEditingCity(city.city_name);
    setCityForm(city);
  };

  const handleSaveCity = async () => {
    // ✅ FIX: Using Upsert instead of Insert/Update manually
    // This handles both new entries and updates based on 'city_name'
    const { error } = await supabase.from('city_stats').upsert(
      {
        city_name: cityForm.city_name,
        events_count: cityForm.events_count
      },
      { onConflict: 'city_name' }
    );

    if (error) {
        console.error("City Update Error:", error);
        toast.error("Failed to update city");
    } else {
      toast.success("City updated! 🏙️");
      setEditingCity(null);
      // Realtime will auto-update, but we fetch manually for instant feel
      fetchData();
    }
  };

  const filteredStats = stats.filter(week =>
    week.week_label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentWeek = stats.length > 0 ? stats[stats.length - 1] : null;

  const targetTotalLive = targetStats
    ? (targetStats.events + targetStats.smart_reach + targetStats.sponsored + targetStats.seasonal + targetStats.affiliate + targetStats.ugc + targetStats.mini_articles)
    : 0;

  // Palette mapped to our light design system:
  // Events → pink · Smart Reach → green · Sponsored → amber · Seasonal → violet
  // Affiliate → cyan · UGC → pink-600 · Mini Articles → red
  const metricsConfig = [
    { label: "Events", key: "events", color: "#ff3d7f" },
    { label: "Smart Reach", key: "smart_reach", color: "#12bd8a" },
    { label: "Sponsored Posts", key: "sponsored", color: "#d97706" },
    { label: "Seasonal Active", key: "seasonal", color: "#7c3aed" },
    { label: "Affiliate Active", key: "affiliate", color: "#0e7490" },
    { label: "UGC Triggers", key: "ugc", color: "#e91e69" },
    { label: "Mini Articles", key: "mini_articles", color: "#e11d48" },
  ];

  const ageColumns = [
    { key: 'age_0_2', label: '0-2' },
    { key: 'age_3_5', label: '3-5' },
    { key: 'age_6_8', label: '6-8' },
    { key: 'age_9_12', label: '9-12' },
    { key: 'age_13_15', label: '13-15' },
    { key: 'age_16_18', label: '16-18' },
    { key: 'age_adult', label: 'Adult' },
  ];

  const columnTotals = ageColumns.reduce((acc, col) => {
    acc[col.key] = categoryStats.reduce((sum, cat) => sum + (cat[col.key] || 0), 0);
    return acc;
  }, {});
  const grandTotal = Object.values(columnTotals).reduce((a, b) => a + b, 0);

  // Total City Events Calculation
  const totalCityEvents = cityStats.reduce((sum, city) => sum + (city.events_count || 0), 0);

  if (loading) return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 pt-24 pb-16">
      <div className="card flex items-center justify-center py-24" style={{ color: "var(--muted)" }}>
        <Loader2 className="animate-spin mr-2" /> Loading Stats...
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 pt-24 pb-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl mb-2 flex items-center gap-3" style={{ color: "var(--ink)" }}>
          <span className="grad-text">Content Engine Stats</span>
          <span className="text-4xl">🚀</span>
        </h1>
        <p style={{ color: "var(--muted)" }}>Track 7 key metrics, growth history, and total live content.</p>
      </div>

      {/* Overview Cards */}
      {currentWeek && targetStats && (
        <div className="mb-16">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-2xl flex items-center gap-2" style={{ color: "var(--ink)" }}>
              📊 This Week Overview: <span style={{ color: "var(--green)" }}>{currentWeek.week_label}</span>
            </h2>
            {user && (
               <button onClick={() => handleQuickEdit(currentWeek)} className="btn btn-outline text-xs">
                 <Edit3 className="w-3 h-3"/> Quick Edit
               </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {metricsConfig.map((metric) => {
              const currentVal = currentWeek[metric.key] || 0;
              const targetVal = targetStats[metric.key] || 0;
              const status = getStatus(currentVal, targetVal);
              const StatusIcon = status.icon;

              return (
                <motion.div key={metric.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card card-hover p-5 relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-sm font-medium" style={{ color: "var(--muted)" }}>{metric.label}</h3>
                    <div className="px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1 border" style={status.style}>
                      <StatusIcon className="w-3 h-3" /> <span>{status.label}</span>
                      <span className="filter-none grayscale-0">{status.emoji}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl" style={{ color: "var(--ink)" }}>{currentVal}</span>
                    <span className="text-xs" style={{ color: "var(--faint)" }}>/ {targetVal}</span>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--bg-tint)" }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((currentVal / (targetVal || 1)) * 100, 100)}%`, backgroundColor: metric.color }} />
                  </div>
                </motion.div>
              );
            })}

            <div className="card p-5 flex flex-col justify-center items-center" style={{ background: "var(--grad-soft)", borderColor: "var(--line-2)" }}>
               <h3 className="text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Total Live Content</h3>
               <span className="font-display text-5xl grad-text">
                 {currentWeek.total_live}
               </span>
               <span className="text-xs mt-2 font-bold" style={{ color: "var(--green)" }}>Aggregate of all 7 metrics</span>
            </div>
          </div>
        </div>
      )}

      {/* Graphical History */}
      <div className="card mb-16 p-6">
        <h2 className="font-display text-xl mb-6" style={{ color: "var(--ink)" }}>📈 Growth History (All Metrics + Total Live)</h2>
        <div className="h-[400px] w-full">
          {stats.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm" style={{ color: "var(--muted)" }}>No weekly data yet.</div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ece7df" />
              <XAxis dataKey="week_label" stroke="#ece7df" tick={{ fontSize: 12, fill: "#8b8d98" }} />
              <YAxis stroke="#ece7df" tick={{ fontSize: 12, fill: "#8b8d98" }} domain={[0, 1500]} />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "rgba(12,13,17,0.12)", borderRadius: "12px", boxShadow: "0 10px 34px rgba(14,16,30,0.08)" }} itemStyle={{ fontSize: "12px" }} labelStyle={{ color: "#0c0d11", fontWeight: 600 }} />
              <Legend wrapperStyle={{ paddingTop: "20px" }}/>
              {metricsConfig.map((metric) => (
                <Line key={metric.key} type="monotone" dataKey={metric.key} stroke={metric.color} strokeWidth={2} dot={{r: 4, strokeWidth: 0}} activeDot={{r: 6}} name={metric.label} />
              ))}
              <Line type="monotone" dataKey="total_live" stroke="#0c0d11" strokeWidth={3} dot={{r: 4, strokeWidth: 0, fill: "#0c0d11"}} activeDot={{r: 7, stroke: "#8b8d98"}} name="Total Live" />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category & Age Stats */}
      <div className="mb-16">
         <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>🧩 Category & Age Distribution</h2>
            <span className="chip" style={{ background: "var(--violet-bg)", color: "var(--violet)" }}>Live Status</span>
         </div>

         <div className="card overflow-x-auto p-0">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--bg-tint)", color: "var(--muted)" }}>
                 <th className="p-4 w-[200px]" style={{ borderBottom: "1px solid var(--line)" }}>Category</th>
                 {ageColumns.map(col => (
                    <th key={col.key} className="p-4 text-center" style={{ borderBottom: "1px solid var(--line)" }}>{col.label}</th>
                 ))}
                 <th className="p-4 text-center font-bold" style={{ borderBottom: "1px solid var(--line)", background: "var(--pinkbg)", color: "var(--ink)" }}>Total</th>
                 {user && <th className="p-4 text-right" style={{ borderBottom: "1px solid var(--line)" }}>Edit</th>}
               </tr>
             </thead>
             <tbody className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>
               {categoryStats.map((cat) => {
                 const rowTotal = ageColumns.reduce((sum, col) => sum + (cat[col.key] || 0), 0);
                 const isEditing = editingCategory === cat.id;

                 return (
                   <tr key={cat.id} className="transition-colors hover:bg-[var(--bg-tint)]" style={{ borderBottom: "1px solid var(--line)" }}>
                     <td className="p-4 font-bold" style={{ color: "var(--ink)" }}>{cat.category}</td>

                     {ageColumns.map(col => (
                       <td key={col.key} className="p-2 text-center">
                         {isEditing ? (
                           <input
                             type="number"
                             value={categoryForm[col.key] || 0}
                             onChange={(e) => setCategoryForm({...categoryForm, [col.key]: parseInt(e.target.value) || 0})}
                             className="field-input w-16 px-2 py-1 text-center"
                           />
                         ) : (
                           <span style={{ color: cat[col.key] > 0 ? "var(--violet)" : "var(--faint)" }}>{cat[col.key] || 0}</span>
                         )}
                       </td>
                     ))}

                     <td className="p-4 text-center font-bold" style={{ background: "var(--pinkbg)", color: "var(--ink)" }}>
                        {isEditing
                          ? ageColumns.reduce((sum, col) => sum + (categoryForm[col.key] || 0), 0)
                          : rowTotal
                        }
                     </td>

                     {user && (
                       <td className="p-4 text-right">
                         {isEditing ? (
                           <div className="flex justify-end gap-2">
                             <button onClick={handleSaveCategory} className="p-2 rounded-lg" style={{ background: "var(--greenbg)", color: "var(--green)" }}><Save className="w-4 h-4"/></button>
                             <button onClick={() => setEditingCategory(null)} className="p-2 rounded-lg" style={{ background: "var(--red-bg)", color: "var(--red)" }}><X className="w-4 h-4"/></button>
                           </div>
                         ) : (
                           <button onClick={() => handleEditCategory(cat)} className="p-2 rounded-lg transition-colors hover:bg-[var(--violet-bg)]" style={{ color: "var(--muted)" }}>
                             <Edit3 className="w-4 h-4"/>
                           </button>
                         )}
                       </td>
                     )}
                   </tr>
                 );
               })}

               {/* Grand Total Row */}
               <tr className="font-bold" style={{ background: "var(--greenbg)", borderTop: "2px solid rgba(18,189,138,0.3)", color: "var(--green)" }}>
                 <td className="p-4 uppercase tracking-wider text-sm">Grand Total</td>
                 {ageColumns.map(col => (
                   <td key={col.key} className="p-4 text-center text-lg">{columnTotals[col.key]}</td>
                 ))}
                 <td className="p-4 text-center text-xl" style={{ background: "rgba(18,189,138,0.16)", color: "var(--ink)", borderLeft: "1px solid rgba(18,189,138,0.3)" }}>
                   {grandTotal}
                 </td>
                 {user && <td></td>}
               </tr>

             </tbody>
           </table>
         </div>
      </div>

      {/* Detailed Weekly Data Table */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
          <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>📋 Detailed Weekly Data</h2>
          <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--faint)" }} />
                <input type="text" placeholder="Search Week..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="field-input w-full py-2 pl-10 pr-4 text-sm" />
             </div>
             {user && targetStats && <button onClick={() => handleEdit(targetStats)} className="btn btn-outline text-sm">Set Targets</button>}
             {user && <button onClick={handleAddNewWeek} className="btn btn-primary text-sm">+ Add New Week</button>}
          </div>
        </div>

        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--bg-tint)", color: "var(--muted)" }}>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)" }}>Week</th>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)" }}>Events</th>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)" }}>Smart Reach</th>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)" }}>Sponsored</th>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)" }}>Seasonal</th>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)" }}>Affiliate</th>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)" }}>UGC</th>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)", color: "var(--red)" }}>Mini Art.</th>
                <th className="p-4" style={{ borderBottom: "1px solid var(--line)", background: "var(--pinkbg)" }}>Total Live</th>
                {user && <th className="p-4 text-right" style={{ borderBottom: "1px solid var(--line)" }}>Actions</th>}
              </tr>
            </thead>
            <tbody className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>
              {targetStats && (
                <tr className="font-bold" style={{ background: "var(--bg-tint)", color: "var(--green)", borderBottom: "1px solid var(--line)" }}>
                  <td className="p-4">🎯 TARGETS</td>
                  {editingId === targetStats.id ? <EditFields form={editForm} setForm={setEditForm} /> : <DisplayRow data={targetStats} />}
                  <td className="p-4 font-bold text-lg" style={{ background: "var(--pinkbg)", color: "var(--ink)" }}>{targetTotalLive}</td>
                  {user && (
                    <td className="p-4 text-right">
                      {editingId === targetStats.id ? <ActionButtons onSave={() => handleSave(false)} onCancel={() => setEditingId(null)} /> : <button onClick={() => handleEdit(targetStats)} className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tint)]" style={{ color: "var(--muted)" }}><Edit3 className="w-4 h-4"/></button>}
                    </td>
                  )}
                </tr>
              )}
              {filteredStats.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-[var(--bg-tint)]" style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="p-4" style={{ color: "var(--muted)" }}>{row.week_label}</td>
                  {editingId === row.id ? <EditFields form={editForm} setForm={setEditForm} /> : <DisplayRow data={row} />}
                  <td className="p-4 font-bold" style={{ background: "var(--pinkbg)", color: "var(--ink)" }}>{row.total_live}</td>
                  {user && (
                    <td className="p-4 text-right">
                      {editingId === row.id ? <ActionButtons onSave={() => handleSave(false)} onCancel={() => setEditingId(null)} /> : (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(row)} className="p-2 rounded-lg transition-colors hover:bg-[var(--blue-bg)]" style={{ color: "var(--muted)" }}><Edit3 className="w-4 h-4"/></button>
                          <button onClick={() => handleDelete(row.id)} className="p-2 rounded-lg transition-colors hover:bg-[var(--red-bg)]" style={{ color: "var(--muted)" }}><Trash2 className="w-4 h-4"/></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------- NEW: City Wise Events Section ----------- */}
      <div>
         <div className="flex items-center gap-3 mb-6">
            <h2 className="font-display text-xl flex items-center gap-2" style={{ color: "var(--ink)" }}>
                <MapPin className="w-5 h-5" style={{ color: "var(--blue)" }}/> 🌍 City Wise Events Breakdown
            </h2>
            <div className="chip" style={{ background: "var(--blue-bg)", color: "var(--blue)" }}>
                Total City Events: {totalCityEvents}
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cityStats.map((city) => {
                const isEditing = editingCity === city.city_name;
                return (
                    <div key={city.city_name} className="card card-hover p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ background: city.events_count > 0 ? "var(--green)" : "var(--faint)" }} />
                            <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>{city.city_name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <input
                                    type="number"
                                    autoFocus
                                    value={cityForm.events_count || 0}
                                    onChange={(e) => setCityForm({...cityForm, events_count: parseInt(e.target.value) || 0})}
                                    className="field-input w-16 px-2 py-1 text-right text-sm"
                                />
                            ) : (
                                <span className="font-bold text-lg" style={{ color: city.events_count > 0 ? "var(--ink)" : "var(--faint)" }}>
                                    {city.events_count}
                                </span>
                            )}

                            {user && (
                                isEditing ? (
                                    <div className="flex gap-1">
                                        <button onClick={handleSaveCity} className="p-1.5 rounded" style={{ background: "var(--greenbg)", color: "var(--green)" }}><Save className="w-3 h-3"/></button>
                                        <button onClick={() => setEditingCity(null)} className="p-1.5 rounded" style={{ background: "var(--slate-bg)", color: "var(--slate)" }}><X className="w-3 h-3"/></button>
                                    </div>
                                ) : (
                                    <button onClick={() => handleEditCity(city)} className="p-1.5 rounded transition-colors hover:bg-[var(--blue-bg)]" style={{ color: "var(--muted)" }}>
                                        <Edit3 className="w-3.5 h-3.5"/>
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                );
            })}
         </div>
      </div>

      <AnimatePresence>
        {isQuickEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,13,17,0.4)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card p-6 w-full max-w-2xl" style={{ boxShadow: "var(--shadow-lg)" }}>
              <div className="flex justify-between items-center mb-6 pb-4" style={{ borderBottom: "1px solid var(--line)" }}>
                <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>Quick Edit: <span style={{ color: "var(--green)" }}>{editForm.week_label}</span></h2>
                <button onClick={() => setIsQuickEditOpen(false)} className="transition-colors" style={{ color: "var(--muted)" }}><X className="w-5 h-5"/></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {metricsConfig.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <label className="field-label uppercase">{field.label}</label>
                    <input type="number" value={editForm[field.key] || 0} onChange={(e) => setEditForm({ ...editForm, [field.key]: parseInt(e.target.value) || 0 })} className="field-input w-full p-3" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsQuickEditOpen(false)} className="btn btn-ghost">Cancel</button>
                <button onClick={() => handleSave(true)} className="btn btn-primary"><Save className="w-4 h-4"/> Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DisplayRow({ data }) {
  return <>{["events", "smart_reach", "sponsored", "seasonal", "affiliate", "ugc"].map(k => <td key={k} className="p-4">{data[k]}</td>)}<td className="p-4" style={{ color: "var(--red)" }}>{data.mini_articles}</td></>;
}
function EditFields({ form, setForm }) {
  const handleChange = (e) => setForm({ ...form, [e.target.name]: parseInt(e.target.value) || 0 });
  return <>{["events", "smart_reach", "sponsored", "seasonal", "affiliate", "ugc", "mini_articles"].map(field => (<td key={field} className="p-2"><input name={field} value={form[field]} onChange={handleChange} className="field-input w-16 px-2 py-1 text-center"/></td>))}</>;
}
function ActionButtons({ onSave, onCancel }) {
  return <div className="flex justify-end gap-2"><button onClick={onSave} className="p-2 rounded-lg" style={{ background: "var(--greenbg)", color: "var(--green)" }}><Save className="w-4 h-4"/></button><button onClick={onCancel} className="p-2 rounded-lg" style={{ background: "var(--red-bg)", color: "var(--red)" }}><X className="w-4 h-4"/></button></div>;
}
