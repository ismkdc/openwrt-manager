import { useState, useEffect } from "react";
import { type StoredDevice, getWirelessDevices } from "../services/ubus";
import LoginPrompt from "../components/LoginPrompt";
import type { WirelessRadio } from "../types";

interface Props {
  device: StoredDevice;
  session: string;
  onLogin: (session: string) => void;
  onNavigate: (page: string) => void;
}

export default function WirelessPage({ device, session, onLogin }: Props) {
  const [radios, setRadios] = useState<WirelessRadio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    setError(null);
    getWirelessDevices(device.host, device.port, session)
      .then((data) => {
        const list: WirelessRadio[] = [];
        for (const [name, radioData] of Object.entries(data as any)) {
          const rd = radioData as any;
          const iwinfo = rd?.iwinfo || {};
          const config = rd?.config || {};
          list.push({
            name,
            channel: iwinfo.channel ?? config.channel ?? null,
            frequency: iwinfo.frequency ?? null,
            txpower: iwinfo.txpower ?? null,
            country: iwinfo.country ?? config.country ?? null,
            band: config.band || "?",
            up: rd.up || false,
            interfaces: (rd?.interfaces || []).map((intf: any) => {
              const ii = intf?.iwinfo || {};
              const ic = intf?.config || {};
              return {
                ifname: intf.ifname || "",
                ssid: ii.ssid || ic.ssid || "",
                mode: ii.mode || ic.mode || "?",
                encryption: ii.encryption?.enabled ? "Secured" : "Open",
                signal: ii.signal ?? null,
                channel: ii.channel ?? null,
                bssid: ii.bssid || null,
              };
            }),
          });
        }
        setRadios(list);
      })
      .catch((e) => setError(e.toString()))
      .finally(() => setLoading(false));
  }, [session, device.host, device.port]);

  if (!session) return <LoginPrompt device={device} onLogin={onLogin} />;
  if (error) return <div className="page"><div className="error-card"><h3>Wireless Unavailable</h3><p>{error}</p></div></div>;

  return (
    <div className="page">
      <div className="page-header"><h2>Wireless</h2></div>
      {loading ? (
        <div className="skeleton">{[1, 2].map((i) => <div key={i} className="skeleton-line" />)}</div>
      ) : radios.length === 0 ? (
        <div className="empty-state">No wireless radios found</div>
      ) : (
        <div className="radio-list">
          {radios.map((radio) => (
            <div key={radio.name} className="radio-card">
              <div className="radio-header">
                <h3>{radio.name}</h3>
                <span className={`badge ${radio.up ? "badge-green" : "badge-red"}`}>
                  {radio.up ? "Up" : "Down"}
                </span>
              </div>
              <div className="info-row"><span>Band</span><span>{radio.band}</span></div>
              <div className="info-row"><span>Channel</span><span>{radio.channel ?? "?"}</span></div>
              <div className="info-row"><span>TX Power</span><span>{radio.txpower ?? "?"} dBm</span></div>
              {radio.country && <div className="info-row"><span>Country</span><span>{radio.country}</span></div>}
              {radio.interfaces.length > 0 && (
                <div className="wifi-networks">
                  <h4>Networks</h4>
                  {radio.interfaces.map((net) => (
                    <div key={net.ifname} className="wifi-net-item">
                      <div className="wifi-ssid">{net.ssid || "(hidden)"}</div>
                      <div className="wifi-meta">
                        <span>{net.mode}</span>
                        <span>·</span>
                        <span>{net.encryption}</span>
                        {net.signal != null && <><span>·</span><span>{net.signal} dBm</span></>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
