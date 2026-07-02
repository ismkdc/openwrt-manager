use crate::ubus;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub use_tls: bool,
    pub username: String,
}

#[derive(Serialize)]
pub struct LoginResult {
    pub session: String,
    pub board: Value,
    pub info: Value,
}

#[derive(Serialize)]
pub struct UciResult {
    pub config: String,
    pub raw: Value,
}

// ---- Login & Device Info ----

#[tauri::command]
pub async fn cmd_login(host: String, port: u16, username: String, password: String) -> Result<LoginResult, String> {
    let scheme = if port == 443 { "https" } else { "http" };
    let base_url = format!("{}://{}:{}", scheme, host, port);

    let session = ubus::login(&base_url, &username, &password)
        .await
        .map_err(|e| e.to_string())?;

    let board = ubus::get_system_board(&base_url, &session)
        .await
        .map_err(|e| e.to_string())?;

    let info = ubus::get_system_info(&base_url, &session)
        .await
        .map_err(|e| e.to_string())?;

    Ok(LoginResult { session, board, info })
}

#[tauri::command]
pub async fn cmd_get_system_board(host: String, port: u16, session: String) -> Result<Value, String> {
    let scheme = if port == 443 { "https" } else { "http" };
    let base_url = format!("{}://{}:{}", scheme, host, port);
    ubus::get_system_board(&base_url, &session).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_system_info(host: String, port: u16, session: String) -> Result<Value, String> {
    let scheme = if port == 443 { "https" } else { "http" };
    let base_url = format!("{}://{}:{}", scheme, host, port);
    ubus::get_system_info(&base_url, &session).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_network_interfaces(host: String, port: u16, session: String) -> Result<Value, String> {
    let scheme = if port == 443 { "https" } else { "http" };
    let base_url = format!("{}://{}:{}", scheme, host, port);
    ubus::get_network_interfaces(&base_url, &session).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_wireless_devices(host: String, port: u16, session: String) -> Result<Value, String> {
    let scheme = if port == 443 { "https" } else { "http" };
    let base_url = format!("{}://{}:{}", scheme, host, port);
    ubus::get_wireless_devices(&base_url, &session).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_uci_config(host: String, port: u16, session: String, config: String) -> Result<UciResult, String> {
    let scheme = if port == 443 { "https" } else { "http" };
    let base_url = format!("{}://{}:{}", scheme, host, port);
    let raw = ubus::get_uci_config(&base_url, &session, &config)
        .await
        .map_err(|e| e.to_string())?;
    Ok(UciResult { config, raw })
}

#[tauri::command]
pub async fn cmd_get_assoclist(host: String, port: u16, session: String, device: String) -> Result<Value, String> {
    let scheme = if port == 443 { "https" } else { "http" };
    let base_url = format!("{}://{}:{}", scheme, host, port);
    ubus::get_assoclist(&base_url, &session, &device).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_reboot(host: String, port: u16, session: String) -> Result<(), String> {
    let scheme = if port == 443 { "https" } else { "http" };
    let base_url = format!("{}://{}:{}", scheme, host, port);
    ubus::reboot(&base_url, &session).await.map_err(|e| e.to_string())?;
    Ok(())
}
