import { invoke } from "@tauri-apps/api/core";

export interface LoginResult {
  session: string;
  board: any;
  info: any;
}

export interface UciResult {
  config: string;
  raw: any;
}

export async function login(
  host: string,
  port: number,
  username: string,
  password: string
): Promise<LoginResult> {
  return invoke("cmd_login", { host, port, username, password });
}

export async function getSystemBoard(
  host: string,
  port: number,
  session: string
): Promise<any> {
  return invoke("cmd_get_system_board", { host, port, session });
}

export async function getSystemInfo(
  host: string,
  port: number,
  session: string
): Promise<any> {
  return invoke("cmd_get_system_info", { host, port, session });
}

export async function getNetworkInterfaces(
  host: string,
  port: number,
  session: string
): Promise<any> {
  return invoke("cmd_get_network_interfaces", { host, port, session });
}

export async function getWirelessDevices(
  host: string,
  port: number,
  session: string
): Promise<any> {
  return invoke("cmd_get_wireless_devices", { host, port, session });
}

export async function getUciConfig(
  host: string,
  port: number,
  session: string,
  config: string
): Promise<UciResult> {
  return invoke("cmd_get_uci_config", { host, port, session, config });
}

export async function getAssoclist(host: string, port: number, session: string, device: string): Promise<any> {
  return invoke("cmd_get_assoclist", { host, port, session, device });
}

export async function reboot(
  host: string,
  port: number,
  session: string
): Promise<void> {
  return invoke("cmd_reboot", { host, port, session });
}

// ---- Storage helpers ----

const DEVICES_KEY = "openwrt_devices";

export interface StoredDevice {
  id: string;
  name: string;
  host: string;
  port: number;
  useTls: boolean;
  username: string;
  password?: string;
}

export function getStoredDevices(): StoredDevice[] {
  try {
    const raw = localStorage.getItem(DEVICES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDevices(devices: StoredDevice[]) {
  localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
}
