import { useState, useEffect } from "react";
import { login } from "../services/ubus";
import type { StoredDevice } from "../services/ubus";
import { Lock } from "lucide-react";

interface Props {
  device: StoredDevice;
  onLogin: (session: string) => void;
}

export default function LoginPrompt({ device, onLogin }: Props) {
  const [password, setPassword] = useState(device.password || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-login if password is saved
  useEffect(() => {
    if (device.password && !loading) {
      handleLogin();
    }
  }, []);

  const handleLogin = async () => {
    const pw = password || device.password;
    if (!pw) return;
    setLoading(true);
    setError("");
    try {
      const result = await login(device.host, device.port, device.username, pw);
      onLogin(result.session);
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-prompt">
      <div className="login-card">
        <div className="login-icon"><Lock size={32} /></div>
        <h2>Connect to {device.name}</h2>
        <p className="login-host">{device.username}@{device.host}</p>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoFocus={!device.password}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" onClick={handleLogin} disabled={loading || !password}>
          {loading ? "Connecting..." : "Connect"}
        </button>
      </div>
    </div>
  );
}
