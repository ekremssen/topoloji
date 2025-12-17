"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Profile, Task, Team } from "../../lib/types";

export default function Reports(){
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [fTeam, setFTeam] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAll(){
    setLoading(true);
    const [pRes, tRes, teamRes] = await Promise.all([
      supabase.from("profiles").select("*").order("email"),
      supabase.from("tasks").select("*").order("updated_at",{ascending:false}),
      supabase.from("teams").select("*").order("name"),
    ]);
    setProfiles((pRes.data as any) || []);
    setTasks((tRes.data as any) || []);
    setTeams((teamRes.data as any) || []);
    setLoading(false);
  }

  useEffect(()=>{ loadAll(); }, []);

  const filtered = useMemo(()=>{
    return tasks.filter(t=>{
      if(fTeam && (t.team_id||"")!==fTeam) return false;
      if(fStatus && t.status!==fStatus) return false;
      return !["İptal"].includes(t.status);
    });
  },[tasks,fTeam,fStatus]);

  const workload = useMemo(()=>{
    const map = new Map<string, {open:number, done:number, blocked:number}>();
    for(const t of filtered){
      const k = t.assignee_id || "unassigned";
      const cur = map.get(k) || {open:0, done:0, blocked:0};
      if(t.status==="Tamamlandı") cur.done += 1;
      else cur.open += 1;
      if(t.status==="Bloke") cur.blocked += 1;
      map.set(k, cur);
    }
    return [...map.entries()].map(([id, v])=>{
      const name = id==="unassigned" ? "Atanmamış" : (profiles.find(p=>p.id===id)?.full_name || profiles.find(p=>p.id===id)?.email || id);
      return { id, name, ...v, total: v.open+v.done };
    }).sort((a,b)=>b.open-a.open);
  },[filtered, profiles]);

  function exportCsv(){
    const lines = [
      ["Kişi","Açık","Bloke","Tamamlanan","Toplam"].join(","),
      ...workload.map(r=>[csv(r.name),r.open,r.blocked,r.done,r.total].join(","))
    ].join("\n");
    const blob = new Blob([lines], { type:"text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "rapor_is_yuku.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function csv(s:string){ return `"${String(s).replaceAll('"','""')}"`; }

  const statuses = ["Başlanmadı","Devam Ediyor","Beklemede","Bloke","Tamamlandı"];

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Raporlar</h1>
      <div style={{ color:"#94a3b8", marginBottom: 12 }}>
        Bu sayfa yöneticiye “anlık rapor” vermek için tasarlandı. Filtrele → CSV al.
      </div>

      <div style={{ display:"flex", gap: 10, flexWrap:"wrap", alignItems:"center" }}>
        <select value={fTeam} onChange={(e)=>setFTeam(e.target.value)} style={inp as any}>
          <option value="">Ekip (Tümü)</option>
          {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={fStatus} onChange={(e)=>setFStatus(e.target.value)} style={inp as any}>
          <option value="">Durum (Tümü)</option>
          {statuses.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={exportCsv} style={btnSecondary}>CSV Dışa Aktar</button>
        <button onClick={loadAll} disabled={loading} style={btn}>{loading ? "..." : "Yenile"}</button>
      </div>

      <div style={{ marginTop: 12, border:"1px solid rgba(148,163,184,.25)", borderRadius: 14, padding: 12, background:"rgba(17,26,46,.6)" }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>İş Yükü (Kişi Bazlı)</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ textAlign:"left", fontSize: 12, color:"#94a3b8" }}>
              <th style={th}>Kişi</th>
              <th style={th}>Açık</th>
              <th style={th}>Bloke</th>
              <th style={th}>Tamamlanan</th>
              <th style={th}>Toplam</th>
            </tr>
          </thead>
          <tbody>
            {workload.map(r=>(
              <tr key={r.id}>
                <td style={td}><b>{r.name}</b></td>
                <td style={td}>{r.open}</td>
                <td style={td}>{r.blocked}</td>
                <td style={td}>{r.done}</td>
                <td style={td}>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {workload.length===0 ? <div style={{ color:"#94a3b8", marginTop: 10 }}>Kayıt yok.</div> : null}
      </div>
    </div>
  );
}

const inp = { padding: 10, borderRadius: 10, border:"1px solid rgba(148,163,184,.25)", background:"#0f172a", color:"#e5e7eb" };
const btn = { padding:"10px 12px", borderRadius: 10, border: 0, background:"#2563eb", color:"#fff", fontWeight:800 as const, cursor:"pointer" };
const btnSecondary = { padding:"10px 12px", borderRadius: 10, border:"1px solid rgba(148,163,184,.25)", background:"transparent", color:"#e5e7eb", fontWeight:800 as const, cursor:"pointer" };
const th = { padding:"8px 6px", borderBottom:"1px solid rgba(148,163,184,.25)" };
const td = { padding:"10px 6px", borderBottom:"1px solid rgba(148,163,184,.15)" };
