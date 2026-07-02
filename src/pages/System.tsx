import { useState, useEffect } from "react";
import { type StoredDevice, getSystemBoard, reboot } from "../services/ubus";
import LoginPrompt from "../components/LoginPrompt";
import { type SystemBoard } from "../types";

interface Props { device: StoredDevice; session: string; onLogin: (s: string) => void; onNavigate: (p: string) => void; }

export default function System({ device, session, onLogin, onNavigate }: Props) {
  const [board, setBoard] = useState<SystemBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebooting, setRebooting] = useState(false);

  useEffect(() => {
    if (!session) return;
    getSystemBoard(device.host, device.port, session)
      .then((b) => setBoard(b as SystemBoard))
      .catch(console.error).finally(() => setLoading(false));
  }, [session, device.host, device.port]);

  if (!session) return <LoginPrompt device={device} onLogin={onLogin} />;

  const handleReboot = async () => {
    if (!confirm("Reboot device? This will disconnect temporarily.")) return;
    setRebooting(true);
    try { await reboot(device.host, device.port, session); } catch (e: any) { alert(e); }
    setRebooting(false);
  };

  return (
    <div className="page">
      <div className="page-header"><h2>System</h2></div>
      {loading ? <div className="skeleton">{[1,2,3,4].map(i => <div key={i} className="skeleton-line" />)}</div> : (
        <>
          <h3>System Information</h3>
          <div className="uci-list">
            <div className="uci-item"><strong>Hostname</strong><div className="muted">{board?.hostname}</div></div>
            <div className="uci-item"><strong>Model</strong><div className="muted">{board?.model}</div></div>
            <div className="uci-item"><strong>Architecture</strong><div className="muted">{board?.system}</div></div>
            <div className="uci-item"><strong>Kernel</strong><div className="muted">{board?.kernel}</div></div>
            <div className="uci-item"><strong>Firmware</strong><div className="muted">{board?.release?.description}</div></div>
            <div className="uci-item"><strong>Target</strong><div className="muted">{board?.release?.target}</div></div>
          </div>

          <h3 style={{ marginTop: 20 }}>Actions</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => onNavigate("luci")}>🌐 Open LuCI</button>
            <button className="btn" onClick={() => window.open(`http://${device.host}`, "_blank")}>
              🌍 Open in Browser
            </button>
            <button className="btn btn-primary" onClick={handleReboot} disabled={rebooting}>
              {rebooting ? "⏳ Rebooting..." : "🔄 Reboot"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
