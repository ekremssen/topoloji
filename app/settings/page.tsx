"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Profile, Role, Team } from "../../lib/types";

const roles: Role[] = ["DIRECTOR","HYBRID_LEAD","PM","ANALYST"];

export default function Settings(){
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  const [newTeamName, setNewTeamName] = useState("");

  async function loadAll(){
    setLoading(true);
    const [pRes, tRes] = await Promise.all([
      supabase.from("profiles").select("*").order("email"),
      supabase.from("teams").select("*").order("name"),
    ]);
    setProfiles((pRes.data as any) || []);
    setTeams((tRes.data as any) || []);
    setLoading(false);
  }

  useEffect(()=>{ loadAll(); }, []);

  async function setRole(id: string, role: Role){
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if(error) alert(error.message);
    else loadAll();
  }

  async function setTeam(id: string, team_id: string){
    const { error } = await supabase.from("profiles").update({ team_id: team_id || null }).eq("id", id);
    if(error) alert(error.message);
    else loadAll();
  }

  async function createTeam(){
    if(!newTeamName.trim()) return alert("Ekip adı zorunlu");
    const { error } = await supabase.from("teams").insert({ name: newTeamName.trim() });
    if(error) alert(error.message);
    setNewTeamName("");
    loadAll();
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Ayarlar</h1>
      <div style={{ color:"#94a3b8", marginBottom: 12 }}>
        MVP için basit yönetim ekranı: ekip oluştur, kullanıcı rolünü ve ekip atamasını güncelle.
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"360px 1fr", gap: 12 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Ekip Oluştur</div>
          <input value={newTeamName} onChange={(e)=>setNewTeamName(e.target.value)} placeholder="Örn: Mobil / CRM / PMO" style={inp} />
          <button onClick={createTeam} style={btn}>Ekle</button>
          <div style={{ marginTop: 10, color:"#94a3b8", fontSize: 12 }}>
            Mevcut ekipler: {teams.length}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Kullanıcılar</div>
          <div style={{ overflow:"auto", border:"1px solid rgba(148,163,184,.25)", borderRadius: 12 }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ textAlign:"left", fontSize: 12, color:"#94a3b8" }}>
                  <th style={th}>E-posta</th>
                  <th style={th}>Ad</th>
                  <th style={th}>Rol</th>
                  <th style={th}>Ekip</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p=>(
                  <tr key={p.id}>
                    <td style={td}>{p.email}</td>
                    <td style={td}>{p.full_name || "—"}</td>
                    <td style={td}>
                      <select value={p.role} onChange={(e)=>setRole(p.id, e.target.value as Role)} style={selMini}>
                        {roles.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <select value={p.team_id || ""} onChange={(e)=>setTeam(p.id, e.target.value)} style={selMini}>
                        <option value="">—</option>
                        {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, display:"flex", gap: 10 }}>
            <button onClick={loadAll} disabled={loading} style={btnSecondary}>{loading ? "..." : "Yenile"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const card = { border:"1px solid rgba(148,163,184,.25)", borderRadius: 14, padding: 12, background: "rgba(17,26,46,.6)" };
const inp = { width:"100%", padding: 10, borderRadius: 10, border:"1px solid rgba(148,163,184,.25)", background:"#0f172a", color:"#e5e7eb" };
const btn = { width:"100%", padding:"10px 12px", borderRadius: 10, border: 0, background:"#2563eb", color:"#fff", fontWeight:800 as const, cursor:"pointer", marginTop: 10 };
const btnSecondary = { padding:"10px 12px", borderRadius: 10, border:"1px solid rgba(148,163,184,.25)", background:"transparent", color:"#e5e7eb", fontWeight:800 as const, cursor:"pointer" };
const th = { padding:"8px 6px", borderBottom:"1px solid rgba(148,163,184,.25)" };
const td = { padding:"10px 6px", borderBottom:"1px solid rgba(148,163,184,.15)" };
const selMini = { width:"100%", padding: 8, borderRadius: 10, border:"1px solid rgba(148,163,184,.25)", background:"#0f172a", color:"#e5e7eb" };
