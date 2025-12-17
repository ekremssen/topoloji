"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/dashboard";
    });
  }, []);

  async function sendLink() {
    setMsg("");
    if (!email.trim()) return setMsg("E-posta zorunlu.");
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (error) setMsg(error.message);
    else { setSent(true); setMsg("Giriş linki e-postana gönderildi."); }
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", border: "1px solid rgba(148,163,184,.25)", borderRadius: 14, padding: 16, background: "rgba(17,26,46,.6)" }}>
      <h1 style={{ marginTop: 0 }}>Giriş</h1>
      <p style={{ color: "#94a3b8" }}>Magic Link ile giriş. (Şifre yok)</p>
      <label style={lab}>E-posta</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@firma.com"
        style={inp} />
      <button onClick={sendLink} style={btn}>Giriş Linki Gönder</button>
      {sent ? <div style={{ marginTop: 10, color: "#22c55e" }}>Link gönderildi. E-postanı kontrol et.</div> : null}
      {msg ? <div style={{ marginTop: 10, color: "#f59e0b" }}>{msg}</div> : null}
      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
        İlk girişten sonra kullanıcı profil kaydı otomatik oluşturulur.
      </div>
    </div>
  );
}

const lab = { fontSize: 12, color: "#94a3b8", marginBottom: 6, display: "block" };
const inp = { width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(148,163,184,.25)", background: "#0f172a", color: "#e5e7eb" };
const btn = { width: "100%", padding: 10, borderRadius: 10, border: 0, background: "#2563eb", color: "#fff", fontWeight: 800 as const, cursor: "pointer", marginTop: 10 };
