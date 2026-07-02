import { useState, useEffect } from "react";
import { type StoredDevice, getNetworkInterfaces, getUciConfig } from "../services/ubus";
import LoginPrompt from "../components/LoginPrompt";

interface Props { device: StoredDevice; session: string; onLogin: (s: string) => void; onNavigate: (p: string) => void; }

export default function Routes({ device, session, onLogin }: Props) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [staticRoutes, setStaticRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      getNetworkInterfaces(device.host, device.port, session),
      getUciConfig(device.host, device.port, session, "network"),
    ]).then(([dump, uci]) => {
      const active: any[] = [];
      if (dump?.interface) {
        for (const iface of dump.interface) {
          if (iface.route) {
            for (const r of iface.route) {
              active.push({ ...r, interface: iface.interface, proto: iface.proto });
            }
          }
        }
      }
      setRoutes(active);

      const static_list: any[] = [];
      for (const [id, data] of Object.entries(uci.raw?.values || {})) {
        const d = data as any;
        if (d[".type"] === "route" || d[".type"] === "route6") {
          static_list.push({ id, ...d, type: d[".type"] });
        }
      }
      setStaticRoutes(static_list);
    }).catch(console.error).finally(() => setLoading(false));
  }, [session, device.host, device.port]);

  if (!session) return <LoginPrompt device={device} onLogin={onLogin} />;

  return (
    <div className="page">
      <div className="page-header"><h2>Routes</h2></div>
      {loading ? <div className="skeleton">{[1,2].map(i => <div key={i} className="skeleton-line" />)}</div> : (
        <>
          <h3>Active Routes</h3>
          <div className="uci-list">{routes.map((r, i) => <div key={i} className="uci-item">
            <strong className="mono">{r.target}/{r.mask || 0}</strong>
            <div className="muted">{r.nexthop ? `via ${r.nexthop} ` : ""}dev {r.interface} {r.metric ? `metric ${r.metric}` : ""}</div>
          </div>)}</div>
          <h3>Static Routes</h3>
          <div className="uci-list">{staticRoutes.map((r) => <div key={r.id} className="uci-item">
            <strong>{r.name || r.id}</strong>
            <div className="muted">{r.target || "?"} → {r.gateway || r.interface || "?"}</div>
          </div>)}</div>
        </>
      )}
    </div>
  );
}
