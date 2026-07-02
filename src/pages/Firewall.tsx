import { useState, useEffect } from "react";
import { type StoredDevice, getUciConfig } from "../services/ubus";
import LoginPrompt from "../components/LoginPrompt";
import type { UciSection } from "../types";

interface Props { device: StoredDevice; session: string; onLogin: (s: string) => void; onNavigate: (p: string) => void; }

export default function Firewall({ device, session, onLogin }: Props) {
  const [sections, setSections] = useState<UciSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    getUciConfig(device.host, device.port, session, "firewall")
      .then((res) => {
        const list: UciSection[] = [];
        for (const [id, data] of Object.entries(res.raw?.values || {})) {
          const d = data as any;
          const vals: Record<string, string> = {};
          for (const [k, v] of Object.entries(d)) {
            if (k.startsWith(".")) continue;
            vals[k] = String(v);
          }
          list.push({ id, type: d[".type"] || "unknown", values: vals });
        }
        setSections(list.sort((a, b) => (a.values?.name || a.id).localeCompare(b.values?.name || b.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, device.host, device.port]);

  if (!session) return <LoginPrompt device={device} onLogin={onLogin} />;

  const zones = sections.filter((s) => s.type === "zone");
  const rules = sections.filter((s) => s.type === "rule");
  const forwardings = sections.filter((s) => s.type === "forwarding");

  return (
    <div className="page">
      <div className="page-header"><h2>Firewall</h2></div>
      {loading ? <div className="skeleton">{[1, 2, 3].map((i) => <div key={i} className="skeleton-line" />)}</div> : (
        <>
          <h3>Zones ({zones.length})</h3>
          <div className="uci-list">{zones.map((z) => <div key={z.id} className="uci-item">
            <strong>{z.values.name || z.id}</strong>
            <div className="muted">in: {z.values.input} · out: {z.values.output} · fwd: {z.values.forward}</div>
          </div>)}</div>
          <h3>Rules ({rules.length})</h3>
          <div className="uci-list">{rules.map((r) => <div key={r.id} className="uci-item">
            <strong>{r.values.name || r.id}</strong>
            <div className="muted">{r.values.src ? `src: ${r.values.src}` : ""} {r.values.dest ? `→ dest: ${r.values.dest}` : ""} {r.values.proto ? `· ${r.values.proto}` : ""}</div>
          </div>)}</div>
          <h3>Forwarding ({forwardings.length})</h3>
          <div className="uci-list">{forwardings.map((f) => <div key={f.id} className="uci-item">
            <strong>{f.values.src} → {f.values.dest}</strong>
          </div>)}</div>
        </>
      )}
    </div>
  );
}
