import { useState, useEffect } from "react";
import { type StoredDevice, getSystemBoard, getSystemInfo, getWirelessDevices, getAssoclist } from "../services/ubus";
import LoginPrompt from "../components/LoginPrompt";
import { type SystemBoard, type SystemInfo } from "../types";
import { Gauge, Cpu, HardDrive, Wifi, Activity, Clock, Signal, WifiIcon } from "lucide-react";

interface Props { device: StoredDevice; session: string; onLogin: (s: string) => void; onNavigate: (p: string) => void; }

function fmtBytes(n: number): string {
  if (n === 0) return "0 B";
  const k = 1024; const s = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return (n / Math.pow(k, i)).toFixed(1) + " " + s[i];
}

function fmtUptime(s: number): string {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function ProgressBar({ pct, color = "accent" }: { pct: number; color?: string }) {
  return <div className={`progress-bar ${color}`}><span style={{ width: `${Math.min(pct, 100)}%` }} /></div>;
}

function Sparkline({ data, w = 80, h = 24 }: { data: number[]; w?: number; h?: number }) {
  const mx = Math.max(...data, 1), mn = Math.min(...data);
  const r = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / r) * h}`).join(" ");
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

interface ClientInfo { mac: string; signal: number; noise?: number; rx?: string; tx?: string; }

function ClientList({ clients }: { clients: ClientInfo[] }) {
  const bars = (s: number) => {
    const n = s >= -50 ? 4 : s >= -65 ? 3 : s >= -80 ? 2 : 1;
    return <div className="signal-bars">{Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="signal-bar" style={{ height: `${6 + i * 4}px`, background: i < n ? "var(--green)" : "var(--border)" }} />
    ))}</div>;
  };
  return <div className="client-list">{
    clients.length === 0
      ? <div className="muted" style={{ fontSize: 12 }}>No clients connected</div>
      : clients.map((c) => (
          <div key={c.mac} className="client-item">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <WifiIcon size={14} />
              <div><div className="mono" style={{ fontSize: 11 }}>{c.mac}</div></div>
            </div>
            <div className="client-signal">
              {bars(c.signal)}
              <span className="mono" style={{ fontSize: 11, minWidth: 50, textAlign: "right" }}>{c.signal} dBm</span>
            </div>
          </div>
        ))
  }</div>;
}

export default function Dashboard({ device, session, onLogin }: Props) {
  const [board, setBoard] = useState<SystemBoard | null>(null);
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadData, setLoadData] = useState<number[]>([]);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      getSystemBoard(device.host, device.port, session),
      getSystemInfo(device.host, device.port, session),
      getWirelessDevices(device.host, device.port, session).catch(() => ({})),
    ]).then(async ([b, i, w]) => {
      setBoard(b as SystemBoard);
      setInfo(i as SystemInfo);
      // Parse WiFi clients via iwinfo.assoclist
      const allClients: ClientInfo[] = [];
      const wirelessData = w as any;
      for (const radio of Object.values(wirelessData)) {
        const r = radio as any;
        if (r?.interfaces) {
          for (const intf of r.interfaces) {
            const ifname = intf?.ifname;
            if (ifname) {
              try {
                const assocResult = await getAssoclist(device.host, device.port, session, ifname);
                const results = assocResult?.results ?? [];
                for (const st of results) {
                  allClients.push({
                    mac: st.mac || "?",
                    signal: st.signal ?? st.rssi ?? -100,
                    noise: st.noise ?? 0,
                  });
                }
              } catch { /* assoclist not available for this interface */ }
            }
          }
        }
      }
      setClients(allClients);
      setLoadData((prev) => [...prev.slice(-19), (i as any)?.load?.[0] ?? 0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, [session, device.host, device.port]);

  if (!session) return <LoginPrompt device={device} onLogin={onLogin} />;

  const memTotal = info?.memory?.total || 0;
  const memAvail = info?.memory?.available || 0;
  const memUsed = memTotal - memAvail;
  const memPct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0;
  const load1 = info?.load?.[0] != null ? ((info.load[0] / 65535) * 100).toFixed(0) : "0";

  const rootTotal = (info?.root?.total || 0) * 1024;
  const rootUsed = (info?.root?.used || 0) * 1024;
  const rootPct = rootTotal > 0 ? (rootUsed / rootTotal) * 100 : 0;

  const refresh = () => {
    setLoading(true);
    Promise.all([getSystemBoard(device.host, device.port, session), getSystemInfo(device.host, device.port, session)])
      .then(([b, i]) => { setBoard(b as SystemBoard); setInfo(i as SystemInfo); })
      .catch(console.error).finally(() => setLoading(false));
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <button className="btn" onClick={refresh} disabled={loading}>🔄 {loading ? "Loading..." : "Refresh"}</button>
      </div>

      <div className="dashboard-grid">
        {/* System */}
        <div className="stat-card" style={{ animationDelay: "0ms" }}>
          <div className="top">
            <div className="top-left">
              <div className="icon-tile accent"><Gauge size={18} /></div>
              <div><h3>System</h3><div className="stat-value">{board?.hostname || "-"}</div></div>
            </div>
          </div>
          <div className="info-rows">
            <div className="info-row"><span className="info-label">Model</span><span>{board?.model || "-"}</span></div>
            <div className="info-row"><span className="info-label">Kernel</span><span className="mono">{board?.kernel || "-"}</span></div>
            <div className="info-row"><span className="info-label">Arch</span><span>{board?.system || "-"}</span></div>
          </div>
        </div>

        {/* Memory */}
        <div className="stat-card" style={{ animationDelay: "40ms" }}>
          <div className="top">
            <div className="top-left">
              <div className="icon-tile purple"><Cpu size={18} /></div>
              <div><h3>Memory</h3><div className="stat-value">{fmtBytes(memUsed)}</div></div>
            </div>
            <span className="stat-label">{memPct.toFixed(1)}%</span>
          </div>
          <ProgressBar pct={memPct} />
          <div className="info-rows" style={{ marginTop: 8 }}>
            <div className="info-row"><span className="info-label">Total</span><span>{fmtBytes(memTotal)}</span></div>
            <div className="info-row"><span className="info-label">Available</span><span>{fmtBytes(memAvail)}</span></div>
          </div>
        </div>

        {/* Storage */}
        <div className="stat-card" style={{ animationDelay: "80ms" }}>
          <div className="top">
            <div className="top-left">
              <div className="icon-tile orange"><HardDrive size={18} /></div>
              <div><h3>Storage</h3><div className="stat-value">{fmtBytes(rootUsed)}</div></div>
            </div>
            <span className="stat-label">{rootPct.toFixed(1)}%</span>
          </div>
          <ProgressBar pct={rootPct} color="orange" />
          <div className="info-rows" style={{ marginTop: 8 }}>
            <div className="info-row"><span className="info-label">Total</span><span>{fmtBytes(rootTotal)}</span></div>
            <div className="info-row"><span className="info-label">Free</span><span>{fmtBytes((info?.root?.free || 0) * 1024)}</span></div>
          </div>
        </div>

        {/* CPU / Load */}
        <div className="stat-card" style={{ animationDelay: "120ms" }}>
          <div className="top">
            <div className="top-left">
              <div className="icon-tile red"><Activity size={18} /></div>
              <div><h3>CPU Load</h3><div className="stat-value">{load1}%</div></div>
            </div>
            <Sparkline data={loadData.length ? loadData : [0]} />
          </div>
          <ProgressBar pct={Number(load1)} color="orange" />
          <div className="info-rows" style={{ marginTop: 8 }}>
            <div className="info-row"><span className="info-label">1 min</span><span className="mono">{info?.load?.[0] != null ? (info.load[0] / 65535).toFixed(2) : "-"}</span></div>
            <div className="info-row"><span className="info-label">5 min</span><span className="mono">{info?.load?.[1] != null ? (info.load[1] / 65535).toFixed(2) : "-"}</span></div>
            <div className="info-row"><span className="info-label">15 min</span><span className="mono">{info?.load?.[2] != null ? (info.load[2] / 65535).toFixed(2) : "-"}</span></div>
          </div>
        </div>

        {/* Uptime / Firmware */}
        <div className="stat-card" style={{ animationDelay: "160ms" }}>
          <div className="top">
            <div className="top-left">
              <div className="icon-tile mint"><Clock size={18} /></div>
              <div><h3>Uptime</h3><div className="stat-value">{info?.uptime ? fmtUptime(info.uptime) : "-"}</div></div>
            </div>
          </div>
          <div className="info-rows">
            <div className="info-row"><span className="info-label">Firmware</span><span>{board?.release?.description || "-"}</span></div>
            <div className="info-row"><span className="info-label">Target</span><span className="mono">{board?.release?.target || "-"}</span></div>
          </div>
        </div>

        {/* WiFi Clients */}
        <div className="stat-card" style={{ animationDelay: "200ms" }}>
          <div className="top">
            <div className="top-left">
              <div className="icon-tile green"><Signal size={18} /></div>
              <div><h3>WiFi Clients</h3><div className="stat-value">{clients.length}</div></div>
            </div>
            <Wifi size={18} style={{ color: "var(--text-secondary)" }} />
          </div>
          <ProgressBar pct={clients.length > 0 ? Math.min(clients.length * 25, 100) : 0} color="green" />
          <ClientList clients={clients} />
        </div>
      </div>
    </div>
  );
}
