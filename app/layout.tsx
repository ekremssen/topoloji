"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export const metadata = { title: "Görev Yönetimi", description: "Ekip takibi + rapor" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email ?? "");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setEmail(s?.user?.email ?? "");
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Arial", background: "#0b1220", color: "#e5e7eb" }}>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
          <aside style={{ borderRight: "1px solid rgba(148,163,184,.25)", padding: 14, background: "#091022" }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Görev Yönetimi</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>{email ? `Giriş: ${email}` : "Giriş yapılmadı"}</div>
            <nav style={{ display: "grid", gap: 8 }}>
              <Nav href="/dashboard" label="Dashboard" />
              <Nav href="/tasks" label="İşler" />
              <Nav href="/reports" label="Raporlar" />
              <Nav href="/settings" label="Ayarlar (Rol)" />
            </nav>
            <div style={{ marginTop: 14 }}>
              {email ? (
                <button onClick={logout} style={btn("secondary")}>Çıkış</button>
              ) : null}
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: "#94a3b8" }}>
              Not: Bu MVP’de “rol kontrolü” UI seviyesinde basit tutuldu. Prod için RLS policy ekleyin.
            </div>
          </aside>
          <main style={{ padding: 16 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}

function Nav({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "#e5e7eb", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,.25)", background: "rgba(17,26,46,.6)" }}>
      {label}
    </Link>
  );
}

function btn(kind: "primary" | "secondary") {
  return {
    padding: "10px 12px",
    borderRadius: 10,
    border: kind === "secondary" ? "1px solid rgba(148,163,184,.25)" : "0",
    background: kind === "secondary" ? "transparent" : "#2563eb",
    color: "#e5e7eb",
    fontWeight: 800 as const,
    cursor: "pointer",
    width: "100%"
  };
}
