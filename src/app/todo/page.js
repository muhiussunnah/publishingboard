"use client";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase/browser";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Calendar, User, Trash2, Edit3, CheckCircle2,
  ArrowRight, ArrowLeft, Clock, AlertCircle, X, Save, Loader2,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import clsx from "clsx";

export default function TodoPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "", assignee: "", due_date: "", priority: "medium"
  });

  // 1. Load data + check user
  const fetchData = async () => {
    const { data } = await supabase.from('todos').select('*').order('due_date', { ascending: true });
    if (data) setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();
    fetchData();

    const channel = supabase.channel('todos-update')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // --- CALCULATIONS FOR DASHBOARD ---
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const ongoing = tasks.filter(t => t.status !== 'completed').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    // Date Logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdue = 0;
    let due7 = 0;
    let due14 = 0;

    tasks.forEach(t => {
      if (t.status !== 'completed' && t.due_date) {
        const due = new Date(t.due_date);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) overdue++;
        else if (diffDays <= 7) due7++;
        else if (diffDays <= 14) due14++;
      }
    });

    // Chart Data — on-brand palette (pink / green / amber)
    const priorityData = [
      { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#ff3d7f' }, // Pink
      { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#c2410c' }, // Amber
      { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#12bd8a' }, // Green
    ];

    const statusData = [
      { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length, color: '#8b8d98' },
      { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: '#c2410c' },
      { name: 'Done', value: tasks.filter(t => t.status === 'completed').length, color: '#12bd8a' },
    ];

    const upcoming = tasks
      .filter(t => t.status !== 'completed' && t.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);

    return { total, completed, ongoing, progress, overdue, due7, due14, priorityData, statusData, upcoming };
  }, [tasks]);


  // --- Actions ---
  const checkAuth = () => {
    if (!user) {
      toast.error("Login required for this action 🔒");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!checkAuth()) return;
    if (!formData.title || !formData.assignee) return toast.error("Task name and Assignee required");

    let error;
    if (editingTask) {
      const { error: err } = await supabase.from('todos').update(formData).eq('id', editingTask.id);
      error = err;
      toast.success("Task updated!");
    } else {
      const { error: err } = await supabase.from('todos').insert([{ ...formData, status: 'todo' }]);
      error = err;
      toast.success("New task assigned!");
    }

    if (error) toast.error("Something went wrong");
    else {
      setIsModalOpen(false);
      setEditingTask(null);
      setFormData({ title: "", assignee: "", due_date: "", priority: "medium" });
    }
  };

  const moveTask = async (task, direction) => {
    if (!checkAuth()) return;
    const statusOrder = ['todo', 'in_progress', 'completed'];
    const currentIndex = statusOrder.indexOf(task.status);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < statusOrder.length) {
      const newStatus = statusOrder[newIndex];
      await supabase.from('todos').update({ status: newStatus }).eq('id', task.id);
      if (newStatus === 'completed') toast.success("Task Completed! 🎉");
    }
  };

  const handleDelete = async (id) => {
    if (!checkAuth()) return;
    if (!confirm("Delete this completed task?")) return;
    await supabase.from('todos').delete().eq('id', id);
    toast.success("Task deleted");
  };

  const openEditModal = (task) => {
    if (!checkAuth()) return;
    setEditingTask(task);
    setFormData({ title: task.title, assignee: task.assignee, due_date: task.due_date, priority: task.priority });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-24 pb-16">
        <div className="flex items-center justify-center py-32" style={{ color: 'var(--muted)' }}>
          <Loader2 className="animate-spin mr-2" /> Loading Board...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 pt-24 pb-16">

      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl mb-1" style={{ color: 'var(--ink)' }}>
            Task <span className="grad-text">Tracker</span>
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Visualize progress, manage deadlines, and execute.</p>
        </div>
        <button
          onClick={() => {
            if (checkAuth()) {
              setEditingTask(null);
              setFormData({ title: "", assignee: "", due_date: "", priority: "medium" });
              setIsModalOpen(true);
            }
          }}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5" /> New Task
        </button>
      </div>

      {/* 2. Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Total Tasks" value={stats.total} color="var(--ink)" />
        <KpiCard label="Ongoing" value={stats.ongoing} color="var(--pink)" />
        <KpiCard label="Completed" value={stats.completed} color="var(--green)" />
        <KpiCard label="Overdue" value={stats.overdue} color="var(--red)" />
        <KpiCard label="Due in 7 Days" value={stats.due7} color="var(--amber)" />
        <KpiCard label="Due in 14 Days" value={stats.due14} color="var(--violet)" />
      </div>

      {/* 3. Graphical Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">

        {/* Upcoming Deadlines */}
        <div className="card p-5 col-span-1">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-wider" style={{ color: 'var(--ink-2)' }}>
            <Calendar className="w-4 h-4" style={{ color: 'var(--pink)' }} /> Upcoming Deadlines
          </h3>
          <div className="space-y-3">
            {stats.upcoming.length === 0 ? <p className="text-xs italic" style={{ color: 'var(--muted)' }}>No upcoming deadlines.</p> :
              stats.upcoming.map(task => (
                <div key={task.id} className="flex justify-between items-center text-sm pb-2 last:border-0" style={{ borderBottom: '1px solid var(--line)' }}>
                  <span className="truncate max-w-[150px]" style={{ color: 'var(--ink-2)' }}>{task.title}</span>
                  <span className="mono text-xs" style={{ color: 'var(--pink-600)' }}>{task.due_date}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Progress Circle & Status */}
        <div className="card p-5 col-span-1 flex flex-col md:flex-row items-center justify-around gap-4">
          <div className="text-center">
            <h3 className="text-xs uppercase font-bold mb-3" style={{ color: 'var(--muted)' }}>Overall Progress</h3>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" strokeWidth="12" fill="transparent" stroke="var(--line-2)" />
                <circle cx="64" cy="64" r="56" strokeWidth="12" fill="transparent" stroke="var(--green)" className="transition-all duration-1000 ease-out" strokeDasharray={351} strokeDashoffset={351 - (351 * stats.progress) / 100} strokeLinecap="round" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>{stats.progress}%</span>
              </div>
            </div>
          </div>

          <div className="h-40 w-40">
            <h3 className="text-xs uppercase font-bold text-center mb-1" style={{ color: 'var(--muted)' }}>Status Split</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.statusData} innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value">
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'var(--line-2)', borderRadius: '8px', color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' }}
                  itemStyle={{ color: 'var(--ink)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="card p-5 col-span-1">
          <h3 className="text-xs uppercase font-bold mb-2" style={{ color: 'var(--muted)' }}>Priority Breakdown</h3>
          <div className="h-48 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.priorityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={50} tick={{ fill: 'var(--ink-2)', fontSize: 11, fontWeight: 600 }} />

                <Tooltip
                  cursor={{ fill: 'rgba(12,13,17,0.04)' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: 'var(--line-2)', borderRadius: '8px', color: 'var(--ink)', boxShadow: 'var(--shadow-sm)' }}
                  itemStyle={{ color: 'var(--ink)', fontWeight: 'bold' }}
                />

                <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                  {stats.priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 4. Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaskColumn title="Assigned Tasks" count={tasks.filter(t => t.status === 'todo').length} dotColor="var(--slate)" icon={AlertCircle}>
          {tasks.filter(t => t.status === 'todo').map(task => <TaskCard key={task.id} task={task} onMove={moveTask} onEdit={openEditModal} onDelete={handleDelete} />)}
          {tasks.filter(t => t.status === 'todo').length === 0 && <EmptyState text="No pending tasks" />}
        </TaskColumn>

        <TaskColumn title="In Progress" count={tasks.filter(t => t.status === 'in_progress').length} dotColor="var(--amber)" icon={Clock}>
          {tasks.filter(t => t.status === 'in_progress').map(task => <TaskCard key={task.id} task={task} onMove={moveTask} onEdit={openEditModal} onDelete={handleDelete} />)}
          {tasks.filter(t => t.status === 'in_progress').length === 0 && <EmptyState text="Team is idle" />}
        </TaskColumn>

        <TaskColumn title="Completed" count={tasks.filter(t => t.status === 'completed').length} dotColor="var(--green)" icon={CheckCircle2}>
          {tasks.filter(t => t.status === 'completed').map(task => <TaskCard key={task.id} task={task} onMove={moveTask} onEdit={openEditModal} onDelete={handleDelete} isCompleted />)}
          {tasks.filter(t => t.status === 'completed').length === 0 && <EmptyState text="No finished tasks" />}
        </TaskColumn>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(12,13,17,0.45)', backdropFilter: 'blur(4px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card p-8 w-full max-w-lg relative" style={{ boxShadow: 'var(--shadow-lg)' }}>
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 transition-colors" style={{ color: 'var(--muted)' }}><X /></button>
              <h2 className="font-display text-2xl mb-6" style={{ color: 'var(--ink)' }}>{editingTask ? "Edit Task" : "Assign New Task"}</h2>
              <div className="space-y-4">
                <div>
                  <label className="field-label">Task Name</label>
                  <input className="field-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Assign To</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--faint)' }} />
                      <input className="field-input pl-10" value={formData.assignee} onChange={e => setFormData({ ...formData, assignee: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Due Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4" style={{ color: 'var(--faint)' }} />
                      <input type="date" className="field-input pl-10" value={formData.due_date} onChange={e => setFormData({ ...formData, due_date: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="field-label">Priority</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(p => {
                      const active = formData.priority === p;
                      const tint = p === 'high'
                        ? { bg: 'var(--red-bg)', border: 'var(--red)', text: 'var(--red)' }
                        : p === 'medium'
                          ? { bg: 'var(--amber-bg)', border: 'var(--amber)', text: 'var(--amber)' }
                          : { bg: 'var(--greenbg)', border: 'var(--green)', text: 'var(--green)' };
                      return (
                        <button
                          key={p}
                          onClick={() => setFormData({ ...formData, priority: p })}
                          className="flex-1 py-2 rounded-lg text-sm font-bold uppercase border transition-all"
                          style={active
                            ? { background: tint.bg, borderColor: tint.border, color: tint.text }
                            : { background: 'var(--bg-tint)', borderColor: 'var(--line)', color: 'var(--muted)' }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={handleSave} className="btn btn-primary w-full mt-4 py-3"><Save className="w-5 h-5" /> Save Task</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Small Components
function KpiCard({ label, value, color }) {
  return (
    <div className="card card-hover p-4 text-center">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-bold mt-1" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

function TaskColumn({ title, count, children, dotColor, icon: Icon }) {
  return (
    <div className="card p-4 flex flex-col h-full min-h-[500px]" style={{ background: 'var(--bg-tint)' }}>
      <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: dotColor }}><Icon className="w-5 h-5" /></div>
          <h3 className="font-display text-lg" style={{ color: 'var(--ink)' }}>{title}</h3>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--muted)' }}>{count}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1"><AnimatePresence mode="popLayout">{children}</AnimatePresence></div>
    </div>
  );
}

function TaskCard({ task, onMove, onEdit, onDelete, isCompleted }) {
  const priorityStyles = {
    high: { color: 'var(--red)', borderColor: 'var(--red)', background: 'var(--red-bg)' },
    medium: { color: 'var(--amber)', borderColor: 'var(--amber)', background: 'var(--amber-bg)' },
    low: { color: 'var(--green)', borderColor: 'var(--green)', background: 'var(--greenbg)' },
  };

  // DATE LOGIC FOR OVERDUE CHECK
  const isOverdue = task.due_date && new Date(task.due_date) < new Date().setHours(0, 0, 0, 0) && !isCompleted;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="card card-hover p-4 group relative">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {/* PULSING DOT if Overdue */}
          {isOverdue && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'var(--red)' }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--red)' }}></span>
            </span>
          )}

          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border" style={priorityStyles[task.priority]}>
            {task.priority}
          </span>
        </div>

        <button onClick={() => onEdit(task)} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }}><Edit3 className="w-3.5 h-3.5" /></button>
      </div>
      <h4 className="font-medium mb-3 leading-snug" style={{ color: 'var(--ink)' }}>{task.title}</h4>
      <div className="flex items-center justify-between text-xs mb-4" style={{ color: 'var(--muted)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--pinkbg)', color: 'var(--pink-600)', border: '1px solid var(--line)' }}>{task.assignee.charAt(0).toUpperCase()}</div>
          <span>{task.assignee}</span>
        </div>
        {task.due_date && (
          <div className="flex items-center gap-1" style={isOverdue ? { color: 'var(--red)', fontWeight: 700 } : undefined}>
            <Calendar className="w-3 h-3" /> {task.due_date}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--line)' }}>
        {task.status !== 'todo'
          ? (<button onClick={() => onMove(task, 'prev')} className="p-1.5 rounded transition-colors hover:bg-[var(--bg-tint)]" style={{ color: 'var(--muted)' }}><ArrowLeft className="w-4 h-4" /></button>)
          : <div />}
        {isCompleted && (<button onClick={() => onDelete(task.id)} className="p-1.5 rounded transition-colors hover:bg-[var(--red-bg)]" style={{ color: 'var(--muted)' }}><Trash2 className="w-4 h-4" /></button>)}
        {task.status !== 'completed'
          ? (<button onClick={() => onMove(task, 'next')} className="p-1.5 rounded transition-all" style={{ color: '#fff', background: 'var(--grad)' }}><ArrowRight className="w-4 h-4" /></button>)
          : <div />}
      </div>
    </motion.div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-10 rounded-xl" style={{ border: '2px dashed var(--line-2)' }}>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>{text}</p>
    </div>
  );
}
