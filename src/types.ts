export interface Device {
  id: string;
  name: string;
  host: string;
  port: number;
  useTls: boolean;
  username: string;
}

export interface SystemBoard {
  kernel: string;
  hostname: string;
  system: string;
  model: string;
  board_name?: string;
  release?: {
    distribution: string;
    version: string;
    revision: string;
    target: string;
    description: string;
  };
}

export interface SystemInfo {
  uptime: number;
  localtime: number;
  load: number[];
  memory: {
    total: number;
    free: number;
    available: number;
    cached: number;
    buffered: number;
    shared: number;
  };
  root?: { total: number; free: number; used: number; avail: number };
  tmp?: { total: number; free: number; used: number; avail: number };
  swap?: { total: number; free: number };
}

export interface NetworkInterface {
  name: string;
  type: string;
  up: boolean;
  ipv4: string[];
  ipv6: string[];
  device: string;
}

export interface WirelessRadio {
  name: string;
  channel: number | null;
  frequency: number | null;
  txpower: number | null;
  country: string | null;
  band: string;
  up: boolean;
  interfaces: WirelessNetwork[];
}

export interface WirelessNetwork {
  ifname: string;
  ssid: string;
  mode: string;
  encryption: string;
  signal: number | null;
  channel: number | null;
  bssid: string | null;
}

export interface UciSection {
  id: string;
  type: string;
  values: Record<string, string>;
}
