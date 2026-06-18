"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Database, Sparkles, X, Loader2, Save, Link as LinkIcon, Copy, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase/browser";
import CityCard from "@/components/famevent/CityCard";

export default function FamEventPage() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCityId, setActiveCityId] = useState(null);
  const [user, setUser] = useState(null);

  // Editing State
  const [editingLink, setEditingLink] = useState(null);
  const [editLinkTitle, setEditLinkTitle] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");

  // Inputs for Adding
  const [newCityName, setNewCityName] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // User and data load
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchCities();

    const channel = supabase
      .channel('realtime-famevent')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, fetchCities)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'links' }, fetchCities)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  const fetchCities = async () => {
    try {
      const { data: citiesData } = await supabase.from('cities').select('*').order('created_at', { ascending: false });
      if (citiesData) {
        const { data: linksData } = await supabase.from('links').select('*');
        const combinedData = citiesData.map(city => ({
          ...city,
          links: linksData?.filter(link => link.city_id === city.id) || []
        }));
        setCities(combinedData);
      } else {
        setCities([]);
      }
    } catch (e) {
      setCities([]);
    }
    setLoading(false);
  };

  // SECURITY CHECK
  const checkAuth = (actionMessage) => {
    if (!user) {
      toast.error(actionMessage, {
        style: { borderRadius: '10px', background: 'var(--ink)', color: '#fff' },
        icon: '🔒',
      });
      return false;
    }
    return true;
  };

  // --- Actions ---

  const handleAddCity = async () => {
    if (!checkAuth("Login to add a new city")) return;
    if (!newCityName || !newCountry) return toast.error("Please fill all fields");

    const { error } = await supabase.from('cities').insert([{ name: newCityName, country: newCountry }]);
    if (error) toast.error("Failed to add city");
    else {
      toast.success("City added successfully!");
      setNewCityName(""); setNewCountry(""); setIsModalOpen(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLinkTitle || !newLinkUrl) return toast.error("Please fill all fields");
    const { error } = await supabase.from('links').insert([{ city_id: activeCityId, title: newLinkTitle, url: newLinkUrl }]);
    if (error) toast.error("Failed to add link");
    else {
      toast.success("Link added successfully!");
      setNewLinkTitle(""); setNewLinkUrl(""); setActiveCityId(null);
    }
  };

  const openEditModal = (link) => {
    if (!checkAuth("Login to edit links")) return;
    setEditingLink(link);
    setEditLinkTitle(link.title);
    setEditLinkUrl(link.url);
  };

  const handleUpdateLink = async () => {
    if (!editLinkTitle || !editLinkUrl) return toast.error("Fields cannot be empty");

    const { error } = await supabase
      .from('links')
      .update({ title: editLinkTitle, url: editLinkUrl })
      .eq('id', editingLink.id);

    if (error) toast.error("Failed to update link");
    else {
      toast.success("Link updated successfully!");
      setEditingLink(null);
    }
  };

  const deleteCity = async (id) => {
    if (!checkAuth("Login to delete this city")) return;
    if (!confirm("Are you sure?")) return;

    const { error } = await supabase.from('cities').delete().eq('id', id);
    if (error) toast.error("Error deleting city");
    else toast.success("City deleted");
  };

  const deleteLink = async (linkId) => {
    if (!checkAuth("Login to remove this link")) return;

    const { error } = await supabase.from('links').delete().eq('id', linkId);
    if (error) toast.error("Error deleting link");
    else toast.success("Link removed");
  };

  // Copy All Links Function
  const handleCopyAllLinks = (links) => {
    if (!links || links.length === 0) return toast.error("No links to copy");

    const allLinksText = links.map(link => link.url).join("\n");
    navigator.clipboard.writeText(allLinksText);
    toast.success(`${links.length} Links Copied! 📋`);
  };

  // Calculation: total number of links
  const totalLinks = cities.reduce((acc, city) => acc + (city.links?.length || 0), 0);

  const filteredCities = cities.filter(city =>
    city.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-24 pb-16">
      {/* Header Section */}
      <div className="relative pb-10 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto space-y-4"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
            style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)', border: '1px solid var(--line-2)' }}
          >
            <Sparkles className="w-4 h-4" /> Global Event Research Tool
          </div>
          <h1 className="font-display grad-text text-4xl md:text-5xl">
            Find Events Anywhere
          </h1>
          <p className="text-lg" style={{ color: 'var(--muted)' }}>
            Real-time global event tracking. Login to contribute.
          </p>
        </motion.div>
      </div>

      {/* Controls Bar */}
      <div className="mb-10">
        <div className="glass p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4" style={{ color: 'var(--ink-2)' }}>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" style={{ color: 'var(--green)' }} />
              <span className="text-sm">Global DB Active</span>
            </div>
            <div className="h-4 w-[1px]" style={{ background: 'var(--line-2)' }} />

            <span className="text-sm flex items-center gap-1">
              <span className="font-bold" style={{ color: 'var(--ink)' }}>{cities.length}</span> Cities Tracked
              <span className="mx-1" style={{ color: 'var(--faint)' }}>•</span>
              <span className="font-bold" style={{ color: 'var(--ink)' }}>{totalLinks}</span> Total Links
            </span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--faint)' }} />
              <input
                type="text"
                placeholder="Search cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="field-input w-full py-2 pl-10 pr-4 text-sm"
              />
            </div>
            <button
              onClick={() => {
                if (checkAuth("Login to add a new city")) setIsModalOpen(true);
              }}
              className="btn btn-primary px-4 py-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add City
            </button>
          </div>
        </div>
      </div>

      {/* Cities Grid */}
      <div>
        {loading ? (
            <div className="flex justify-center py-20" style={{ color: 'var(--faint)' }}>
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        ) : filteredCities.length === 0 ? (
            <div className="card flex flex-col items-center justify-center text-center py-20 px-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)' }}
                >
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="font-display text-xl mb-1" style={{ color: 'var(--ink)' }}>
                  {searchTerm ? "No cities match your search" : "No cities tracked yet"}
                </h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {searchTerm ? "Try a different city or country." : "Login and add the first city to start tracking events."}
                </p>
            </div>
        ) : (
            <AnimatePresence mode="popLayout">
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCities.map((city) => (
                    <CityCard
                        key={city.id}
                        city={city}
                        links={city.links || []}
                        onAddLink={(id) => {
                             if (checkAuth("Login to add links")) setActiveCityId(id);
                        }}
                        onDeleteCity={deleteCity}
                        onDeleteLink={deleteLink}
                        onEditLink={openEditModal}
                        user={user}
                        // PASSING THE COPY FUNCTION
                        onCopyAll={() => handleCopyAllLinks(city.links)}
                    />
                  ))}
              </motion.div>
            </AnimatePresence>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Add City Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(12, 13, 17, 0.35)', backdropFilter: 'blur(4px)' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 rounded-2xl w-full max-w-md" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Add New City</h2>
              <button onClick={() => setIsModalOpen(false)} className="btn-ghost rounded-lg p-1"><X style={{ color: 'var(--muted)' }} /></button>
            </div>
            <input
              placeholder="City Name"
              className="field-input w-full mb-3"
              value={newCityName} onChange={e => setNewCityName(e.target.value)}
            />
            <input
              placeholder="Country"
              className="field-input w-full mb-6"
              value={newCountry} onChange={e => setNewCountry(e.target.value)}
            />
            <button onClick={handleAddCity} className="btn btn-primary w-full py-3">Add City</button>
          </motion.div>
        </div>
      )}

      {/* 2. Add Link Modal */}
      {activeCityId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(12, 13, 17, 0.35)', backdropFilter: 'blur(4px)' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 rounded-2xl w-full max-w-md" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex justify-between items-center mb-4">
               <h2 className="font-display text-xl" style={{ color: 'var(--ink)' }}>Add Link</h2>
               <button onClick={() => setActiveCityId(null)} className="btn-ghost rounded-lg p-1"><X style={{ color: 'var(--muted)' }} /></button>
            </div>
            <input
              placeholder="Title"
              className="field-input w-full mb-3"
              value={newLinkTitle} onChange={e => setNewLinkTitle(e.target.value)}
            />
            <input
              placeholder="URL"
              className="field-input w-full mb-6"
              value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setActiveCityId(null)} className="btn btn-outline flex-1 py-2">Cancel</button>
              <button onClick={handleAddLink} className="btn btn-green flex-1 py-2">Save</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Edit Link Modal */}
      {editingLink && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(12, 13, 17, 0.35)', backdropFilter: 'blur(4px)' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 rounded-2xl w-full max-w-md" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex justify-between items-center mb-4">
               <h2 className="font-display text-xl flex items-center gap-2" style={{ color: 'var(--ink)' }}>
                 <Sparkles className="w-5 h-5" style={{ color: 'var(--amber)' }} /> Edit Link
               </h2>
               <button onClick={() => setEditingLink(null)} className="btn-ghost rounded-lg p-1"><X style={{ color: 'var(--muted)' }} /></button>
            </div>

            <label className="field-label uppercase">Link Title</label>
            <input
              placeholder="Title"
              className="field-input w-full mb-4"
              value={editLinkTitle} onChange={e => setEditLinkTitle(e.target.value)}
            />

            <label className="field-label uppercase">URL Address</label>
            <input
              placeholder="URL"
              className="field-input mono w-full mb-6 text-sm"
              value={editLinkUrl} onChange={e => setEditLinkUrl(e.target.value)}
            />

            <div className="flex gap-2">
              <button onClick={() => setEditingLink(null)} className="btn btn-outline flex-1 py-3 text-sm">Cancel</button>
              <button onClick={handleUpdateLink} className="btn btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Update
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
