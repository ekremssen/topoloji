"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Profile, Task, Team } from "../../lib/types";

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  async function ensureProfile() {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.id || !user.email) return;

    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!p) {
      await supabase.from("profiles").insert({ id: user.id, email: user.email, role: "ANALYST" });
    }
    const { data: p2 } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile(p2 as any);
  }

  async function loadAll() {
    setLoading(true);
    const [tRes, pRes, teamRes] = await Promise.all([
      supabase.from("tasks").select("*").order("updated_at", { ascending: false }),
      supabase.from("profiles").select("*").order("email"),
      supabase.from("teams").select("*").order("name"),
    ]);
    setTasks((tRes.data as any) || []);
    setProfiles((pRes.data as any) || []);
    setTeams((teamRes.data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    ensureProfile().then(loadAll);
  }, []);

  const kpis = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === "Tamamlandı").length;
    const open = tasks.filter(t => !["Tamamlandı","İptal"].includes(t.status)).length;
    const blocked = tasks.filter(t => t.status === "Bloke").length;
    const byAssignee = new Map<string, number>();
    tasks.filter(t=>!["Tamamlandı","İptal"].includes(t.status)).forEach(t => {
      const k = t.assignee_id || "unassigned";
      byAssignee.set(k, (byAssignee.get(k) || 0) + 1);
    });
    const top = [...byAssignee.entries()].sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,count])=>{
      const name = id==="unassigned" ? "Atanmamış" : (profiles.find(p=>p.id===id)?.full_name || profiles.find(p=>p.id===id)?.email || id);
      return { name, count };
    });
    return { total, done, open, blocked, top };
  }, [tasks, profiles]);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div style={{ color: "#94a3b8", marginBottom: 12 }}>
        {profile ? <>Rol: <b>{profile.role}</b></> : "Profil yükleniyor..."}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(160px,1fr))", gap: 10 }}>
        <Kpi title="Toplam" value={kpis.total} />
        <Kpi title="Açık" value={kpis.open} />
        <Kpi title="Bloke" value={kpis.blocked} />
        <Kpi title="Tamamlandı" value={kpis.done} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginTop: 12 }}>
        <Card title="Kimde kaç iş var? (Açık)">
          <table style={tbl}>
            <thead><tr><th style={th}>Kişi</th><th style={th}>Açık İş</th></tr></thead>
            <tbody>
              {kpis.top.map((x, i)=>(
                <tr key={i}><td style={td}>{x.name}</td><td style={td}><b>{x.count}</b></td></tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Bloke İşler (son güncel)">
          <div style={{ display:"grid", gap: 8 }}>
            {tasks.filter(t=>t.status==="Bloke").slice(0,8).map(t=>(
              <div key={t.id} style={{ padding:10, borderRadius:12, border:"1px solid rgba(148,163,184,.25)", background:"#0f172a" }}>
                <div style={{ fontWeight: 800 }}>{t.title}</div>
                <div style={{ fontSize: 12, color:"#94a3b8" }}>{t.blocked_reason || "Bloke nedeni girilmemiş"}</div>
              </div>
            ))}
            {tasks.filter(t=>t.status==="Bloke").length===0 ? <div style={{ color:"#94a3b8" }}>Bloke iş yok.</div> : null}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <Card title="Anlık Rapor Linki (Yöneticiye Gönder)">
          <div style={{ color:"#94a3b8" }}>
            Yönetici anlık görmek isterse: <b>/reports</b> sayfasını açıp filtreleyebilir. Prod ortamda bu linki read-only role ile paylaşabilirsiniz.
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={loadAll} disabled={loading} style={btn}>{loading ? "Yükleniyor..." : "Yenile"}</button>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: any }) {
  return (
    <div style={{ border:"1px solid rgba(148,163,184,.25)", borderRadius: 14, padding: 10, background: "rgba(17,26,46,.6)" }}>
      <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{title}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border:"1px solid rgba(148,163,184,.25)", borderRadius: 14, padding: 12, background: "rgba(17,26,46,.6)" }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

const tbl = { width:"100%", borderCollapse:"collapse" as const };
const th = { textAlign:"left" as const, fontSize: 12, color:"#94a3b8", borderBottom:"1px solid rgba(148,163,184,.25)", padding:"8px 6px" };
const td = { borderBottom:"1px solid rgba(148,163,184,.15)", padding:"8px 6px" };
const btn = { padding:"10px 12px", borderRadius: 10, border: 0, background:"#2563eb", color:"#fff", fontWeight:800 as const, cursor:"pointer" };
