import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, CircleHelp, ClipboardList, Command, FolderKanban, LayoutDashboard, LogOut, Menu, MoreHorizontal, Plus, Search, Settings2, Sparkles, Users, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "./api";
import "./style.css";

const demoProjects = [
  { id: "demo-1", name: "Website redesign", description: "Refresh the product experience", color: "#8b7cff", _count: { tasks: 12 }, tasks: [] },
  { id: "demo-2", name: "Mobile application", description: "Launch the companion app", color: "#36b8a0", _count: { tasks: 8 }, tasks: [] },
  { id: "demo-3", name: "Marketing launch", description: "Prepare the next campaign", color: "#e9a34d", _count: { tasks: 6 }, tasks: [] }
];
const demoTasks = [
  { id: "d1", title: "Review the new dashboard layout", status: "IN_PROGRESS", priority: "HIGH", project: { name: "Website redesign" }, dueDate: null },
  { id: "d2", title: "Prepare API integration notes", status: "TODO", priority: "MEDIUM", project: { name: "Mobile application" }, dueDate: null },
  { id: "d3", title: "Share launch checklist with team", status: "REVIEW", priority: "URGENT", project: { name: "Marketing launch" }, dueDate: null },
  { id: "d4", title: "Polish responsive navigation", status: "DONE", priority: "LOW", project: { name: "Website redesign" }, dueDate: null }
];
const columns = [{ key: "TODO", label: "To do" }, { key: "IN_PROGRESS", label: "In progress" }, { key: "REVIEW", label: "In review" }, { key: "DONE", label: "Completed" }];
const chartData = [{ day: "Mon", tasks: 5 }, { day: "Tue", tasks: 8 }, { day: "Wed", tasks: 6 }, { day: "Thu", tasks: 10 }, { day: "Fri", tasks: 7 }, { day: "Sat", tasks: 4 }, { day: "Sun", tasks: 9 }];

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("nexora_token"));
  const [projects, setProjects] = useState(demoProjects);
  const [tasks, setTasks] = useState(demoTasks);
  const [summary, setSummary] = useState({ projects: 3, tasks: 26, completed: 9, inProgress: 7, overdue: 2 });
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("Demo workspace loaded — connect the API to save your own data.");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    api.get("/auth/me").then(r => setUser(r.data.user)).catch(() => {
      localStorage.removeItem("nexora_token"); setToken(null); setUser(null);
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.get("/projects"), api.get("/tasks"), api.get("/dashboard/summary")])
      .then(([p, t, s]) => { setProjects(p.data.projects); setTasks(t.data.tasks); setSummary(s.data.summary); setNotice("Your workspace is synced."); })
      .catch(() => setNotice("API unavailable — showing sample workspace data."));
  }, [token]);

  const visibleTasks = useMemo(() => tasks.filter(t => (t.title + " " + (t.project?.name || "")).toLowerCase().includes(query.toLowerCase())), [tasks, query]);
  const greeting = user?.name?.split(" ")[0] || "there";

  async function authenticate(e) {
    e.preventDefault(); setLoading(true);
    const form = new FormData(e.currentTarget);
    const mode = form.get("mode");
    try {
      const { data } = await api.post("/auth/" + mode, { name: form.get("name"), email: form.get("email"), password: form.get("password") });
      localStorage.setItem("nexora_token", data.token); setToken(data.token); setUser(data.user); setModal("");
      setNotice("Welcome to Nexora, " + data.user.name + ".");
    } catch (err) { setNotice(err.response?.data?.message || "Could not sign in. Is the API running?"); }
    finally { setLoading(false); }
  }

  function logout() { localStorage.removeItem("nexora_token"); setToken(null); setUser(null); setNotice("Signed out. Demo workspace is available."); }
  async function createProject(e) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    const payload = { name: form.get("name"), description: form.get("description"), color: form.get("color") };
    try {
      if (token) { const { data } = await api.post("/projects", payload); setProjects(p => [data.project, ...p]); }
      else setProjects(p => [{ id: crypto.randomUUID(), ...payload, _count: { tasks: 0 }, tasks: [] }, ...p]);
      setModal(""); setNotice("Project created.");
    } catch (err) { setNotice(err.response?.data?.message || "Could not create project."); }
  }
  async function createTask(e) {
    e.preventDefault(); const form = new FormData(e.currentTarget);
    const payload = { title: form.get("title"), description: form.get("description"), projectId: form.get("projectId"), priority: form.get("priority") };
    try {
      if (token) { const { data } = await api.post("/tasks", payload); setTasks(t => [data.task, ...t]); }
      else setTasks(t => [{ id: crypto.randomUUID(), ...payload, status: "TODO", project: { name: projects.find(p => p.id === payload.projectId)?.name || "Project" } }, ...t]);
      setModal(""); setNotice("Task added to your board.");
    } catch (err) { setNotice(err.response?.data?.message || "Could not create task."); }
  }
  async function changeStatus(task, status) {
    try {
      if (token && !task.id.startsWith("d")) await api.patch("/tasks/" + task.id, { status });
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status } : t));
    } catch { setNotice("Could not update task status."); }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Command size={19}/></div><span>Nexora</span><span className="brand-dot">.</span></div>
      <div className="workspace-switch"><div className="workspace-avatar">N</div><div><strong>Nova Studio</strong><small>Free workspace</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      {[["Overview", LayoutDashboard], ["My tasks", ClipboardList], ["Projects", FolderKanban], ["Team", Users]].map(([label, Icon]) =>
        <button key={label} className={"nav-item " + (active === label ? "active" : "")} onClick={() => setActive(label)}><Icon size={17}/><span>{label}</span>{label === "My tasks" && <small>{tasks.length}</small>}</button>)}
      <div className="nav-label project-label">YOUR PROJECTS <button onClick={() => setModal("project")}><Plus size={14}/></button></div>
      {projects.map(p => <button key={p.id} className="project-link" onClick={() => { setActive("Projects"); setQuery(p.name); }}><i style={{ background: p.color }}/>{p.name}</button>)}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Sparkles size={16}/></div><strong>Make work flow.</strong><p>Bring your team and tasks together in one focused space.</p><button onClick={() => setNotice("Tip: create a project, then add tasks and move them across the board.")}>Explore tips <ArrowUpRight size={13}/></button></div><button className="nav-item"><Settings2 size={17}/>Settings</button><button className="nav-item"><CircleHelp size={17}/>Help center</button><div className="profile"><div className="profile-avatar">{user?.name?.[0]?.toUpperCase() || "G"}</div><div className="profile-text"><strong>{user?.name || "Guest user"}</strong><small>{user?.email || "Demo workspace"}</small></div>{user ? <button className="icon-button" title="Sign out" onClick={logout}><LogOut size={16}/></button> : <button className="text-button" onClick={() => setModal("auth")}>Sign in</button>}</div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{active}</strong></div><div className="top-actions"><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tasks and projects..."/><kbd>⌘ K</kbd></label><button className="icon-button notification"><Bell size={18}/><i/></button><div className="top-avatar">{user?.name?.[0]?.toUpperCase() || "G"}</div></div></header>
      <section className="content">
        <div className="welcome-row"><div><div className="eyebrow"><span/> YOUR TEAM, IN SYNC</div><h1>Good morning, {greeting} <span>✦</span></h1><p>Here's what's happening across your workspace today.</p></div><div className="welcome-actions"><button className="button secondary" onClick={() => setModal("project")}><Plus size={16}/> New project</button><button className="button primary" onClick={() => setModal("task")}><Plus size={16}/> Create task</button></div></div>
        <div className="notice"><Activity size={15}/>{notice}</div>
        <div className="stats-grid">
          {[["Active projects", summary.projects, FolderKanban, "+2 this month", "violet"], ["Total tasks", summary.tasks, ClipboardList, "+12% this week", "blue"], ["Completed", summary.completed, CheckCircle2, "On track", "green"], ["In progress", summary.inProgress, Activity, "Across all projects", "orange"]].map(([label, value, Icon, caption, color]) => <div className="stat-card" key={label}><div className="stat-top"><span>{label}</span><div className={"stat-icon " + color}><Icon size={17}/></div></div><div className="stat-value">{value}</div><div className="stat-caption"><span className="trend"><ArrowUpRight size={13}/>{caption}</span></div></div>)}
        </div>
        <div className="dashboard-grid">
          <section className="panel activity-panel"><div className="panel-heading"><div><h2>Workspace activity</h2><p>Task completion throughout the week</p></div><button className="select-button">This week <ChevronDown size={14}/></button></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} barSize={23}><CartesianGrid vertical={false} stroke="#282a38" strokeDasharray="3 5"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#85879b", fontSize: 12 }}/><YAxis hide/><Tooltip contentStyle={{ background: "#202231", border: "1px solid #343648", borderRadius: 10, color: "#fff" }}/><Bar dataKey="tasks" fill="#8b7cff" radius={[6,6,2,2]}/></BarChart></ResponsiveContainer></div></section>
          <section className="panel progress-panel"><div className="panel-heading"><div><h2>Task progress</h2><p>Your delivery snapshot</p></div><MoreHorizontal size={19}/></div><div className="progress-ring"><div><strong>{summary.tasks ? Math.round(summary.completed / summary.tasks * 100) : 0}%</strong><small>completed</small></div></div><div className="progress-legend"><span><i className="dot done"/>Completed <b>{summary.completed}</b></span><span><i className="dot doing"/>In progress <b>{summary.inProgress}</b></span><span><i className="dot todo"/>Remaining <b>{Math.max(0, summary.tasks - summary.completed - summary.inProgress)}</b></span></div></section>
        </div>
        <div className="section-heading"><div><h2>{active === "Projects" ? "Your projects" : active === "My tasks" ? "My tasks" : "Recent tasks"}</h2><p>Keep an eye on the details that move work forward.</p></div><button className="link-button" onClick={() => setActive("Projects")}>View all <ArrowUpRight size={14}/></button></div>
        {active === "Projects" ? <div className="projects-grid">{projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(p => <div className="project-card" key={p.id}><div className="project-card-top"><div className="project-symbol" style={{ background: p.color + "22", color: p.color }}><FolderKanban size={19}/></div><MoreHorizontal size={18}/></div><h3>{p.name}</h3><p>{p.description || "No description added yet."}</p><div className="project-card-footer"><span>{p._count?.tasks || 0} tasks</span><span className="mini-progress"><i style={{ width: "48%", background: p.color }}/></span></div></div>)}</div> : <section className="panel task-table"><div className="table-head"><span>Task</span><span>Project</span><span>Priority</span><span>Status</span><span>Move to</span></div>{visibleTasks.map(t => <div className="task-row" key={t.id}><div className="task-title"><span className={"task-check " + (t.status === "DONE" ? "checked" : "")}>{t.status === "DONE" && <Check size={12}/>}</span><strong>{t.title}</strong></div><span className="muted">{t.project?.name || "—"}</span><span className={"priority " + (t.priority || "MEDIUM").toLowerCase()}>{t.priority || "MEDIUM"}</span><span className={"status " + t.status.toLowerCase()}>{columns.find(c => c.key === t.status)?.label || t.status}</span><select aria-label={"Change status for " + t.title} value={t.status} onChange={e => changeStatus(t, e.target.value)}>{columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>)}{visibleTasks.length === 0 && <div className="empty-state">No matching tasks. Create one to get started.</div>}</section>}
        <div className="kanban-section"><div className="section-heading"><div><h2>Team task board</h2><p>A quick view of work moving through your workflow.</p></div><span className="live-label"><i/> LIVE BOARD</span></div><div className="kanban-grid">{columns.map(col => <div className="kanban-column" key={col.key}><div className="kanban-title"><span>{col.label}</span><b>{visibleTasks.filter(t => t.status === col.key).length}</b></div>{visibleTasks.filter(t => t.status === col.key).slice(0, 3).map(t => <div className="kanban-card" key={t.id}><div className="kanban-card-meta"><span className={"priority " + (t.priority || "MEDIUM").toLowerCase()}>{t.priority || "MEDIUM"}</span><MoreHorizontal size={15}/></div><strong>{t.title}</strong><small>{t.project?.name || "Workspace"}</small></div>)}<button className="add-card" onClick={() => setModal("task")}><Plus size={14}/> Add task</button></div>)}</div></div>
        <footer className="footer"><span>© 2026 Nexora Workspace</span><span>Built for teams that make things happen <Sparkles size={13}/></span></footer>
      </section>
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setModal("")}><div className="modal"><div className="modal-head"><div><span className="eyebrow">NEXORA WORKSPACE</span><h2>{modal === "auth" ? "Welcome to Nexora" : modal === "project" ? "Create a project" : "Create a task"}</h2></div><button className="icon-button" onClick={() => setModal("")}><X size={18}/></button></div>
      {modal === "auth" ? <form onSubmit={authenticate} className="form-stack"><label>Account type<select name="mode"><option value="login">Sign in</option><option value="register">Create account</option></select></label><label>Full name <small>(registration only)</small><input name="name" placeholder="Your name"/></label><label>Email<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<input name="password" type="password" minLength="8" required placeholder="At least 8 characters"/></label><button className="button primary full" disabled={loading}>{loading ? "Please wait..." : "Continue"}</button></form> : modal === "project" ? <form onSubmit={createProject} className="form-stack"><label>Project name<input name="name" required minLength="2" placeholder="e.g. Website redesign"/></label><label>Description<textarea name="description" placeholder="What is this project about?"/></label><label>Project color<input name="color" type="color" defaultValue="#8b7cff"/></label><button className="button primary full">Create project</button></form> : <form onSubmit={createTask} className="form-stack"><label>Task title<input name="title" required minLength="2" placeholder="What needs to get done?"/></label><label>Description<textarea name="description" placeholder="Add some context..."/></label><label>Project<select name="projectId" required>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Priority<select name="priority"><option value="LOW">Low</option><option value="MEDIUM" selected>Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></label><button className="button primary full">Add to board</button></form>}
      <p className="modal-note">{token ? "Your changes sync to your Nexora account." : "Demo mode keeps changes in this browser session. Sign in to persist data."}</p></div></div>}
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
