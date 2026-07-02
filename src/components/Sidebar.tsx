import { Gauge, Cable, Wifi, ShieldCheck, Server, ArrowLeftRight, Settings, ChevronLeft, ChevronRight, Plus, Trash2, LogIn } from "lucide-react";
import type { StoredDevice } from "../services/ubus";

interface SidebarProps {
  devices: StoredDevice[];
  activeDevice: StoredDevice | null;
  activePage: string;
  onSelectDevice: (d: StoredDevice) => void;
  onRemoveDevice: (id: string) => void;
  onAddDevice: () => void;
  onNavigate: (p: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: { page: string; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Dashboard", icon: <Gauge size={18} /> },
  { page: "network", label: "Network", icon: <Cable size={18} /> },
  { page: "wireless", label: "Wireless", icon: <Wifi size={18} /> },
  { page: "firewall", label: "Firewall", icon: <ShieldCheck size={18} /> },
  { page: "dhcp", label: "DHCP & DNS", icon: <Server size={18} /> },
  { page: "routes", label: "Routes", icon: <ArrowLeftRight size={18} /> },
  { page: "system", label: "System", icon: <Settings size={18} /> },
];

export default function Sidebar({
  devices, activeDevice, activePage, onSelectDevice, onRemoveDevice,
  onAddDevice, onNavigate, collapsed, onToggleCollapse,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <h1><Wifi size={20} style={{ display: "inline", marginRight: 8 }} />OpenWrt</h1>}
        {collapsed && <Wifi size={20} />}
      </div>

      {devices.length > 0 && (
        <div className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title">Devices</div>}
          {devices.map((d) => (
            <div
              key={d.id}
              className={`device-item ${activeDevice?.id === d.id ? "active" : ""}`}
              onClick={() => onSelectDevice(d)}
              title={collapsed ? d.name || d.host : undefined}
            >
              <span className="device-icon"><LogIn size={16} /></span>
              {!collapsed && (
                <>
                  <span className="device-name">{d.name || d.host}</span>
                  <span className="device-host">{d.host}</span>
                  <button className="device-remove" onClick={(e) => { e.stopPropagation(); onRemoveDevice(d.id); }} title="Remove">
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-secondary sidebar-add" onClick={onAddDevice}>
        <Plus size={16} />{!collapsed && " Add Device"}
      </button>

      {activeDevice && (
        <div className="sidebar-section">
          {!collapsed && <div className="sidebar-section-title">Navigation</div>}
          {navItems.map((item) => (
            <div
              key={item.page}
              className={`nav-item ${activePage === item.page ? "active" : ""}`}
              onClick={() => onNavigate(item.page)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="sidebar-spacer" />
      <button className="collapse-btn" onClick={onToggleCollapse}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
