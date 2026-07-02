import { useState, useEffect } from "react";
import type { StoredDevice } from "./services/ubus";
import { saveDevices, getStoredDevices } from "./services/ubus";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Network from "./pages/Network";
import WirelessPage from "./pages/WirelessPage";
import Firewall from "./pages/Firewall";
import DHCP from "./pages/DHCP";
import Routes from "./pages/Routes";
import System from "./pages/System";
import AddDeviceModal from "./components/AddDeviceModal";

export type Page =
  | "dashboard" | "network" | "wireless"
  | "firewall" | "dhcp" | "routes" | "system";

export default function App() {
  const [devices, setDevices] = useState<StoredDevice[]>(getStoredDevices());
  const [activeDevice, setActiveDevice] = useState<StoredDevice | null>(null);
  const [session, setSession] = useState<string>("");
  const [page, setPage] = useState("dashboard");
  const navigate = (p: string) => setPage(p);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => { saveDevices(devices); }, [devices]);

  const selectDevice = (d: StoredDevice) => { setActiveDevice(d); setSession(""); };
  const removeDevice = (id: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    if (activeDevice?.id === id) { setActiveDevice(null); setSession(""); }
  };
  const addDevice = (d: StoredDevice) => {
    setDevices((prev) => [...prev, d]);
    setActiveDevice(d);
    setSession("");
  };

  const renderPage = () => {
    if (!activeDevice) {
      return (
        <div className="no-device">
          <div className="no-device-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg></div>
          <h2>No Device Selected</h2>
          <p>Add an OpenWrt device to manage it</p>
          <button className="btn btn-primary" onClick={() => setShowAddDevice(true)}>Add Device</button>
        </div>
      );
    }

    const common = { device: activeDevice, session, onLogin: setSession, onNavigate: navigate };

    switch (page) {
      case "dashboard": return <Dashboard {...common} />;
      case "network": return <Network {...common} />;
      case "wireless": return <WirelessPage {...common} />;
      case "firewall": return <Firewall {...common} />;
      case "dhcp": return <DHCP {...common} />;
      case "routes": return <Routes {...common} />;
      case "system": return <System {...common} />;
      default: return <Dashboard {...common} />;
    }
  };

  return (
    <div className="app">
      <Sidebar
        devices={devices} activeDevice={activeDevice} activePage={page}
        onSelectDevice={selectDevice} onRemoveDevice={removeDevice}
        onAddDevice={() => setShowAddDevice(true)} onNavigate={navigate}
        collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="main-content">{renderPage()}</main>
      {showAddDevice && (
        <AddDeviceModal
          onClose={() => setShowAddDevice(false)}
          onAdd={addDevice}
        />
      )}
    </div>
  );
}
