import { useState, useEffect } from "react";
import { type StoredDevice, getUciConfig } from "../services/ubus";
import LoginPrompt from "../components/LoginPrompt";
import type { UciSection } from "../types";

interface Props { device: StoredDevice; session: string; onLogin: (s: string) => void; onNavigate: (p: string) => void; }

export default function DHCP({ device, session, onLogin }: Props) {
  const [sections, setSections] = useState<UciSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    getUciConfig(device.host, device.port, session, "dhcp")
      .then((res) => {
        const list: UciSection[] = [];
        for (const [id, data] of Object.entries(res.raw?.values || {})) {
          const d = data as any;
          const vals: Record<string, string> = {};
          for (const [k, v] of Object.entries(d)) { if (!k.startsWith(".")) vals[k] = String(v); }
          list.push({ id, type: d[".type"] || "unknown", values: vals });
        }
        setSections(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, device.host, device.port]);

  if (!session) return <LoginPrompt device={device} onLogin={onLogin} />;
  const dnsmasq = sections.filter((s) => s.type === "dnsmasq");
  const pools = sections.filter((s) => s.type === "dhcp");
  const hosts = sections.filter((s) => s.type === "host");

  return (
    <div className="page">
      <div className="page-header"><h2>DHCP & DNS</h2></div>
      {loading ? <div className="skeleton">{[1,2,3].map(i => <div key={i} className="skeleton-line" />)}</div> : (
        <>
          <h3>DHCP Server ({dnsmasq.length})</h3>
          <div className="uci-list">{dnsmasq.map(s => <div key={s.id} className="uci-item">
            <strong>dnsmasq</strong>
            <div className="muted">Port: {s.values.port || "53"} · Interfaces: {s.values.interface || "all"}</div>
          </div>)}</div>
          <h3>Pools ({pools.length})</h3>
          <div className="uci-list">{pools.map(p => <div key={p.id} className="uci-item">
            <strong>{p.id}</strong>
            <div className="muted">Interface: {p.values.interface} · Start: {p.values.start} · Limit: {p.values.limit} · Lease: {p.values.leasetime}</div>
          </div>)}</div>
          <h3>Static Leases ({hosts.length})</h3>
          <div className="uci-list">{hosts.map(h => <div key={h.id} className="uci-item">
            <strong>{h.values.name || h.id}</strong>
            <div className="muted">{h.values.mac} → {h.values.ip}</div>
          </div>)}</div>
        </>
      )}
    </div>
  );
}
