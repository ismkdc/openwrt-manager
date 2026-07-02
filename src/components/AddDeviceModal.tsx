import { useState } from "react";
import type { StoredDevice } from "../services/ubus";
import { Wifi } from "lucide-react";

interface Props {
  onClose: () => void;
  onAdd: (device: StoredDevice) => void;
}

export default function AddDeviceModal({ onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(80);
  const [useTls, setUseTls] = useState(false);
  const [username, setUsername] = useState("root");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim() || host.trim(),
      host: host.trim(),
      port,
      useTls,
      username: username.trim() || "root",
      password: password, // stored but not exposed in type
    } as StoredDevice);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon"><Wifi size={24} /></div>
          <h2>Add OpenWrt Device</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Name <input type="text" placeholder="Home Router" value={name} onChange={(e) => setName(e.target.value)} /></label>
          </div>
          <div className="form-row">
            <label>Host / IP * <input type="text" placeholder="192.168.1.1" value={host} onChange={(e) => setHost(e.target.value)} required autoFocus /></label>
          </div>
          <div className="form-row form-row-inline">
            <label style={{ flex: 1 }}>Port <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} /></label>
            <label className="checkbox-label">
              <input type="checkbox" checked={useTls} onChange={(e) => setUseTls(e.target.checked)} />
              HTTPS
            </label>
          </div>
          <div className="form-row">
            <label>Username <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} /></label>
          </div>
          <div className="form-row">
            <label>Password * <input type="password" placeholder="root password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add & Connect</button>
          </div>
        </form>
      </div>
    </div>
  );
}
