"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Profile, Task, Team } from "../../lib/types";

const statuses = ["Başlanmadı","Devam Ediyor","Beklemede","Bloke","Tamamlandı","İptal"];
const priorities = ["Kritik","Yüksek","Orta","Düşük"];

export default function TasksPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [fAssignee, setFAssignee] = useState("");
  const [fTeam, setFTeam] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPriority, setFPriority] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [status, setStatus] = useState(statuses[0]);
  const [priority, setPriority] = useState(priorities[2]);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [slaDays, setSlaDays] = useState(5);
  const [blockedReason, setBlockedReason] = useState("");
  const [tags, setTags] = useState("");

  async function ensureProfile() {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.id || !user.email) return;
    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!p) await supabase.from("profiles").insert({ id: user.id, email: user.email, role: "ANALYST" });
    const { data: p2 } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(p2 as any);
  }

  async function loadAll() {
    setLoading(true);
    const [pRes, tRes, teamRes] = await Promise.all([
      supabase.from("profiles").select("*").order("email"),
      supabase.from("tasks").select("*").order("updated_at", { ascending: false }),
      supabase.from("teams").select("*").order("name"),
    ]);
    setProfiles((pRes.data as any) || []);
    setTasks((tRes.data as any) || []);
    setTeams((teamRes.data as any) || []);
    setLoading(false);
  }

  useEffect(() => { ensureProfile().then(loadAll); }, []);

  const canAssign = useMemo(() => {
    return profile?.role === "HYBRID_LEAD" || profile?.role === "PM";
  }, [profile]);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (fAssignee && (t.assignee_id || "") !== fAssignee) return false;
      if (fTeam && (t.team_id || "") !== fTeam) return false;
      if (fStatus && t.status !== fStatus) return false;
      if (fPriority && t.priority !== fPriority) return false;
      if (q.trim()) {
        const hay = `${t.title} ${t.description ?? ""} ${(t.tags || []).join(",")}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [tasks, q, fAssignee, fTeam, fStatus, fPriority]);

  async function createTask() {
    if (!title.trim()) return alert("Başlık zorunlu");
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    const ownerId = u.user?.id || null;

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      team_id: teamId || null,
      assignee_id: assigneeId || null,
      owner_id: ownerId,
      status,
      priority,
      start_date: startDate || null,
      due_date: dueDate || null,
      progress,
      sla_days: slaDays,
      blocked_reason: blockedReason.trim() || null,
      tags: tags.split(",").map(x=>x.trim()).filter(Boolean),
    };
    const { error } = await supabase.from("tasks").insert(payload);
    setLoading(false);
    if (error) return alert(error.message);
    setTitle(""); setDescription(""); setTeamId(""); setAssigneeId(""); setStatus(statuses[0]); setPriority(priorities[2]);
    setStartDate(""); setDueDate(""); setProgress(0); setSlaDays(5); setBlockedReason(""); setTags("");
    await loadAll();
  }

  async function updateTask(id: string, patch: any) {
    const { error } = await supabase.from("tasks").update(patch).eq("id", id);
    if (error) alert(error.message);
    else loadAll();
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>İşler</h1>
      <div style={{ color: "#94a3b8", marginBottom: 12 }}>
        {profile ? <>Rol: <b>{profile.role}</b> • İş atama: <b>{canAssign ? "Açık" : "Kapalı"}</b></> : "Profil yükleniyor..."}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap: 12 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Yeni İş Oluştur</div>
          <Field label="Başlık" value={title} onChange={setTitle} />
          <Field label="Açıklama" value={description} onChange={setDescription} textarea />
          <Select label="Ekip" value={teamId} onChange={setTeamId} options={[{value:"",label:"(Seç)"}].concat(teams.map(t=>({value:t.id,label:t.name})))} />
          <Select label="Sorumlu" value={assigneeId} onChange={setAssigneeId} disabled={!canAssign}
            options={[{value:"",label:"(Atanmamış)"}].concat(profiles.map(p=>({value:p.id,label:(p.full_name||p.email)})))} />
          {!canAssign ? <div style={{ fontSize: 12, color:"#f59e0b" }}>Not: Analist rolü iş atayamaz. Rolünü HYBRID_LEAD/PM yap.</div> : null}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <Select label="Durum" value={status} onChange={setStatus} options={statuses.map(s=>({value:s,label:s}))} />
            <Select label="Önem" value={priority} onChange={setPriority} options={priorities.map(p=>({value:p,label:p}))} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <Field label="Başlangıç" value={startDate} onChange={setStartDate} type="date" />
            <Field label="Hedef Bitiş" value={dueDate} onChange={setDueDate} type="date" />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 10 }}>
            <Field label="İlerleme (%)" value={String(progress)} onChange={(v)=>setProgress(Number(v))} type="number" />
            <Field label="SLA (gün)" value={String(slaDays)} onChange={(v)=>setSlaDays(Number(v))} type="number" />
          </div>

          <Field label="Bloke nedeni" value={blockedReason} onChange={setBlockedReason} />
          <Field label="Etiketler (virgül)" value={tags} onChange={setTags} />

          <button onClick={createTask} disabled={loading} style={btn}>{loading ? "Kaydediliyor..." : "Kaydet"}</button>
        </div>

        <div style={card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontWeight: 900 }}>Liste</div>
            <button onClick={loadAll} disabled={loading} style={btnSecondary}>{loading ? "..." : "Yenile"}</button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Ara" style={inp} />
            <select value={fTeam} onChange={(e)=>setFTeam(e.target.value)} style={inp as any}>
              <option value="">Ekip (Tümü)</option>
              {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={fAssignee} onChange={(e)=>setFAssignee(e.target.value)} style={inp as any}>
              <option value="">Sorumlu (Tümü)</option>
              {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
            </select>
            <select value={fStatus} onChange={(e)=>setFStatus(e.target.value)} style={inp as any}>
              <option value="">Durum (Tümü)</option>
              {statuses.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ overflow:"auto", marginTop: 10, border:"1px solid rgba(148,163,184,.25)", borderRadius: 12 }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ textAlign:"left", fontSize: 12, color:"#94a3b8" }}>
                  <th style={th}>İş</th>
                  <th style={th}>Ekip</th>
                  <th style={th}>Sorumlu</th>
                  <th style={th}>Durum</th>
                  <th style={th}>Önem</th>
                  <th style={th}>Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t=>{
                  const teamName = teams.find(x=>x.id===t.team_id)?.name || "—";
                  const assigneeName = t.assignee_id ? (profiles.find(p=>p.id===t.assignee_id)?.full_name || profiles.find(p=>p.id===t.assignee_id)?.email) : "Atanmamış";
                  return (
                    <tr key={t.id}>
                      <td style={td}><div style={{ fontWeight: 800 }}>{t.title}</div><div style={{ fontSize: 12, color:"#94a3b8" }}>{(t.tags||[]).join(", ")}</div></td>
                      <td style={td}>{teamName}</td>
                      <td style={td}>{assigneeName}</td>
                      <td style={td}>
                        <select value={t.status} onChange={(e)=>updateTask(t.id, { status: e.target.value })} style={selMini}>
                          {statuses.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={td}>{t.priority}</td>
                      <td style={td}>
                        {canAssign ? (
                          <select value={t.assignee_id || ""} onChange={(e)=>updateTask(t.id, { assignee_id: e.target.value || null })} style={selMini}>
                            <option value="">Atanmamış</option>
                            {profiles.map(p=><option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                          </select>
                        ) : <span style={{ color:"#94a3b8" }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, color:"#94a3b8", fontSize: 12 }}>Toplam: <b>{filtered.length}</b></div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, type }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; type?: string }) {
  return (
    <label style={{ display:"block", marginBottom:10 }}>
      <div style={{ fontSize: 12, color:"#94a3b8", marginBottom: 6 }}>{label}</div>
      {textarea ? (
        <textarea value={value} onChange={(e)=>onChange(e.target.value)} style={{ ...inp, minHeight: 80 }} />
      ) : (
        <input type={type||"text"} value={value} onChange={(e)=>onChange(e.target.value)} style={inp} />
      )}
    </label>
  );
}

function Select({ label, value, onChange, options, disabled }: { label: string; value: string; onChange: (v: string) => void; options: {value:string,label:string}[]; disabled?: boolean }) {
  return (
    <label style={{ display:"block", marginBottom:10, opacity: disabled ? .6 : 1 }}>
      <div style={{ fontSize: 12, color:"#94a3b8", marginBottom: 6 }}>{label}</div>
      <select value={value} onChange={(e)=>onChange(e.target.value)} disabled={disabled} style={inp as any}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

const card = { border:"1px solid rgba(148,163,184,.25)", borderRadius: 14, padding: 12, background: "rgba(17,26,46,.6)" };
const inp = { width:"100%", padding: 10, borderRadius: 10, border:"1px solid rgba(148,163,184,.25)", background:"#0f172a", color:"#e5e7eb" };
const btn = { width:"100%", padding: 10, borderRadius: 10, border: 0, background:"#2563eb", color:"#fff", fontWeight:800 as const, cursor:"pointer" };
const btnSecondary = { padding: "8px 10px", borderRadius: 10, border:"1px solid rgba(148,163,184,.25)", background:"transparent", color:"#e5e7eb", cursor:"pointer" };
const th = { padding:"8px 6px", borderBottom:"1px solid rgba(148,163,184,.25)" };
const td = { padding:"10px 6px", borderBottom:"1px solid rgba(148,163,184,.15)" };
const selMini = { width:"100%", padding: 8, borderRadius: 10, border:"1px solid rgba(148,163,184,.25)", background:"#0f172a", color:"#e5e7eb" };
