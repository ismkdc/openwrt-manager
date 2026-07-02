import { useState, useEffect } from "react";
import { type StoredDevice, getNetworkInterfaces } from "../services/ubus";
import LoginPrompt from "../components/LoginPrompt";
import type { NetworkInterface } from "../types";

interface Props {
  device: StoredDevice;
  session: string;
  onLogin: (session: string) => void;
  onNavigate: (page: string) => void;
}

export default function Network({ device, session, onLogin }: Props) {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    getNetworkInterfaces(device.host, device.port, session)
      .then((data) => {
        const list: NetworkInterface[] = (data?.interface || []).map((iface: any) => ({
          name: iface.interface || "?",
          type: iface.proto === "loopback" ? "loopback" : iface.device?.startsWith("br-") ? "bridge" : "ethernet",
          up: iface.up || false,
          ipv4: (iface["ipv4-address"] || []).map((a: any) => `${a.address}/${a.mask}`),
          ipv6: (iface["ipv6-address"] || []).map((a: any) => `${a.address}/${a.mask}`),
          device: iface.device || iface.l3_device || "",
        }));
        setInterfaces(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, device.host, device.port]);

  if (!session) return <LoginPrompt device={device} onLogin={onLogin} />;

  const selectedIface = interfaces.find((i) => i.name === selected);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Network Interfaces</h2>
      </div>
      <div className="split-view">
        <div className="split-left">
          {loading ? (
            <div className="skeleton">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton-line" />)}
            </div>
          ) : (
            <div className="interface-list">
              {interfaces.map((iface) => (
                <div
                  key={iface.name}
                  className={`interface-item ${selected === iface.name ? "active" : ""}`}
                  onClick={() => setSelected(iface.name)}
                >
                  <div className="iface-name">
                    <span className={`status-dot ${iface.up ? "green" : "red"}`} />
                    {iface.name}
                  </div>
                  <div className="iface-ip">{iface.ipv4.join(", ") || "No IP"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="split-right">
          {selectedIface ? (
            <div className="detail-panel">
              <h3>{selectedIface.name}</h3>
              <div className="detail-section">
                <div className="detail-row"><span>Status</span><span className={selectedIface.up ? "text-green" : "text-red"}>{selectedIface.up ? "Up" : "Down"}</span></div>
                <div className="detail-row"><span>Device</span><span>{selectedIface.device}</span></div>
                <div className="detail-row"><span>Type</span><span>{selectedIface.type}</span></div>
              </div>
              <div className="detail-section">
                <h4>IPv4</h4>
                {selectedIface.ipv4.map((ip) => (
                  <div key={ip} className="detail-row"><span>Address</span><span className="mono">{ip}</span></div>
                ))}
                {selectedIface.ipv4.length === 0 && <p className="muted">No IPv4 addresses</p>}
              </div>
              <div className="detail-section">
                <h4>IPv6</h4>
                {selectedIface.ipv6.map((ip) => (
                  <div key={ip} className="detail-row"><span>Address</span><span className="mono">{ip}</span></div>
                ))}
                {selectedIface.ipv6.length === 0 && <p className="muted">No IPv6 addresses</p>}
              </div>
            </div>
          ) : (
            <div className="empty-state">Select an interface</div>
          )}
        </div>
      </div>
    </div>
  );
}
